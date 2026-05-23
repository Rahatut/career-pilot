from typing import TypedDict


class ScoreBreakdown(TypedDict, total=False):
    skill_match: int
    experience_match: int
    education_match: int
    location_match: int
    seniority_match: int
    missing_skills: list[str]
    matched_skills: list[str]
    total: int


def compute_fit_score(
    cv_skills: list[str],
    job_skills: list[str],
    job_experience_years: int | None,
    cv_experience_years: int | None,
    job_education: str | None,
    cv_education: str | None,
    job_location: str | None,
    cv_location: str | None,
    job_seniority: str | None,
    cv_seniority: str | None,
) -> tuple[int, ScoreBreakdown]:
    """
    Compute a deterministic weighted fit score (0-100) and a detailed breakdown.

    Parameters
    ----------
    cv_skills : list of skill strings from the user's CV
    job_skills : list of required skill strings from the job posting
    job_experience_years : years of experience required by the job
    cv_experience_years : total years of experience from the CV
    job_education : education level required (e.g. "bachelor", "master")
    cv_education : education level of the user (e.g. "bachelor", "master")
    job_location : job location string
    cv_location : user's location string
    job_seniority : expected seniority level (e.g. "mid", "senior")
    cv_seniority : user's seniority level

    Returns
    -------
    tuple[int, ScoreBreakdown] : overall score and breakdown dict
    """
    breakdown: ScoreBreakdown = {
        "skill_match": 0,
        "experience_match": 0,
        "education_match": 0,
        "location_match": 0,
        "seniority_match": 0,
        "missing_skills": [],
        "matched_skills": [],
    }

    # 1. Skill match (40 points max)
    if job_skills and cv_skills:
        cv_lower = {s.lower() for s in cv_skills}
        job_lower = {s.lower() for s in job_skills}
        matched = cv_lower & job_lower
        missing = job_lower - cv_lower
        score = round(len(matched) / len(job_lower) * 40)
        breakdown["skill_match"] = min(score, 40)
        breakdown["matched_skills"] = list(matched)
        breakdown["missing_skills"] = list(missing)
    else:
        breakdown["skill_match"] = 40 if not job_skills else 0
        breakdown["missing_skills"] = job_skills if job_skills else []
        breakdown["matched_skills"] = []

    # 2. Experience match (20 points max)
    if job_experience_years is not None and cv_experience_years is not None:
        if cv_experience_years >= job_experience_years:
            breakdown["experience_match"] = 20
        elif cv_experience_years >= job_experience_years * 0.5:
            breakdown["experience_match"] = 10
        else:
            breakdown["experience_match"] = 5
    elif job_experience_years is None:
        breakdown["experience_match"] = 20
    else:
        breakdown["experience_match"] = 0

    # 3. Education match (15 points max)
    if job_education and cv_education:
        edu_map = {"high school": 1, "associate": 2, "bachelor": 3, "master": 4, "phd": 5}
        job_level = edu_map.get(job_education.lower().strip(), 0)
        cv_level = edu_map.get(cv_education.lower().strip(), 0)
        if cv_level >= job_level:
            breakdown["education_match"] = 15
        elif cv_level == job_level - 1:
            breakdown["education_match"] = 8
        else:
            breakdown["education_match"] = 3
    elif not job_education:
        breakdown["education_match"] = 15
    else:
        breakdown["education_match"] = 0

    # 4. Location match (15 points max)
    if job_location and cv_location:
        if cv_location.lower() in job_location.lower() or \
           job_location.lower() in cv_location.lower():
            breakdown["location_match"] = 15
        else:
            breakdown["location_match"] = 0
    elif not job_location:
        breakdown["location_match"] = 15
    else:
        breakdown["location_match"] = 0

    # 5. Seniority match (10 points max)
    if job_seniority and cv_seniority:
        seniority_levels = {"entry": 1, "junior": 2, "mid": 3, "senior": 4, "lead": 5, "principal": 6}
        job_s = seniority_levels.get(job_seniority.lower(), 3)
        cv_s = seniority_levels.get(cv_seniority.lower(), 3)
        if cv_s == job_s:
            breakdown["seniority_match"] = 10
        elif abs(cv_s - job_s) == 1:
            breakdown["seniority_match"] = 6
        else:
            breakdown["seniority_match"] = 2
    elif not job_seniority:
        breakdown["seniority_match"] = 10
    else:
        breakdown["seniority_match"] = 0

    # Total
    total = sum([
        breakdown["skill_match"],
        breakdown["experience_match"],
        breakdown["education_match"],
        breakdown["location_match"],
        breakdown["seniority_match"],
    ])
    breakdown["total"] = total

    return total, breakdown
