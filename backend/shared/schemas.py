from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class CvSection(BaseModel):
    section_type: str
    content: str
    skills_extracted: List[str] = []
    dates: Dict[str, Any] = {}


class UserProfile(BaseModel):
    user_id: str
    skills: List[str] = []
    experience_years: int = 0
    education_level: str = "unknown"
    location: Optional[str] = None
    embedding_status: str = "pending"


class FitScore(BaseModel):
    total: int
    breakdown: Dict[str, float]
    matched_skills: List[str]
    missing_skills: List[str]
    explanation: Optional[str] = None


class CVUploadResponse(BaseModel):
    cv_id: str
    sections_count: int
    skills_count: int


class EducationEntry(BaseModel):
    id: str
    institution: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    content: Optional[str] = None


class ExperienceEntry(BaseModel):
    id: str
    institution: Optional[str] = None
    position: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    content: Optional[str] = None


class UserProfileResponse(BaseModel):
    user_id: str
    skills: List[str] = []
    education: List[EducationEntry] = []
    experience: List[ExperienceEntry] = []


class SkillListResponse(BaseModel):
    skills: List[str]


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

