"""
Job Hunter Agent — orchestrates the full job search pipeline.

Flow:
  1. Parse natural-language query → structured {role, location, job_type} via LLM
  2. Search jobs via JSearch API
  3. Normalize + deduplicate results
  4. Score each job against user profile (parallel)
  5. Persist FitScore rows
  6. Return top N sorted results
"""

import asyncio
import json
from typing import Any

from openai import OpenAI

from services.fit_score.scorer import compute_fit_score
from services.fit_score.explainer import explain_score
from services.jobs.api_client import search_jsearch, upsert_job
from shared.config import settings
from shared.db import SessionLocal
from shared.models import FitScore


_client: OpenAI | None = None


def _get_client() -> OpenAI | None:
    global _client
    if not settings.openai_api_key:
        return None
    if _client is None:
        _client = OpenAI(
            api_key=settings.openai_api_key,
            base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
        )
    return _client


def parse_intent(text: str) -> dict[str, Any]:
    """
    Use LLM to extract structured search parameters from a natural-language query.

    Examples:
      "ML engineer jobs in NYC"          → {role: "ML Engineer", location: "New York", job_type: null}
      "remote frontend dev part time"     → {role: "Frontend Developer", location: "", job_type: "part_time"}
      "show me data science openings"    → {role: "Data Scientist", location: "", job_type: null}
    """
    if not settings.openai_api_key:
        # Keyword fallback
        words = text.lower().split()
        role_words = [
            "engineer", "developer", "scientist", "analyst", "manager",
            "designer", "consultant", "architect", "specialist", "lead",
        ]
        role = next(
            (w for w in words if any(r in w for r in role_words)),
            text.strip(),
        )
        locations = ["nyc", "new york", "sf", "san francisco", "london", "remote", "us", "uk"]
        location = next((w for w in words if w in locations), "")
        job_type = "part_time" if "part" in words else "full_time" if "full" in words else None
        return {"role": role, "location": location, "job_type": job_type}

    try:
        client = _get_client()
        if not client:
            raise ValueError("No API key")
        response = client.chat.completions.create(
            model="gemini-1.5-flash-latest",
            response_format={"type": "json_object"},
            messages=[
                {
                    "role": "system",
                    "content": (
                        'Extract job search parameters from the user query. '
                        'Return a JSON object with keys: "role" (job title), "location" (city/country/remote), '
                        '"job_type" (one of: "full_time", "part_time", "contract", "internship", null). '
                        'Be concise. Return ONLY valid JSON.'
                    ),
                },
                {"role": "user", "content": text},
            ],
            temperature=0,
            max_tokens=64,
        )
        raw = response.choices[0].message.content or "{}"
        return json.loads(raw)
    except Exception as e:
        print(f"[job_hunter] LLM parse error: {e}")
        return {"role": text, "location": "", "job_type": None}


async def _score_job(
    user_id: str,
    job: dict[str, Any],
    user_profile: dict[str, Any],
) -> dict[str, Any]:
    """Score one job, compute explanation, persist FitScore row."""
    score, breakdown = compute_fit_score(user_profile, job)
    explanation = await asyncio.to_thread(
        explain_score,
        score,
        breakdown,
        job.get("title", ""),
        breakdown.get("missing_skills", []),
    )

    # Persist FitScore to DB
    db = SessionLocal()
    try:
        existing = db.query(FitScore).filter(
            FitScore.user_id == user_id,
            FitScore.job_id == job["job_id"],
        ).first()
        if existing:
            existing.score = score
            existing.breakdown = breakdown
        else:
            fs = FitScore(
                id=None,
                user_id=user_id,
                job_id=job["job_id"],
                score=score,
                breakdown=breakdown,
            )
            db.add(fs)
        db.commit()
    finally:
        db.close()

    return {
        "job": job,
        "score": score,
        "breakdown": breakdown,
        "explanation": explanation,
    }


async def search_and_score(
    user_id: str,
    query: dict[str, Any],
    user_profile: dict[str, Any],
    top_n: int = 10,
) -> list[dict[str, Any]]:
    """
    1. Search jobs via JSearch API
    2. Upsert each job to DB
    3. Compute fit scores + explanations in parallel
    4. Return top N sorted by score
    """
    role = query.get("role", "")
    location = query.get("location", "")
    job_type = query.get("job_type")

    raw_jobs = await search_jsearch(role, page=1)
    if not raw_jobs:
        return []

    # Upsert jobs to DB and build job dicts
    jobs: list[dict[str, Any]] = []
    seen: set[str] = set()
    for raw in raw_jobs:
        job_row = await upsert_job(raw)
        eid = str(raw.get("job_id", ""))
        if eid and eid not in seen:
            seen.add(eid)
            jobs.append({
                "job_id": str(job_row.id),
                "title": job_row.title,
                "company": job_row.company,
                "location": job_row.location,
                "description": job_row.description,
                "skills": job_row.skills or [],
                "employment_type": job_row.employment_type,
                "seniority": job_row.seniority,
                "experience_years": job_row.experience_years,
                "salary_min": job_row.salary_min,
                "salary_max": job_row.salary_max,
            })

    # Score all in parallel
    scored_tasks = [_score_job(user_id, job, user_profile) for job in jobs]
    scored = await asyncio.gather(*scored_tasks, return_exceptions=True)

    # Filter out exceptions, sort
    valid = [r for r in scored if not isinstance(r, Exception)]
    valid.sort(key=lambda item: item["score"], reverse=True)
    return valid[:top_n]


async def run_pipeline(
    user_id: str,
    user_query: str,
    user_profile: dict[str, Any],
    top_n: int = 10,
) -> dict[str, Any]:
    """
    Full job-hunting pipeline.

    Args:
        user_id: current user UUID string
        user_query: natural-language job search query
        user_profile: dict with skills, experience, education
        top_n: number of top results to return

    Returns:
        {
            "query": {role, location, job_type},
            "total_found": int,
            "results": [{job, score, breakdown, explanation}, ...]
        }
    """
    query = parse_intent(user_query)
    results = await search_and_score(user_id, query, user_profile, top_n=top_n)

    return {
        "query": query,
        "total_found": len(results),
        "results": results,
    }
