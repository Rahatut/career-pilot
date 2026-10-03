from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from shared.db import Base, engine
from shared.models import (  # noqa: F401 — importing registers subclasses
    CV,
    CVSection,
    ChatMessage,
    ChatSession,
    FitScore,
    Goal,
    Job,
    JobApplication,
    Roadmap,
    Task,
    User,
    UserProfile,
)

from services.profile.router import router as profile_router
from services.jobs.router import router as jobs_router
from services.fit_score.router import router as fit_router
from services.assistant.router import router as assistant_router
from services.tracker.router import router as tracker_router
from services.roadmap.router import router as roadmap_router
from services.auth.router import router as auth_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all tables at startup
    try:
        Base.metadata.create_all(bind=engine)
        print("✓ Database tables created successfully")
    except Exception as e:
        print(f"✗ Failed to create tables: {e}")
    yield


app = FastAPI(title="CareerPilot Backend", lifespan=lifespan)

# CORS for frontend
import os

FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(profile_router, prefix="/cv")
app.include_router(jobs_router, prefix="/jobs")
app.include_router(fit_router, prefix="/fit")
app.include_router(assistant_router, prefix="/assistant")
app.include_router(tracker_router)  # root-level
app.include_router(roadmap_router, prefix="/roadmap")
app.include_router(auth_router)  # root-level


@app.get("/health")
def health():
    return {"status": "ok"}
