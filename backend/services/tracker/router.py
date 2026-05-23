import uuid
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Header, Body
from sqlalchemy.orm import selectinload, Session

from shared.auth import get_current_user
from shared.db import get_db
from shared.models import Goal, JobApplication, Task, Roadmap, Job

from .dashboard import build_dashboard

router = APIRouter(tags=["tracker"])


# ── Goals ──────────────────────────────────────────────────────────────────────


@router.post("/goals", response_model=dict)
def create_goal(
    title: Annotated[str, Body(description="Goal title")],
    target_date: Annotated[str | None, Body(description="ISO date string")] = None,
    user_id: Annotated[str, Header()] = "",
    db=Depends(get_db),
):
    """Create a new goal."""
    goal = Goal(
        id=uuid.uuid4(),
        user_id=user_id,
        title=title,
        target_date=datetime.fromisoformat(target_date) if target_date else None,
        is_active=True,
    )
    db.add(goal)
    db.commit()
    return {"goal_id": str(goal.id), "title": goal.title}


@router.get("/goals", response_model=dict)
def list_goals(
    user_id: Annotated[str, Header()] = "",
    db=Depends(get_db),
):
    goals = db.query(Goal).filter(Goal.user_id == user_id).all()
    return {
        "goals": [
            {
                "goal_id": str(g.id),
                "title": g.title,
                "target_date": g.target_date.isoformat() if g.target_date else None,
                "is_active": g.is_active,
            }
            for g in goals
        ]
    }


@router.patch("/goals/{goal_id}", response_model=dict)
def update_goal(
    goal_id: str,
    title: Annotated[str | None, Body()] = None,
    is_active: Annotated[bool | None, Body()] = None,
    user_id: Annotated[str, Header()] = "",
    db=Depends(get_db),
):
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == user_id).first()
    if not goal:
        raise HTTPException(404, "Goal not found")
    if title is not None:
        goal.title = title
    if is_active is not None:
        goal.is_active = is_active
    db.commit()
    return {"goal_id": str(goal.id), "title": goal.title, "is_active": goal.is_active}


# ── Tasks ────────────────────────────────────────────────────────────────────


@router.post("/tasks", response_model=dict)
def create_task(
    title: Annotated[str, Body(description="Task title")],
    goal_id: Annotated[str | None, Body(description="UUID of parent goal")] = None,
    deadline: Annotated[str | None, Body(description="ISO datetime string")] = None,
    user_id: Annotated[str, Header()] = "",
    db=Depends(get_db),
):
    """Create a new task, optionally linked to a goal."""
    task = Task(
        id=uuid.uuid4(),
        user_id=user_id,
        title=title,
        goal_id=uuid.UUID(goal_id) if goal_id else None,
        deadline=datetime.fromisoformat(deadline) if deadline else None,
        is_completed=False,
    )
    db.add(task)
    db.commit()
    return {"task_id": str(task.id), "title": task.title}


@router.get("/tasks", response_model=dict)
def list_tasks(
    user_id: Annotated[str, Header()] = "",
    db=Depends(get_db),
):
    tasks = db.query(Task).filter(Task.user_id == user_id).all()
    return {
        "tasks": [
            {
                "task_id": str(t.id),
                "title": t.title,
                "is_completed": t.is_completed,
                "deadline": t.deadline.isoformat() if t.deadline else None,
                "goal_id": str(t.goal_id) if t.goal_id else None,
            }
            for t in tasks
        ]
    }


@router.patch("/tasks/{task_id}", response_model=dict)
def update_task(
    task_id: str,
    is_completed: Annotated[bool | None, Body()] = None,
    user_id: Annotated[str, Header()] = "",
    db=Depends(get_db),
):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user_id).first()
    if not task:
        raise HTTPException(404, "Task not found")
    if is_completed is not None:
        task.is_completed = is_completed
    db.commit()
    return {"task_id": str(task.id), "is_completed": task.is_completed}


# ── Applications ─────────────────────────────────────────────────────────────


