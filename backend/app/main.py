from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from .matcher import match
from .parser import extract_text

app = FastAPI(title="Resume JD Matcher")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/match")
async def match_endpoint(resume: UploadFile = File(...), jd_text: str = Form(...)):
    content = await resume.read()
    try:
        resume_text = extract_text(resume.filename or "", content)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if len(resume_text.strip()) < 50:
        raise HTTPException(status_code=422, detail="Could not read text from the resume.")
    if len(jd_text.strip()) < 30:
        raise HTTPException(status_code=422, detail="Job description is too short.")

    return match(resume_text, jd_text)