from pathlib import Path
from app.matcher import match

resume = Path("samples/resume.txt").read_text(encoding="utf-8")
jd = Path("samples/jd.txt").read_text(encoding="utf-8")

result = match(resume, jd)
print("Score:", result["score"])
print("Matched skills:", result["matched_skills"])
print("Missing skills:", result["missing_skills"])
for d in result["details"]:
    print(f'{d["similarity"]:.2f}  {d["requirement"]}  ->  {d["best_resume_line"]}')