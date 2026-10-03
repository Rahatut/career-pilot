from typing import Literal

from openai import AsyncOpenAI

from shared.config import settings

INTENTS = Literal["job_readiness", "skill_gap", "roadmap", "cover_letter", "general"]

INTENT_DESCRIPTIONS = {
    "job_readiness": "User asks how ready they are for a job, role, or position.",
    "skill_gap": "User asks about missing skills, what to learn, gaps in their knowledge.",
    "roadmap": "User asks for a learning plan, study path, or how to get from where they are to a goal.",
    "cover_letter": "User asks to write, improve, or review a cover letter.",
    "general": "Any other question — casual chat or anything else.",
}

SYSTEM_PROMPT = (
    "Classify the user message into exactly one intent: "
    + ", ".join(INTENTS.__args__)  # type: ignore
    + ". Return ONLY the intent label, nothing else."
)


def _get_client() -> AsyncOpenAI | None:
    if not settings.openai_api_key:
        return None
    return AsyncOpenAI(
        api_key=settings.openai_api_key,
        base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
    )


async def classify_intent(text: str) -> str:
    """Classify user message into one of 5 intents using gpt-4o-mini."""
    client = _get_client()
    if not client:
        return _keyword_intent(text)

    try:
        response = await client.chat.completions.create(
            model="gemini-1.5-flash",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": text[:500]},
            ],
            max_tokens=20,
            temperature=0,
        )
        intent = response.choices[0].message.content.strip().lower()
        if intent in INTENT_DESCRIPTIONS:
            return intent
        return "general"
    except Exception:
        return "general"


def _keyword_intent(text: str) -> str:
    """Simple keyword-based fallback when no API key."""
    t = text.lower()
    if any(k in t for k in ["ready", "qualified", "fit for", "match for"]):
        return "job_readiness"
    if any(k in t for k in ["missing", "gap", "skills i need", "what should i learn"]):
        return "skill_gap"
    if any(k in t for k in ["roadmap", "learning plan", "study plan"]):
        return "roadmap"
    if any(k in t for k in ["cover letter", "motivation letter"]):
        return "cover_letter"
    return "general"