@router.post("/applications", response_model=dict)
def create_application(
    job_id: Annotated[str, Body(description="UUID of the job")],
    status: Annotated[str, Body(description="Initial status")] = "applied",
    user_id: Annotated[str, Header()] = "",
    db=Depends(get_db),
):
    """Record a job application submission."""
    existing = db.query(JobApplication).filter(
        JobApplication.user_id == user_id,
        JobApplication.job_id == job_id,
    ).first()
    if existing:
        raise HTTPException(409, "Application already exists")

    app = JobApplication(
        id=uuid.uuid4(),
        user_id=user_id,
        job_id=job_id,
        status=status,
        status_history=[{"status": status, "timestamp": datetime.utcnow().isoformat()}],
    )
    db.add(app)
    db.commit()
    return {"application_id": str(app.id), "status": app.status}


@router.get("/applications")
def list_applications(
    current_user_id: Annotated[str, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """Get all job applications for the current user."""
    apps = (
        db.query(JobApplication)
        .filter(JobApplication.user_id == uuid.UUID(current_user_id))
        .order_by(JobApplication.created_at.desc())
        .all()
    )
    # Fetch related job data to include in response
    result = []
    for a in apps:
        job = db.query(Job).filter(Job.id == a.job_id).first() if a.job_id else None
        result.append({
            "id": str(a.id),
            "user_id": str(a.user_id),
            "job_title": job.title if job else "Unknown Job",
            "company": job.company if job else "Unknown Company",
            "status": a.status,
            "applied_date": a.created_at.isoformat() if a.created_at else None,
            "deadline": None,  # Not in JobApplication model yet
            "salary": None,    # Not in JobApplication model yet
            "notes": None,     # Not in JobApplication model yet
        })
    return result


@router.patch("/applications/{application_id}", response_model=dict)
def update_application(
    application_id: str,
    status: Annotated[str, Body(description="New status")],
    user_id: Annotated[str, Header()] = "",
    db=Depends(get_db),
):
    """Update application status (appends to status_history)."""
    app = db.query(JobApplication).filter(
        JobApplication.id == application_id,
        JobApplication.user_id == user_id,
    ).first()
    if not app:
        raise HTTPException(404, "Application not found")
    app.status = status
    history = app.status_history or []
    history.append({"status": status, "timestamp": datetime.utcnow().isoformat()})
    app.status_history = history
    db.commit()
    return {
        "application_id": str(app.id),
        "status": app.status,
        "status_history": app.status_history,
    }


# ── Dashboard ─────────────────────────────────────────────────────────────────


@router.get("/dashboard")
async def get_dashboard(
    current_user_id: Annotated[str, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """Get the full dashboard with applications and goals data."""
    user_uuid = uuid.UUID(current_user_id)
    
    # Get applications
    apps = (
        db.query(JobApplication)
        .filter(JobApplication.user_id == user_uuid)
        .order_by(JobApplication.created_at.desc())
        .all()
    )
    
    # Get goals
    goals = db.query(Goal).filter(Goal.user_id == user_uuid).all()
    
    # Calculate stats
    total_applications = len(apps)
    interviews = len([a for a in apps if a.status == "interview"])
    pending = len([a for a in apps if a.status in ["saved", "applied"]])
    
    # Get applied_recently with job details
    applied_recently = []
    for a in apps[:10]:  # Latest 10
        job = db.query(Job).filter(Job.id == a.job_id).first() if a.job_id else None
        applied_recently.append({
            "id": str(a.id),
            "job_title": job.title if job else "Unknown Job",
            "company": job.company if job else "Unknown Company",
            "applied_date": a.created_at.isoformat() if a.created_at else None,
        })
    
    # Weekly goals (convert to expected format)
    weekly_goals = [
        {
            "id": str(g.id),
            "title": g.title,
            "completed": False,  # Goals don't track completion yet in model
        }
        for g in goals[:5]  # Limit to 5
    ]
    
    # Fit distribution (placeholder)
    fit_distribution = [
        {"range": "90-100", "count": len([a for a in apps if a.status == "offer"])},
        {"range": "70-89", "count": interviews},
        {"range": "50-69", "count": pending},
        {"range": "0-49", "count": max(0, total_applications - interviews - pending - len([a for a in apps if a.status == "offer"]))},
    ]
    
    return {
        "total_applications": total_applications,
        "interviews": interviews,
        "pending": pending,
        "applied_recently": applied_recently,
        "weekly_goals": weekly_goals,
        "fit_distribution": fit_distribution,
        "skill_gaps": [],
    }
