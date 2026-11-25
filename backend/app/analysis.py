import os
import re
import json


def _has_heading(text: str, words: list[str]) -> bool:
    for w in words:
        if re.search(rf"(?im)^\s*{w}\s*:?\s*$", text) or re.search(rf"\b{w.upper()}\b", text):
            return True
    return False


SECTIONS = {
    "summary": ["summary", "objective", "profile"],
    "skills": ["skills", "technical skills"],
    "education": ["education"],
    "projects": ["projects"],
    "experience": ["experience", "internship"],
    "certifications": ["certifications", "achievements"],
}


def resume_health(resume_text: str) -> dict:
    low = resume_text.lower()
    words = len(resume_text.split())
    sections = {k: _has_heading(resume_text, v) for k, v in SECTIONS.items()}
    contact = {
        "email": bool(re.search(r"[\w.+-]+@[\w-]+\.[\w.]+", resume_text)),
        "phone": bool(re.search(r"\+?\d[\d\s-]{8,}\d", resume_text)),
        "linkedin": "linkedin.com" in low,
        "github": "github.com" in low,
    }
    numbers = len(re.findall(r"\d+\s?(?:%|\+|x|k\b)", low))
    length_ok = 250 <= words <= 900

    score = (
        sum(sections.values()) * 8
        + sum(contact.values()) * 6
        + (14 if length_ok else 6)
        + (14 if numbers >= 3 else 4 if numbers else 0)
    )

    tips = []
    for name, ok in sections.items():
        if not ok:
            tips.append(f"Add a clear {name.title()} section.")
    if not contact["phone"]:
        tips.append("Add a phone number.")
    if not contact["linkedin"]:
        tips.append("Add your LinkedIn link.")
    if not length_ok:
        tips.append(f"Your resume has {words} words. Aim for 250 to 900.")
    if numbers < 3:
        tips.append("Add numbers to your bullets (users, percentages, results).")

    return {"score": min(score, 100), "sections": sections,
            "contact": contact, "words": words, "tips": tips}


def eligibility(resume_text: str, jd_text: str) -> dict:
    jd, rs = jd_text.lower(), resume_text.lower()
    checks = []

    if re.search(r"\b(?:b\.?e|b\.?tech|bachelor)\b", jd):
        ok = bool(re.search(r"\b(?:b\.?e|b\.?tech|bachelor|bca|mca)\b", rs))
        checks.append({"label": "Degree", "ok": ok,
                       "detail": "Degree found" if ok else "No matching degree found"})

    need = re.search(r"(\d+(?:\.\d+)?)\s*(?:cgpa|gpa|cpi|spi)", jd)
    have = re.search(r"(?:cgpa|gpa|cpi|spi)\s*[:\-]?\s*(\d+(?:\.\d+)?)", rs)
    if need:
        if have:
            ok = float(have.group(1)) >= float(need.group(1))
            checks.append({"label": "CGPA", "ok": ok,
                           "detail": f"You: {have.group(1)}, required: {need.group(1)}"})
        else:
            checks.append({"label": "CGPA", "ok": None,
                           "detail": "CGPA not found in your resume"})

    if re.search(r"fresher|no prior|entry[- ]level|intern", jd):
        checks.append({"label": "Experience", "ok": True, "detail": "Fresher-friendly role"})
    else:
        m = re.search(r"(\d+)\+?\s*years?", jd)
        if m:
            checks.append({"label": "Experience", "ok": None,
                           "detail": f"JD asks for {m.group(1)}+ years. Check your experience section."})

    known = [c for c in checks if c["ok"] is not None]
    score = round(100 * sum(c["ok"] for c in known) / len(known)) if known else None
    return {"score": score, "checks": checks}


PLAN = {
    "data structures": ("Solve 30 array, linked list, stack and tree problems", 3),
    "operating systems": ("Learn processes, threads, scheduling and memory", 2),
    "computer networks": ("Study TCP/IP, HTTP and DNS; trace a request in dev tools", 2),
}


def build_roadmap(missing: list[str]) -> list[dict]:
    steps = []
    for s in missing[:5]:
        task, weeks = PLAN.get(s.lower(), (f"Learn {s} basics, then build one small project with it", 2))
        steps.append({"skill": s, "weeks": weeks, "task": task})
    return steps


def ai_feedback(resume_text: str, jd_text: str, missing: list[str]):
    """Optional. Returns None when there is no API key or anything fails."""
    key = os.getenv("ANTHROPIC_API_KEY")
    if not key:
        return None
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=key)
        prompt = (
            "You are a resume coach for students and early-career candidates.\n"
            f"Job description:\n{jd_text[:3000]}\n\nResume:\n{resume_text[:4000]}\n\n"
            f"Missing skills: {', '.join(missing)}\n\n"
            'Return ONLY JSON like {"suggestions": ["3 specific tips"], "highlights": ["3 strengths"]}'
        )
        msg = client.messages.create(
            model="claude-haiku-5-5",
            max_tokens=600,
            messages=[{"role": "user", "content": prompt}],
        )
        return json.loads(msg.content[0].text)
    except Exception:
        return None


def extra_analysis(resume_text: str, jd_text: str, missing: list[str]) -> dict:
    return {
        "health": resume_health(resume_text),
        "eligibility": eligibility(resume_text, jd_text),
        "roadmap": build_roadmap(missing),
        "ai": ai_feedback(resume_text, jd_text, missing),
    }