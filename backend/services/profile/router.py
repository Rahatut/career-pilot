import asyncio
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from shared.auth import get_current_user
from shared.db import get_db
from shared.models import CV, CVSection, UserProfile
from shared.schemas import CVUploadResponse, SkillListResponse, UserProfileResponse

from .parser import parse_cv_bytes

router = APIRouter(tags=["cv"])


def _build_profile(sections: list[CVSection]) -> dict:
    """Build a structured profile dict from CVSection rows."""
    skills: list[str] = []
    education: list[dict] = []
    experience: list[dict] = []

    for s in sections:
        meta = s.section_meta or {}
        entry = {
            "id": str(s.id),
            "section_type": s.section_type,
            "institution": s.institution,
            "position": s.position,
            "start_date": s.start_date,
            "end_date": s.end_date,
            "content": s.content[:500],
            "metadata": meta,
        }
        if s.section_type == "skills":
            skills.extend(meta.get("skills", []))
        elif s.section_type == "education":
            education.append(entry)
        elif s.section_type == "experience":
            experience.append(entry)

    return {
        "skills": skills,
        "education": education,
        "experience": experience,
    }


@router.post("/upload", response_model=CVUploadResponse)
async def upload_cv(
    file: Annotated[UploadFile, File(description="PDF or DOCX CV file")],
    current_user_id: Annotated[str, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """Upload and parse a new CV. Extracts text and updates profile dynamically."""
    user_uuid = uuid.UUID(current_user_id)
    
    # Validate file type
    allowed_types = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]
    if file.content_type not in allowed_types:
        raise HTTPException(400, "Only PDF and DOCX files allowed")
    
    # Read file with size limit (10MB)
    data = await file.read()
    if len(data) > 10 * 1024 * 1024:
        raise HTTPException(400, "File too large (max 10MB)")
    if len(data) < 100:
        raise HTTPException(400, "File is too small or empty")

    try:
        parsed = parse_cv_bytes(data)
    except Exception as e:
        raise HTTPException(400, f"Failed to parse CV: {e!s}")
    
    sections_data = parsed["sections"]

    # Create CV row (set all others inactive first)
    cv_id = uuid.uuid4()
    db.query(CV).filter(CV.user_id == user_uuid).update({"is_active": False})
    cv = CV(
        id=cv_id,
        user_id=user_uuid,
        is_active=True,
        embedding_status="pending",
    )
    db.add(cv)

    # Bulk-insert CVSection rows
    section_rows = []
    for s in sections_data:
        section_rows.append(CVSection(
            id=uuid.uuid4(),
            cv_id=cv_id,
            section_type=s["section_type"],
            content=s["content"],
            order_index=s.get("order_index", 0),
            institution=s.get("institution"),
            position=s.get("position"),
            start_date=s.get("start_date"),
            end_date=s.get("end_date"),
            section_meta={"skills": s.get("skills", []), **s.get("metadata", {})},
        ))

    if section_rows:
        db.add_all(section_rows)

    # Save profile summary
    profile_data = parsed["profile"]
    existing_profile = db.query(UserProfile).filter(
        UserProfile.user_id == user_uuid
    ).first()
    if existing_profile:
        existing_profile.skills = profile_data["skills"]
    else:
        db.add(UserProfile(
            id=uuid.uuid4(),
            user_id=user_uuid,
            skills=profile_data["skills"],
        ))

    db.commit()

    # Background embedding with NEW session (non-blocking)
    asyncio.create_task(embed_cv_async(cv_id, user_uuid, sections_data))

    return CVUploadResponse(
        cv_id=str(cv_id),
        sections_count=len(section_rows),
        skills_count=len(profile_data["skills"]),
    )


@router.get("/")
def get_cv(
    current_user_id: Annotated[str, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """Get the user's active CV with all sections."""
    user_uuid = uuid.UUID(current_user_id)
    cv = db.query(CV).filter(
        CV.user_id == user_uuid,
        CV.is_active == True,
    ).first()

    if not cv:
        raise HTTPException(404, "No active CV found")

    sections = db.query(CVSection).filter(
        CVSection.cv_id == cv.id
    ).order_by(CVSection.order_index).all()

    return {
        "cv_id": str(cv.id),
        "embedding_status": cv.embedding_status,
        "profile": _build_profile(sections),
        "sections_count": len(sections),
    }


@router.get("/profile", response_model=UserProfileResponse)
def get_profile(
    current_user_id: Annotated[str, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """Get the structured profile built from the active CV."""
    user_uuid = uuid.UUID(current_user_id)
    cv = db.query(CV).filter(
        CV.user_id == user_uuid,
        CV.is_active == True,
    ).first()

    if not cv:
        raise HTTPException(404, "No active CV found")

    sections = db.query(CVSection).filter(
        CVSection.cv_id == cv.id
    ).all()

    profile = _build_profile(sections)
    return UserProfileResponse(
        user_id=current_user_id,
        skills=profile["skills"],
        education=profile["education"],
        experience=profile["experience"],
    )


@router.get("/skills", response_model=SkillListResponse)
def get_skills(
    current_user_id: Annotated[str, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """Get unique skills from the active CV."""
    user_uuid = uuid.UUID(current_user_id)
    cv = db.query(CV).filter(
        CV.user_id == user_uuid,
        CV.is_active == True,
    ).first()

    if not cv:
        raise HTTPException(404, "No active CV found")

    sections = db.query(CVSection).filter(
        CVSection.cv_id == cv.id,
        CVSection.section_type == "skills",
    ).all()

    skills: list[str] = []
    seen: set[str] = set()
    for s in sections:
        for skill in (s.section_meta or {}).get("skills", []):
            if skill not in seen:
                seen.add(skill)
                skills.append(skill)

    return SkillListResponse(skills=skills)
