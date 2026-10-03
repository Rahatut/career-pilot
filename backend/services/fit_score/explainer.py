import json

from openai import AsyncOpenAI

from shared.config import settings


def _get_client() -> AsyncOpenAI | None:
    if not settings.openai_api_key:
        return None
    return AsyncOpenAI(
        api_key=settings.openai_api_key,
        base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
    )


async def explain_score(score: int, breakdown: dict, job_title: str | None, missing_skills: list[str]) -> str:
    """
    Generate a human-readable explanation of a fit score using gpt-4o-mini.
    Falls back to a static message when OPENAI_API_KEY is not set.
    """
    client = _get_client()
    if not client:
        skills_text = ", ".join(missing_skills) if missing_skills else "none"
        return (
            f"Your fit score for {job_title or 'this role'} is {score}/100. "
            f"Focus on building skills in: {skills_text}. "
            "Keep applying and keep improving!"
        )

    breakdown_text = json.dumps(breakdown, indent=2)

    prompt = f"""You are a career coach explaining a job fit score to a candidate.

Job Title: {job_title or "Unknown position"}
Fit Score: {score}/100

Score Breakdown:
{breakdown_text}

Missing Skills: {", ".join(missing_skills) if missing_skills else "None"}

Write a brief, encouraging, and actionable explanation (2-3 sentences) of why this score was given and what the candidate can do to improve.
"""

    response = await client.chat.completions.create(
        model="gemini-1.5-flash",
        messages=[
            {
                "role": "system",
                "content": "You are a helpful career assistant. Provide concise, encouraging feedback.",
            },
            {"role": "user", "content": prompt},
        ],
        temperature=0.7,
        max_tokens=300,
    )

    return response.choices[0].message.content or "Could not generate explanation."
