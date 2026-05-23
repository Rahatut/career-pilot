import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import selectinload

from shared.auth import get_current_user
from shared.db import get_db
from shared.models import FitScore, Job

from .explainer import explain_score
from .scorer import compute_fit_score

router = APIRouter(tags=["fit"])


@router.get("/score/{job_id}", response_model=dict)
async def get_score(
    job_id: str,
    current_user_id: Annotated[str, Depends(get_current_user)],
    db=Depends(get_db),
):
    """
    Compute (or retrieve cached) fit score for a user × job pair.
    Returns (score, breakdown) tuple stored as JSONB.
    """
    try:
        job_uuid = uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(400, "Invalid job ID format")
    
    user_uuid = uuid.UUID(current_user_id)
    
    # Check for existing score
    existing = db.query(FitScore).filter(
        FitScore.user_id == user_uuid,
        FitScore.job_id == job_uuid,
    ).first()

    if existing:
        breakdown = existing.breakdown or {}
        return {
            "job_id": str(existing.job_id),
            "score": existing.score,
            "breakdown": breakdown,
            "is_cached": True,
        }

    # Fetch job
    job = db.query(Job).filter(Job.id == job_uuid).first()
    if not job:
        raise HTTPException(404, "Job not found")

    # Fetch user's CV profile
    from shared.models import CV, UserProfile
    cv = db.query(CV).filter(CV.user_id == user_uuid, CV.is_active == True).first()
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_uuid).first()

    cv_skills = profile.skills if profile else []
    job_skills = job.skills_required or []

    score, breakdown = compute_fit_score(
        cv_skills=cv_skills,
        job_skills=job_skills,
        job_experience_years=None,
        cv_experience_years=profile.experience_years if profile else None,
        job_education=None,
        cv_education=profile.education_level if profile else None,
        job_location=job.location,
        cv_location=profile.location if profile else None,
        job_seniority=None,
        cv_seniority=None,
    )

    # Persist
    fit_row = FitScore(
        id=uuid.uuid4(),
        user_id=user_uuid,
        job_id=job_uuid,
        score=score,
        breakdown=breakdown,
    )
    db.add(fit_row)
    db.commit()

    return {
        "job_id": str(job_uuid),
        "score": score,
        "breakdown": breakdown,
        "is_cached": False,
    }


@router.get("/score/{job_id}/explain", response_model=dict)
async def explain_fit_score(
    job_id: str,
    current_user_id: Annotated[str, Depends(get_current_user)],
    db=Depends(get_db),
):
    """
    Get or compute the fit score and return an LLM-generated explanation.
    """
    try:
        job_uuid = uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(400, "Invalid job ID format")
    
    user_uuid = uuid.UUID(current_user_id)
    
    # Get or compute score
    fit_row = db.query(FitScore).filter(
        FitScore.user_id == user_uuid,
        FitScore.job_id == job_uuid,
    ).first()

    if not fit_row:
        # Compute on the fly
        job = db.query(Job).filter(Job.id == job_uuid).first()
        if not job:
            raise HTTPException(404, "Job not found")

        from shared.models import UserProfile
        profile = db.query(UserProfile).filter(UserProfile.user_id == user_uuid).first()

        cv_skills = profile.skills if profile else []
        job_skills = job.skills_required or []

        score, breakdown = compute_fit_score(
            cv_skills=cv_skills,
            job_skills=job_skills,
            job_experience_years=job.experience_years,
            cv_experience_years=None,
            job_education=None,
            cv_education=None,
            job_location=job.location,
            cv_location=None,
            job_seniority=job.seniority,
            cv_seniority=None,
        )
        fit_row = FitScore(
            id=uuid.uuid4(),
            user_id=user_id,
            job_id=job_id,
            score=score,
            breakdown=breakdown,
        )
        db.add(fit_row)
        db.commit()
    else:
        score = fit_row.score
        breakdown = fit_row.breakdown or {}

    # Get job title for explanation
    job = db.query(Job).filter(Job.id == job_id).first()
    explanation = await explain_score(
        score=score,
        breakdown=breakdown,
        job_title=job.title if job else None,
        missing_skills=breakdown.get("missing_skills", []),
    )

    return {
        "score": score,
        "breakdown": breakdown,
        "explanation": explanation,
        "job_title": job.title if job else None,
    }
