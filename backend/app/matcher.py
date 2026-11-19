import re
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer, ENGLISH_STOP_WORDS
from sklearn.metrics.pairwise import cosine_similarity

from .cleaner import clean_text, split_chunks
from .skills import extract_skills, suggest_roles, group_by_category

THRESHOLD = 0.08
LOW, HIGH = 0.02, 0.38

STOP_WORDS = set(ENGLISH_STOP_WORDS)


def stem_word(w: str) -> str:
    """Lightweight rule-based stemmer for technical and common resume terms."""
    w = w.lower().strip(".,;:!?\"'()[]{}")
    if w.endswith("ies") and len(w) > 4:
        return w[:-3] + "y"
    if w.endswith("es") and len(w) > 3:
        return w[:-2]
    if w.endswith("s") and not w.endswith("ss") and len(w) > 2:
        w = w[:-1]
    if w.endswith("ing") and len(w) > 5:
        w = w[:-3]
    if w.endswith("ed") and len(w) > 4:
        w = w[:-2]
    if w.endswith("ment") and len(w) > 6:
        w = w[:-4]
    if w.endswith("tion") and len(w) > 6:
        w = w[:-4]
    if w.endswith("er") and len(w) > 4:
        w = w[:-2]
    if w == "built":
        return "build"
    if "team" in w:
        return "team"
    return w


def tokenize_and_stem(text: str) -> list[str]:
    """Tokenize text preserving tech tokens (+, #, .) and apply stemming."""
    raw_tokens = re.findall(r"[a-zA-Z0-9+#.]+", text.lower())
    tokens = []
    for t in raw_tokens:
        clean = t.strip(".,;:!?\"'()[]{}")
        if len(clean) > 1 and clean not in STOP_WORDS:
            tokens.append(stem_word(clean))
    return tokens


def get_vectorizer() -> TfidfVectorizer:
    """Create a configured TfidfVectorizer for resume and JD text."""
    return TfidfVectorizer(
        tokenizer=tokenize_and_stem,
        ngram_range=(1, 2),
        token_pattern=None,
        sublinear_tf=True,
    )


def match(resume_text: str, jd_text: str) -> dict:
    cleaned_resume = clean_text(resume_text)
    cleaned_jd = clean_text(jd_text)

    resume_chunks = split_chunks(cleaned_resume)
    jd_chunks = split_chunks(cleaned_jd)

    if not resume_chunks:
        resume_chunks = [cleaned_resume] if cleaned_resume else [""]
    if not jd_chunks:
        jd_chunks = [cleaned_jd] if cleaned_jd else [""]

    vectorizer = get_vectorizer()
    corpus = resume_chunks + jd_chunks + [cleaned_resume, cleaned_jd]

    try:
        vectorizer.fit(corpus)
        r_vecs = vectorizer.transform(resume_chunks)
        j_vecs = vectorizer.transform(jd_chunks)
        sim = cosine_similarity(j_vecs, r_vecs)

        doc_r = vectorizer.transform([cleaned_resume])
        doc_j = vectorizer.transform([cleaned_jd])
        doc_sim = float(cosine_similarity(doc_j, doc_r)[0][0])
    except ValueError:
        sim = np.zeros((len(jd_chunks), len(resume_chunks)))
        doc_sim = 0.0

    best = sim.max(axis=1) if sim.size > 0 else np.zeros(len(jd_chunks))
    best_idx = sim.argmax(axis=1) if sim.size > 0 else np.zeros(len(jd_chunks), dtype=int)

    details = []
    for i in range(len(jd_chunks)):
        b_idx = int(best_idx[i])
        best_line = resume_chunks[b_idx] if b_idx < len(resume_chunks) else ""
        similarity = float(best[i])

        jd_line_skills = extract_skills(jd_chunks[i])
        res_line_skills = extract_skills(best_line) if best_line else set()
        skill_matched = bool(jd_line_skills & res_line_skills)

        is_matched = bool(similarity >= THRESHOLD or skill_matched)

        details.append({
            "requirement": jd_chunks[i],
            "best_resume_line": best_line,
            "similarity": round(similarity, 3),
            "matched": is_matched,
        })

    chunk_mean = float(best.mean()) if len(best) > 0 else 0.0
    content_raw = 0.6 * chunk_mean + 0.4 * doc_sim
    semantic = float(np.clip((content_raw - LOW) / (HIGH - LOW), 0.0, 1.0))

    jd_skills = extract_skills(jd_text)
    resume_skills = extract_skills(resume_text)
    matched = sorted(jd_skills & resume_skills)
    missing = sorted(jd_skills - resume_skills)
    coverage = len(matched) / len(jd_skills) if jd_skills else None

    final = semantic if coverage is None else 0.6 * semantic + 0.4 * coverage

    final_pct = round(final * 100, 1)
    roles = suggest_roles(resume_skills)

    if final_pct >= 75:
        verdict = "Strong match. Apply with confidence."
    elif final_pct >= 50:
        verdict = f"Moderate match. Add or highlight: {', '.join(missing[:3]) or 'more relevant experience'}."
    else:
        top_role = roles[0] if roles else {"role": "General Developer", "fit": 0}
        verdict = (
            f"Low match for this JD. Your profile fits better as: "
            f"{top_role['role']} ({top_role['fit']}% fit)."
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
