import re
from typing import Any


def extract_skills_from_description(description: str) -> list[str]:
    """Extract skills from job description using keyword matching."""
    skill_keywords = {
        "python", "java", "javascript", "typescript", "c++", "c#", "go", "rust",
        "ruby", "php", "swift", "kotlin", "scala", "r", "matlab",
        "react", "vue", "angular", "svelte", "node.js", "nodejs", "django", "fastapi",
        "flask", "spring", "tensorflow", "pytorch", "keras", "scikit-learn",
        "sql", "postgresql", "mysql", "mongodb", "redis", "elasticsearch",
        "docker", "kubernetes", "aws", "gcp", "azure", "terraform",
        "git", "linux", "bash", "rest", "graphql", "grpc",
        "machine learning", "deep learning", "nlp", "data science", "llm",
        "pandas", "numpy", "excel", "tableau", "spark", "hadoop", "kafka",
        "agile", "scrum", "ci/cd", "devops", "microservices",
        "html", "css", "webpack", "vite", "react.js", "vue.js",
    }

    desc_lower = description.lower()
    found = [
        s.title() for s in skill_keywords
        if re.search(rf"\b{re.escape(s)}\b", desc_lower)
    ]
    return list(dict.fromkeys(found))  # dedupe, preserve order
