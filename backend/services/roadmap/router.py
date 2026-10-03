import uuid
from typing import Annotated

from fastapi import APIRouter, Body, Depends, HTTPException, Header, Query
from sqlalchemy.orm import selectinload

from shared.auth import get_current_user
from shared.db import get_db
from shared.models import Roadmap

from .generator import generate_roadmap

router = APIRouter(tags=["roadmap"])


@router.post("/generate", response_model=dict)
async def generate(
    target_role: Annotated[str, Body(description="Target job role")],
    current_user_id: Annotated[str, Depends(get_current_user)],
    missing_skills: Annotated[list[str], Body(description="Skills to develop")] = [],
    current_level: Annotated[str | None, Body(description="Current experience level")] = None,
    weeks: Annotated[int, Query(ge=1, le=24)] = 8,
    db=Depends(get_db),
):
    """Generate a new roadmap, replacing any existing one."""
    content = await generate_roadmap(target_role, missing_skills, current_level, weeks)

    # Replace existing roadmap for this user
    existing = db.query(Roadmap).filter(Roadmap.user_id == current_user_id).first()
    if existing:
        existing.content = content
        existing.target_role = target_role
        existing.weeks_completed = 0
    else:
        roadmap = Roadmap(
            id=uuid.uuid4(),
            user_id=current_user_id,
            target_role=target_role,
            content=content,
            weeks_completed=0,
        )
        db.add(roadmap)

    db.commit()

    return {
        "roadmap_id": str(existing.id if existing else roadmap.id),
        "target_role": target_role,
        "weeks": content,
        "weeks_completed": 0,
    }


@router.get("/me", response_model=dict)
def get_roadmap(
    current_user_id: Annotated[str, Depends(get_current_user)],
    db=Depends(get_db),
):
    """Get the user's active roadmap."""
    roadmap = db.query(Roadmap).filter(Roadmap.user_id == current_user_id).first()
    if not roadmap:
        raise HTTPException(404, "No roadmap found")

    return {
        "roadmap_id": str(roadmap.id),
        "target_role": roadmap.target_role,
        "content": roadmap.content or [],
        "weeks_completed": roadmap.weeks_completed,
    }


@router.patch("/week/{n}", response_model=dict)
def mark_week_complete(
    n: int,
    current_user_id: Annotated[str, Depends(get_current_user)],
    db=Depends(get_db),
):
    """Mark a week as completed and update weeks_completed counter."""
    roadmap = db.query(Roadmap).filter(Roadmap.user_id == current_user_id).first()
    if not roadmap:
        raise HTTPException(404, "No roadmap found")

    content = roadmap.content or []

    # Find and update the week entry
    week_found = False
    for entry in content:
        if entry.get("week") == n:
            entry["completed"] = True
            week_found = True
            break

    if not week_found:
        raise HTTPException(404, f"Week {n} not found in roadmap")

    # Update weeks_completed
    roadmap.content = content
    roadmap.weeks_completed = max(roadmap.weeks_completed or 0, n)
    db.commit()

    return {
        "week": n,
        "weeks_completed": roadmap.weeks_completed,
        "content": content,
    }
