import asyncio
from datetime import datetime, timedelta, timezone

from openai import AsyncOpenAI
from sqlalchemy.orm import Session

from shared.config import settings
from shared.models import (
    FitScore,
    Goal,
    Job,
    JobApplication,
    Roadmap,
    Task,
)


def _get_client() -> AsyncOpenAI | None:
    if not settings.openai_api_key:
        return None
    return AsyncOpenAI(
        api_key=settings.openai_api_key,
        base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
    )


def calculate_streak(applications: list[JobApplication]) -> int:
    """Calculate current submission streak (consecutive days with at least one application)."""
    if not applications:
        return 0

    dates = sorted(
        set(a.submitted_at.date() for a in applications if a.submitted_at)
    )
    if not dates:
        return 0

    today = datetime.now(timezone.utc).date()
    streak = 0
    expected = today

    for d in reversed(dates):
        if d == expected or d == expected - timedelta(days=1):
            streak += 1
            expected = d - timedelta(days=1)
        else:
            break

    return streak


def get_top_matches(db: Session, user_id: str, limit: int = 5) -> list[dict]:
    """Get top N job matches by fit score."""
    scores = (
        db.query(FitScore)
        .filter(FitScore.user_id == user_id)
        .order_by(FitScore.score.desc())
        .limit(limit)
        .all()
    )
    results = []
    for fs in scores:
        job = db.query(Job).filter(Job.id == fs.job_id).first()
        if job:
            results.append({
                "job_id": str(fs.job_id),
                "title": job.title,
                "company": job.company,
                "score": fs.score,
                "url": job.url,
            })
    return results


def get_pending_tasks(db: Session, user_id: str) -> list[dict]:
    """Get incomplete tasks ordered by deadline."""
    tasks = (
        db.query(Task)
        .filter(Task.user_id == user_id, Task.is_completed == False)
        .order_by(Task.deadline.asc().nullslast())
        .limit(10)
        .all()
    )
    return [
        {
            "task_id": str(t.id),
            "title": t.title,
            "deadline": t.deadline.isoformat() if t.deadline else None,
            "goal_id": str(t.goal_id) if t.goal_id else None,
        }
        for t in tasks
    ]


async def generate_nudge(db: Session, user_id: str) -> str:
    """
    Generate an AI nudge based on the user's dashboard state.
    """
    # Parallel data fetch
    goals, apps, roadmap = await asyncio.gather(
        asyncio.to_thread(lambda: db.query(Goal).filter(Goal.user_id == user_id).all()),
        asyncio.to_thread(lambda: db.query(JobApplication).filter(JobApplication.user_id == user_id).all()),
        asyncio.to_thread(lambda: db.query(Roadmap).filter(Roadmap.user_id == user_id).first()),
    )

    active_goals = [g for g in goals if g.is_active]
    completed_apps = [a for a in apps if a.status == "interview"]
    streak = calculate_streak(apps)

    context_parts = []
    if active_goals:
        goal_names = ", ".join(g.title for g in active_goals[:3])
        context_parts.append(f"Active goals: {goal_names}")
    if completed_apps:
        context_parts.append(f"{len(completed_apps)} interviews landed")
    if roadmap:
        total = len(roadmap.content or [])
        done = roadmap.weeks_completed or 0
        pct = round(done / total * 100) if total else 0
        context_parts.append(f"Roadmap: {pct}% complete ({done}/{total} weeks)")

    streak_msg = f" {streak}-day application streak!" if streak >= 3 else ""
    context_str = "; ".join(context_parts) if context_parts else "No active data"

    prompt = f"""You are an encouraging career assistant. The user has the following career activity:

{context_str}{streak_msg}

Write a short, motivating nudge (1 sentence, max 20 words) to inspire them to keep going.
"""

    try:
        client = _get_client()
        if not client:
            return "Keep pushing forward!"
        response = await client.chat.completions.create(
            model="gemini-1.5-flash-latest",
            messages=[
                {"role": "system", "content": "You are a motivational career assistant."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.8,
            max_tokens=50,
        )
        return response.choices[0].message.content or "Keep pushing forward!"
    except Exception:
        return "Keep pushing forward!"


async def build_dashboard(db: Session, user_id: str) -> dict:
    """
    Build the full dashboard dict by fetching data concurrently.
    """
    # Parallel data fetch
    goals, apps, roadmap, top_matches = await asyncio.gather(
        asyncio.to_thread(lambda: db.query(Goal).filter(Goal.user_id == user_id).all()),
        asyncio.to_thread(lambda: db.query(JobApplication).filter(JobApplication.user_id == user_id).order_by(JobApplication.submitted_at.desc()).all()),
        asyncio.to_thread(lambda: db.query(Roadmap).filter(Roadmap.user_id == user_id).first()),
        asyncio.to_thread(lambda: None),  # top_matches needs db, handled below
    )

    pending_tasks = get_pending_tasks(db, user_id)
    matches = get_top_matches(db, user_id, limit=5)
    streak = calculate_streak(apps)
    nudge = await generate_nudge(db, user_id)

    return {
        "user_id": user_id,
        "goals_count": len([g for g in goals if g.is_active]),
        "applications_total": len(apps),
        "applications_streak": streak,
        "pending_tasks": pending_tasks,
        "top_matches": matches,
        "roadmap_progress": {
            "target_role": roadmap.target_role if roadmap else None,
            "weeks_completed": roadmap.weeks_completed or 0,
            "total_weeks": len(roadmap.content or []) if roadmap else 0,
        },
        "nudge": nudge,
    }
