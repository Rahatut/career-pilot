from openai import AsyncOpenAI

from shared.config import settings

client = AsyncOpenAI(api_key=settings.openai_api_key) if settings.openai_api_key else None


async def generate_roadmap(
    target_role: str,
    missing_skills: list[str],
    current_level: str | None = None,
    weeks: int = 8,
) -> list[dict]:
    """
    Generate a learning roadmap using gpt-4o-mini.
    Falls back to a static demo roadmap when OPENAI_API_KEY is not set.
    Returns a flat list[dict] (JSONB array) — NOT wrapped in {"weeks": [...]}.
    """
    if not client:
        return _demo_roadmap(target_role, missing_skills, weeks)

    missing_str = ", ".join(missing_skills) if missing_skills else "general skills"
    level_hint = f"Current level: {current_level}. " if current_level else ""

    prompt = f"""You are a career roadmap generator. Generate a {weeks}-week learning plan.

Target Role: {target_role}
{level_hint}
Missing Skills: {missing_str}

For each week, provide:
- week number (1-{weeks})
- title (short, catchy title for the week)
- description (2-3 sentences of what to learn and why)
- resources (a list of 2-3 free online resource titles/URLs)
- completed (false by default)

Return ONLY a JSON array (no extra text), where each element is:
{{"week": N, "title": "...", "description": "...", "resources": [...], "completed": false}}

Do not wrap in {{"weeks": [...]}}. Return a raw JSON array.
"""

    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": "You are a helpful career roadmap assistant. Return ONLY valid JSON.",
            },
            {"role": "user", "content": prompt},
        ],
        temperature=0.7,
        max_tokens=2000,
        response_format={"type": "json_object"},
    )

    raw = response.choices[0].message.content or "[]"
    try:
        result = json.loads(raw)
        if isinstance(result, dict) and "weeks" in result:
            return result["weeks"]
        elif isinstance(result, list):
            return result
        else:
            return []
    except json.JSONDecodeError:
        return []


def _demo_roadmap(target_role: str, missing_skills: list[str], weeks: int) -> list[dict]:
    """Static demo roadmap returned when no OpenAI API key is configured."""
    topics = [
        ("Foundations & Core Concepts", ["Free Online Courses", "MDN Web Docs", "Official Documentation"]),
        ("Building Real Projects", ["GitHub Learning Lab", "Frontend Mentor", "Codecademy Projects"]),
        ("Testing & Best Practices", ["Jest Docs", "React Testing Library", "Playwright Tutorial"]),
        ("Performance Optimization", ["Web.dev", "Lighthouse Guide", "Chrome DevTools"]),
        ("Advanced Patterns", ["Design Patterns", "Refactoring Guru", "Clean Code Book"]),
        ("DevOps & Deployment", ["Docker Basics", "GitHub Actions", "Vercel/Netlify Guides"]),
        ("Soft Skills & Portfolio", ["Portfolio Template", "LinkedIn Optimization", "Interview Prep"]),
        ("Career Strategy", ["Tech Resume Guide", "Networking Tips", "Salary Negotiation"]),
    ]
    result = []
    for i, (topic, resources) in enumerate(topics[:weeks]):
        result.append({
            "week": i + 1,
            "title": f"Week {i+1}: {topic}",
            "description": f"Build your skills in {topic} to move towards {target_role}. "
                          f"Focus on the key areas needed for this role.",
            "resources": resources,
            "completed": False,
        })
    return result
