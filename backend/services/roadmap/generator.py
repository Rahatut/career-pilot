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
    if not _get_client():
        return _demo_roadmap(target_role, missing_skills, weeks)

    missing_str = ", ".join(missing_skills) if missing_skills else "general skills"
    level_hint = f"Current level: {current_level}. " if current_level else ""

    prompt = f"""You are a career roadmap generator. Generate a {weeks}-week learning plan.

Target Role: {target_role}
{level_hint}
Missing Skills: {missing_str}

For each week, provide:
- week number (1-{weeks})
- skill (the main skill/theme for this week)
- milestones (array of 3-4 specific learning tasks)
- resources (a list of 2-3 free online resource objects with title, type, duration, url)
- status (one of: "done", "current", "locked")

Return ONLY a JSON array (no extra text), where each element is:
{{"week": N, "skill": "...", "milestones": [...], "resources": [{{"title": "...", "type": "article|video|course|practice", "duration": "...", "url": "..."}}, ...], "status": "locked"}}

Do not wrap in {{"weeks": [...]}}. Return a raw JSON array. The first week should have status "current", rest "locked".
"""

    response = await _get_client().chat.completions.create(
        model="gemini-1.5-flash-latest",
        messages=[
            {
                "role": "system",
                "content": "You are a helpful career roadmap assistant. Return ONLY valid JSON.",
            },
            {"role": "user", "content": prompt},
        ],
        temperature=0.7,
        max_tokens=2000,
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
        ("Python & Fundamentals", "Solidify core Python and CS basics"),
        ("Machine Learning Core", "Cover supervised learning fundamentals"),
        ("Deep Learning & PyTorch", "Neural networks and PyTorch workflow"),
        ("NLP & Transformers", "HuggingFace, BERT, and fine-tuning"),
        ("System Design Basics", "Core distributed systems concepts"),
        ("MLOps & Deployment", "Deploy ML models to production"),
        ("Interview Prep", "LC medium, behaviorals, and mock interviews"),
        ("Apply & Polish", "Applications, portfolio, and final prep"),
    ]
    resources_map = {
        "Python & Fundamentals": [
            {"title": "CS50P — Python for CS", "type": "course", "duration": "8h", "url": "https://cs50.harvard.edu/python/2022/"},
            {"title": "Big-O explained visually", "type": "article", "duration": "20min", "url": "https://www.bigocheatsheet.com/"},
            {"title": "LeetCode easy track", "type": "practice", "duration": "ongoing", "url": "https://leetcode.com/tag/easy/"},
        ],
        "Machine Learning Core": [
            {"title": "Andrew Ng's ML Course (Week 1–3)", "type": "course", "duration": "12h", "url": "https://www.coursera.org/learn/machine-learning"},
            {"title": "Scikit-learn docs", "type": "article", "duration": "2h", "url": "https://scikit-learn.org/stable/user_guide.html"},
            {"title": "Kaggle Titanic starter", "type": "practice", "duration": "3h", "url": "https://www.kaggle.com/c/titanic"},
        ],
        "Deep Learning & PyTorch": [
            {"title": "fast.ai Practical Deep Learning", "type": "course", "duration": "10h", "url": "https://course.fast.ai/"},
            {"title": "PyTorch 60-min blitz", "type": "article", "duration": "1h", "url": "https://pytorch.org/tutorials/beginner/deep_learning_60min_blitz.html"},
            {"title": "3Blue1Brown neural networks", "type": "video", "duration": "3h", "url": "https://www.youtube.com/playlist?list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi"},
        ],
        "NLP & Transformers": [
            {"title": "HuggingFace NLP course", "type": "course", "duration": "8h", "url": "https://huggingface.co/learn/nlp-course/"},
            {"title": "Attention is All You Need (paper)", "type": "article", "duration": "2h", "url": "https://arxiv.org/abs/1706.03762"},
            {"title": "Fine-tuning walkthrough video", "type": "video", "duration": "1.5h", "url": "https://www.youtube.com/watch?v=eC6HdVpv_6o"},
        ],
        "System Design Basics": [
            {"title": "System Design Primer (GitHub)", "type": "article", "duration": "6h", "url": "https://github.com/donnemartin/system-design-primer"},
            {"title": "Designing Data-Intensive Applications", "type": "course", "duration": "10h", "url": "https://dataintensiveapplications.com/"},
            {"title": "Grokking System Design", "type": "course", "duration": "8h", "url": "https://www.educative.io/courses/grokking-the-system-design-interview"},
        ],
        "MLOps & Deployment": [
            {"title": "MLOps Zoomcamp", "type": "course", "duration": "12h", "url": "https://github.com/DataTalksClub/mlops-zoomcamp"},
            {"title": "FastAPI + Docker tutorial", "type": "video", "duration": "2h", "url": "https://www.youtube.com/watch?v=0sOvCWFmrtA"},
            {"title": "GitHub Actions for ML", "type": "article", "duration": "1h", "url": "https://docs.github.com/en/actions"},
        ],
        "Interview Prep": [
            {"title": "Neetcode 150 roadmap", "type": "practice", "duration": "ongoing", "url": "https://neetcode.io/roadmap"},
            {"title": "Tech Interview Handbook", "type": "article", "duration": "3h", "url": "https://www.techinterviewhandbook.org/"},
            {"title": "Pramp mock interviews", "type": "practice", "duration": "ongoing", "url": "https://www.pramp.com/"},
        ],
        "Apply & Polish": [
            {"title": "CV LaTeX template", "type": "article", "duration": "1h", "url": "https://github.com/posquit0/Awesome-CV"},
            {"title": "Levels.fyi job board", "type": "practice", "duration": "ongoing", "url": "https://www.levels.fyi/jobs/"},
            {"title": "Cold email templates", "type": "article", "duration": "30min", "url": "https://github.com/jgrahamc/cold-emails"},
        ],
    }
    result = []
    for i, (topic, focus) in enumerate(topics[:weeks]):
        status = "current" if i == 0 else "locked"
        result.append({
            "week": i + 1,
            "skill": topic,
            "milestones": [focus],
            "resources": resources_map.get(topic, []),
            "status": status,
        })
    return result
