from typing import Any

from pydantic import BaseModel


class CvSection(BaseModel):
    section_type: str
    content: str
    skills_extracted: list[str] = []
    dates: dict[str, Any] = {}


class UserProfile(BaseModel):
    user_id: str
    skills: list[str] = []
    experience_years: int = 0
    education_level: str = "unknown"
    location: str | None = None
    embedding_status: str = "pending"


class FitScore(BaseModel):
    total: int
    breakdown: dict[str, float]
    matched_skills: list[str]
    missing_skills: list[str]
    explanation: str | None = None


class CVUploadResponse(BaseModel):
    cv_id: str
    sections_count: int
    skills_count: int


class EducationEntry(BaseModel):
    id: str
    institution: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    content: str | None = None


class ExperienceEntry(BaseModel):
    id: str
    institution: str | None = None
    position: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    content: str | None = None


class UserProfileResponse(BaseModel):
    user_id: str
    skills: list[str] = []
    education: list[EducationEntry] = []
    experience: list[ExperienceEntry] = []


class SkillListResponse(BaseModel):
    skills: list[str]


# ──────────────────────────────────────────────────────────────────────────────
# Auth
# ──────────────────────────────────────────────────────────────────────────────


class SignUpRequest(BaseModel):
    name: str
    email: str
    password: str


class SignInRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    user_id: str
    name: str
    email: str
    token: str

