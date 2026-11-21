from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from .matcher import match
from .parser import extract_text

app = FastAPI(title="Resume JD Matcher", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "title": "Resume JD Matcher API",
        "status": "online",
        "engine": "TF-IDF + Cosine Similarity",
    }


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/match")
async def match_endpoint(resume: UploadFile = File(...), jd_text: str = Form(...)):
    content = await resume.read()
    try:
        resume_text = extract_text(resume.filename or "", content)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if len(resume_text.strip()) < 50:
        raise HTTPException(
            status_code=422,
            detail="Could not read enough text from the resume. Please ensure the file is readable.",
        )
    if len(jd_text.strip()) < 30:
        raise HTTPException(
            status_code=422,
            detail="Job description is too short. Please provide at least 30 characters.",
        )

    return match(resume_text, jd_text)

