import json
import re
from pathlib import Path

_SKILLS_PATH = Path(__file__).parent.parent / "data" / "skills.json"
SKILLS: dict[str, list[str]] = json.loads(_SKILLS_PATH.read_text(encoding="utf-8"))


def _build_patterns() -> dict[str, re.Pattern]:
    patterns = {}
    for canonical, aliases in SKILLS.items():
        names = [canonical] + aliases
        alt = "|".join(re.escape(n) for n in names)
        patterns[canonical] = re.compile(
            rf"(?<![\w+#.])({alt})(?![\w+#])", re.IGNORECASE
        )
    return patterns


PATTERNS = _build_patterns()


def extract_skills(text: str) -> set[str]:
    return {skill for skill, p in PATTERNS.items() if p.search(text)}# ---------- Role fit + category feedback ----------


ROLE_PROFILES: dict[str, set[str]] = {
    "Backend Developer": {"Python", "FastAPI", "Django", "SQL", "REST API", "Docker"},
    "Frontend Developer": {"React", "JavaScript", "HTML", "CSS", "TypeScript"},
    "Data Analyst": {"SQL", "Excel", "Python", "Pandas", "Power BI"},
    "DevOps Engineer": {"Docker", "Kubernetes", "AWS", "CI/CD", "Linux"},
}

CATEGORIES: dict[str, set[str]] = {
    "Languages": {"Python", "Java", "JavaScript", "TypeScript", "C++"},
    "Frameworks": {"FastAPI", "Django", "Flask", "React", "Node.js"},
    "Databases": {"SQL", "MySQL", "PostgreSQL", "MongoDB"},
    "Cloud & DevOps": {"AWS", "Azure", "GCP", "Docker", "Kubernetes", "CI/CD"},
    "Tools": {"Git", "Linux", "Excel", "Power BI"},
}


def suggest_roles(resume_skills: set[str]) -> list[dict]:
    result = []
    for role, required in ROLE_PROFILES.items():
        common = resume_skills & required
        result.append({
            "role": role,
            "fit": round(len(common) / len(required) * 100, 1),
            "have": sorted(common),
            "lacking": sorted(required - resume_skills),
        })
    return sorted(result, key=lambda r: -r["fit"])


def group_by_category(matched: set[str], missing: set[str]) -> dict:
    out = {}
    for cat, members in CATEGORIES.items():
        m, x = sorted(matched & members), sorted(missing & members)
        if m or x:
            out[cat] = {"matched": m, "missing": x}
    return out