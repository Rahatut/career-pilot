import hashlib
import uuid
from typing import Any

import httpx
from sqlalchemy.orm import Session

from shared.config import settings
from shared.models import Job


async def search_jsearch(query: str, page: int = 1) -> list[dict[str, Any]]:
    """
    Search JSearch via RapidAPI.
    Returns a list of raw job dicts.
    """
    url = "https://jsearch.p.rapidapi.com/search"
    params = {
        "query": query,
        "page": str(page),
        "num_pages": "1",
        "language": "en",
    }
    headers = {
        "X-RapidAPI-Key": settings.rapidapi_key,
        "X-RapidAPI-Host": settings.rapidapi_host or "jsearch.p.rapidapi.com",
    }

    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.get(url, params=params, headers=headers)
        
        if response.status_code != 200:
            raise Exception(f"JSearch API returned {response.status_code}: {response.text}")
        
        data = response.json()
        return data.get("data", [])


def _job_dict_to_row(job: dict[str, Any]) -> dict[str, Any]:
    """Normalise a JSearch dict into DB column values."""
    return {
        "external_id": job.get("job_id", ""),
        "source": "jsearch",
        "title": (job.get("job_title") or "").strip(),
        "company": (job.get("employer_name") or job.get("company_name") or "").strip(),
        "location": (job.get("job_city") or job.get("job_location") or "").strip(),
        "description": job.get("job_description", ""),
        "url": job.get("job_apply_link", "") or job.get("job_google_link", "") or "",
        "skills_required": job.get("job_required_skills", []) or [],
        "salary_min": None,
        "salary_max": None,
        "job_type": job.get("job_employment_type", ""),
    }


def _infer_seniority(title: str) -> str | None:
    title_lower = title.lower()
    if any(k in title_lower for k in ["senior", "sr.", "lead", "principal", "staff"]):
        return "senior"
    if any(k in title_lower for k in ["junior", "jr.", "intern", "entry", "graduate"]):
        return "entry"
    if "mid" in title_lower:
        return "mid"
    return "mid"


def _infer_experience(description: str) -> int | None:
    import re
    m = re.search(r"(\d+)\+?\s*(?:years?|yrs?)\s+(?:of\s+)?experience", description, re.I)
    if m:
        return int(m.group(1))
    return None


def upsert_job(db: Session, job: dict[str, Any]) -> Job:
    """
    Insert or update a Job row based on external_id.
    Returns the Job ORM object.
    """
    external_id = job.get("job_id", "")
    existing = db.query(Job).filter(Job.external_id == external_id, Job.source == "jsearch").first()

    row_data = _job_dict_to_row(job)

    if existing:
        for k, v in row_data.items():
            if k != "external_id":
                setattr(existing, k, v)
        return existing
    else:
        new_job = Job(id=uuid.uuid4(), **row_data)
        db.add(new_job)
        return new_job
