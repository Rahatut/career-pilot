from typing import Any

from openai import OpenAI

from shared.config import settings
from shared.db import SessionLocal
from shared.models import CV, CVSection

_client: OpenAI | None = None


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(
            api_key=settings.openai_api_key,
            base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
        )
    return _client


def _call_llm(system_prompt: str, user_prompt: str) -> str:
    api_key = settings.openai_api_key
    if not api_key:
        return "LLM not configured. Set OPENAI_API_KEY in .env"

    try:
        client = _get_client()
        response = client.chat.completions.create(
            model="gemini-1.5-flash-latest",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            max_tokens=800,
            temperature=0.7,
        )
        return response.choices[0].message.content or ""
    except Exception as e:
        return f"Error generating response: {e}"


def _get_cv_sections(user_id: str) -> list[CVSection]:
    db = SessionLocal()
    try:
        cv = db.query(CV).filter(CV.user_id == user_id, CV.is_active == True).first()
        if not cv:
            return []
        return (
            db.query(CVSection)
            .filter(CVSection.cv_id == cv.id)
            .order_by(CVSection.order_index.asc())
            .all()
        )
    finally:
        db.close()


SYSTEM_COVER_LETTER = """You are a professional career coach writing cover letters.
Based on the user's CV and the job description, write a compelling cover letter.
Be specific, not generic. Reference actual skills and experience from the CV.
Keep it to 3-4 short paragraphs (under 400 words).
Format it professionally."""


SYSTEM_SKILL_GAP = """You are a career skills analyst. Given a user's CV and a target role,
identify: (1) skills the user already has that match the role, (2) skills missing or weak,
(3) specific recommendations to close each gap. Be actionable and specific.
Return your response as JSON with keys: "matched_skills", "missing_skills", "recommendations"."""


SYSTEM_READINESS = """You are a job readiness assessor. Given a user's CV and a job description,
assess: (1) overall fit, (2) strong points, (3) weak points, (4) what to do to improve readiness.
Return your response as JSON with keys: "fit_score", "strong_points", "weak_points", "improvement_tips"."""


def cover_letter(user_id: str, jd_text: str) -> dict[str, Any]:
    """Generate a cover letter based on user's CV and job description."""
    sections = _get_cv_sections(user_id)

    # Build CV text from sections
    cv_text = ""
    if sections:
        for sec in sections:
            cv_text += f"[{sec.section_type}]:\n{sec.content}\n\n"
    else:
        cv_text = "No CV uploaded yet"

    user_prompt = f"""User's CV:
{cv_text}

Job Description:
{jd_text}

Write the cover letter:"""

    result = _call_llm(SYSTEM_COVER_LETTER, user_prompt)
    return {"cover_letter": result}


def skill_gap(user_id: str, target_role: str) -> dict[str, Any]:
    """Analyze skill gaps between user's CV and target role."""
    sections = _get_cv_sections(user_id)

    cv_text = ""
    if sections:
        for sec in sections:
            cv_text += f"[{sec.section_type}]:\n{sec.content}\n\n"
    else:
        cv_text = "No CV uploaded yet"

    user_prompt = f"""User's CV:
{cv_text}

Target Role: {target_role}

Analyze the skill gap:"""

    response = _call_llm(SYSTEM_SKILL_GAP, user_prompt)

    import json
    try:
        data = json.loads(response)
        return {
            "matched_skills": data.get("matched_skills", []),
            "missing_skills": data.get("missing_skills", []),
            "recommendations": data.get("recommendations", response),
            "target_role": target_role,
        }
    except Exception:
        return {
            "matched_skills": [],
            "missing_skills": [],
            "recommendations": response,
            "target_role": target_role,
        }


def readiness_check(user_id: str, jd_text: str) -> dict[str, Any]:
    """Check job readiness based on CV vs job description."""
    sections = _get_cv_sections(user_id)

    cv_text = ""
    if sections:
        for sec in sections:
            cv_text += f"[{sec.section_type}]:\n{sec.content}\n\n"
    else:
        cv_text = "No CV uploaded yet"

    user_prompt = f"""User's CV:
{cv_text}

Job Description:
{jd_text}

Assess job readiness:"""

    response = _call_llm(SYSTEM_READINESS, user_prompt)

    import json
    try:
        data = json.loads(response)
        return {
            "fit_score": data.get("fit_score", 0),
            "strong_points": data.get("strong_points", ""),
            "weak_points": data.get("weak_points", ""),
            "improvement_tips": data.get("improvement_tips", ""),
        }
    except Exception:
        return {
            "fit_score": 0,
            "notes": response,
        }


def generate_roadmap(user_id: str, role: str, weeks: int = 8) -> dict[str, Any]:
    """Generate a learning roadmap for target role."""
    # Avoid circular import
    import importlib
    mod = importlib.import_module("services.roadmap.generator")
    result = mod.generate_roadmap(role, [], "mid", weeks)
    return {"roadmap": result}
