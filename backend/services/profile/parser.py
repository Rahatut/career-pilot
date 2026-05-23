import io
import re
from typing import TypedDict


class SectionDict(TypedDict, total=False):
    section_type: str
    content: str
    order_index: int
    institution: str | None
    position: str | None
    start_date: str | None
    end_date: str | None
    metadata: dict


HEADING_PATTERNS = [
    (r"education|academic|university|degree|institute", "education"),
    (r"experience|work|employment|job|position|intern", "experience"),
    (r"skill|technolog|competenc|tool", "skills"),
    (r"project", "projects"),
    (r"summary|objective|profile|about", "summary"),
    (r"certification|certificate|license|award|honor", "certifications"),
    (r"language|speak", "languages"),
    (r"reference", "references"),
    (r"contact|phone|email|url|link", "contact"),
]

SKILL_KEYWORDS = {
    "python", "java", "javascript", "typescript", "c++", "c#", "go", "rust",
    "ruby", "php", "swift", "kotlin", "scala", "r", "matlab",
    "react", "vue", "angular", "svelte", "node.js", "django", "fastapi", "flask", "spring",
    "tensorflow", "pytorch", "keras", "scikit-learn", "sklearn",
    "sql", "postgresql", "mysql", "mongodb", "redis", "elasticsearch",
    "docker", "kubernetes", "aws", "gcp", "azure", "terraform",
    "git", "linux", "bash", "shell", "rest", "graphql", "grpc",
    "machine learning", "deep learning", "nlp", "data science", "data analysis",
    "ml", "dl", "ai", "llm", "chatgpt", "nlp",
    "excel", "tableau", "power bi", "pandas", "numpy", "scipy",
    "agile", "scrum", "jira", "ci/cd", "devops",
    "html", "css", "sass", "webpack", "vite", "npm", "yarn",
    "microservices", "serverless", "lambda",
    "spark", "hadoop", "kafka", "flink",
    "opencv", "computer vision", "image processing",
    "statistics", "a/b testing", "ab testing", " experimentation",
}


def _extract_text_from_pdf(data: bytes) -> str:
    try:
        import pdfplumber
        text_parts: list[str] = []
        with pdfplumber.open(io.BytesIO(data)) as pdf:
            for page in pdf.pages:
                t = page.extract_text() or ""
                if t.strip():
                    text_parts.append(t)
        return "\n".join(text_parts)
    except Exception as e:
        print(f"[parser] PDF extraction failed: {e}")
        return ""


def _extract_text_from_docx(data: bytes) -> str:
    try:
        import docx
        doc = docx.Document(io.BytesIO(data))
        return "\n".join(para.text for para in doc.paragraphs if para.text.strip())
    except Exception as e:
        print(f"[parser] DOCX extraction failed: {e}")
        return ""


def _classify_heading(line: str) -> str:
    """Classify a heading line into a section type."""
    normalized = line.strip().lower().rstrip(":：.")
    for pattern, section_type in HEADING_PATTERNS:
        if re.search(pattern, normalized):
            return section_type
    return "other"


def _split_into_sections(text: str) -> list[SectionDict]:
    """Split CV text into sections by heading lines."""
    lines = text.split("\n")
    sections: list[SectionDict] = []
    current: SectionDict | None = None
    current_lines: list[str] = []
    order = 0

    heading_re = re.compile(r"^#{0,3}\s*[A-Za-z]")

    for line in lines:
        stripped = line.strip()
        if not stripped:
            if current_lines:
                current_lines.append(stripped)
            continue

        is_heading = (
            stripped.istitle()
            or stripped.isupper()
            or (heading_re.match(stripped) and len(stripped) < 60)
        )

        if is_heading and not stripped[0].isdigit():
            # Save previous section
            if current and current_lines:
                current["content"] = "\n".join(current_lines).strip()
                sections.append(current)

            section_type = _classify_heading(stripped)
            current = SectionDict(
                section_type=section_type,
                content="",
                order_index=order,
                institution=None,
                position=None,
                start_date=None,
                end_date=None,
                metadata={},
            )
            order += 1
            current_lines = []
        else:
            if current is None:
                current = SectionDict(
                    section_type="other",
                    content="",
                    order_index=0,
                    institution=None,
                    position=None,
                    start_date=None,
                    end_date=None,
                    metadata={},
                )
            current_lines.append(stripped)

    # Flush last section
    if current and current_lines:
        current["content"] = "\n".join(current_lines).strip()
        sections.append(current)

    return sections


def _extract_skills_from_text(text: str) -> list[str]:
    """Extract known skills from raw text."""
    text_lower = text.lower()
    found: list[str] = []
    for skill in SKILL_KEYWORDS:
        if skill in text_lower:
            # Normalise display
            display = skill.title()
            if display not in found:
                found.append(display)
    return found


DATE_PATTERN = re.compile(
    r"(?P<start>(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*\d{4}|\d{1,2}/\d{4}|\d{4})"
    r"\s*[-–—to]+\s*"
    r"(?P<end>Present|Current|Now|"
    r"(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*\d{4}|\d{1,2}/\d{4}|\d{4})?"
)


def _extract_dates_from_text(text: str) -> tuple[str | None, str | None]:
    """Extract date range from a section."""
    m = DATE_PATTERN.search(text[:200])
    if m:
        return m.group("start"), m.group("end")
    return None, None


def _extract_institution(text: str) -> str | None:
    """Heuristic: first line or line before position often has institution."""
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    if lines:
        return lines[0][:200]
    return None


def _extract_position(text: str) -> str | None:
    """Heuristic: second line is usually the position."""
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    if len(lines) > 1:
        return lines[1][:200]
    return None


def parse_cv_bytes(data: bytes) -> dict:
    """
    Parse CV bytes (PDF or DOCX) and return structured sections + profile summary.

    Returns
    -------
    {
        "sections": list[SectionDict],
        "profile": {
            "skills": list[str],
            "raw_text": str,
        }
    }
    """
    # Detect format
    if data[:4] == rb"%PDF":
        text = _extract_text_from_pdf(data)
    elif data[:4] in (rb"\xd0\xcf\x11", rb"PK\x03\x04"):
        text = _extract_text_from_docx(data)
    else:
        # Fallback: try as raw text
        try:
            text = data.decode("utf-8", errors="ignore")
        except Exception:
            text = ""

    sections: list[SectionDict] = _split_into_sections(text)

    # Enrich sections
    for s in sections:
        s["skills"] = _extract_skills_from_text(s["content"])
        start, end = _extract_dates_from_text(s["content"])
        if s.get("institution") is None:
            s["institution"] = _extract_institution(s["content"])
        if s.get("position") is None:
            s["position"] = _extract_position(s["content"])
        if start:
            s["start_date"] = start
        if end:
            s["end_date"] = end

    skills = _extract_skills_from_text(text)

    return {
        "sections": sections,
        "profile": {
            "skills": skills,
            "raw_text": text[:5000],
        },
    }
