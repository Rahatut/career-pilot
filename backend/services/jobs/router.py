import asyncio
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.orm import selectinload

from shared.auth import get_current_user
from shared.db import get_db
from shared.models import Job, UserProfile

from .api_client import search_jsearch, upsert_job
from .normalizer import extract_skills_from_description

router = APIRouter(tags=["jobs"])


@router.post("/search", response_model=dict)
async def search_jobs(
    q: Annotated[str, Query(min_length=2, description="Search query")],
    current_user_id: Annotated[str, Depends(get_current_user)],
    page: Annotated[int, Query(ge=1)] = 1,
    db=Depends(get_db),
):
    """Search JSearch and persist results to the Job table."""
    raw_jobs = await search_jsearch(q, page=page)

    # Upsert all jobs concurrently
    upserted: list[Job] = []
    for job in raw_jobs:
        row = upsert_job(db, job)
        upserted.append(row)

    db.commit()

    jobs_out = [
        {
            "job_id": str(j.id),
            "external_id": j.external_id,
            "title": j.title,
            "company": j.company,
            "location": j.location,
            "skills_required": j.skills_required or [],
            "job_type": j.job_type,
            "url": j.url,
        }
        for j in upserted
    ]

    return {
        "query": q,
        "page": page,
        "total": len(jobs_out),
        "jobs": jobs_out,
    }


@router.get("/recommended", response_model=dict)
async def get_recommended_jobs(
    current_user_id: Annotated[str, Depends(get_current_user)],
    limit: Annotated[int, Query(ge=1, le=20)] = 10,
    db=Depends(get_db),
):
    """Get job recommendations based on user's CV skills."""
    # Fetch user profile
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user_id).first()
    if not profile or not profile.skills:
        raise HTTPException(404, "No profile or skills found for recommendations")

    # Simple skill-based match: use top-3 skills to search
    top_skills = profile.skills[:3]
    query = " ".join(top_skills)

    raw_jobs = await search_jsearch(query)

    # Upsert
    upserted: list[Job] = []
    for job in raw_jobs:
        row = upsert_job(db, job)
        upserted.append(row)
    db.commit()

    # Score by skill overlap
    skill_set = {s.lower() for s in profile.skills}
    scored = []
    for job in upserted:
        job_skills = {s.lower() for s in (job.skills or [])}
        overlap = len(skill_set & job_skills)
        scored.append((overlap, job))

    scored.sort(key=lambda x: x[0], reverse=True)
    top_jobs = scored[:limit]

    return {
        "skills_used": top_skills,
        "recommended": [
            {
                "job_id": str(j.id),
                "title": j.title,
                "company": j.company,
                "location": j.location,
                "skills_required": j.skills_required or [],
                "url": j.url,
                "skill_overlap": score,
            }
            for score, j in top_jobs
        ],
    }


@router.get("/{job_id}", response_model=dict)
def get_job(
    job_id: str,
    current_user_id: Annotated[str, Depends(get_current_user)],
    db=Depends(get_db),
):
    """Get a single job by its UUID."""
    try:
        job_uuid = uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(400, "Invalid job ID format")
    
    job = db.query(Job).filter(Job.id == job_uuid).first()
    if not job:
        raise HTTPException(404, "Job not found")

    return {
        "job_id": str(job.id),
        "external_id": job.external_id,
        "title": job.title,
        "company": job.company,
        "location": job.location,
        "description": job.description,
        "url": job.url,
        "skills_required": job.skills_required or [],
        "salary_min": job.salary_min,
        "salary_max": job.salary_max,
        "job_type": job.job_type,
    }
