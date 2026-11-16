from functools import lru_cache

import numpy as np
from sentence_transformers import SentenceTransformer

from .cleaner import clean_text, split_chunks
from .skills import extract_skills, suggest_roles, group_by_category

THRESHOLD = 0.45
LOW, HIGH = 0.20, 0.70


@lru_cache(maxsize=1)
def get_model() -> SentenceTransformer:
    return SentenceTransformer("all-MiniLM-L6-v2")


def match(resume_text: str, jd_text: str) -> dict:
    resume_chunks = split_chunks(clean_text(resume_text))
    jd_chunks = split_chunks(clean_text(jd_text))

    model = get_model()
    r = model.encode(resume_chunks, normalize_embeddings=True)
    j = model.encode(jd_chunks, normalize_embeddings=True)

    sim = j @ r.T
    best = sim.max(axis=1)
    best_idx = sim.argmax(axis=1)

    details = [
        {
            "requirement": jd_chunks[i],
            "best_resume_line": resume_chunks[int(best_idx[i])],
            "similarity": round(float(best[i]), 3),
            "matched": bool(best[i] >= THRESHOLD),
        }
        for i in range(len(jd_chunks))
    ]

    semantic = float(np.clip((best.mean() - LOW) / (HIGH - LOW), 0, 1))

    jd_skills = extract_skills(jd_text)
    resume_skills = extract_skills(resume_text)
    matched = sorted(jd_skills & resume_skills)
    missing = sorted(jd_skills - resume_skills)
    coverage = len(matched) / len(jd_skills) if jd_skills else None

    final = semantic if coverage is None else 0.6 * semantic + 0.4 * coverage

    # ---------- NEW: verdict + role suggestions + category feedback ----------
    final_pct = round(final * 100, 1)
    roles = suggest_roles(resume_skills)

    if final_pct >= 75:
        verdict = "Strong match. Apply with confidence."
    elif final_pct >= 50:
        verdict = f"Moderate match. Add or highlight: {', '.join(missing[:3]) or 'more relevant experience'}."
    else:
        verdict = (
            f"Low match for this JD. Your profile fits better as: "
            f"{roles[0]['role']} ({roles[0]['fit']}% fit)."
        )

    return {
        "score": final_pct,
        "verdict": verdict,
        "role_suggestions": roles[:3],
        "category_feedback": group_by_category(set(matched), set(missing)),
        "semantic_score": round(semantic * 100, 1),
        "skill_coverage": None if coverage is None else round(coverage * 100, 1),
        "matched_skills": matched,
        "missing_skills": missing,
        "details": details,
    }