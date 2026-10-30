import io

import pdfplumber
from docx import Document


def extract_text(filename: str, content: bytes) -> str:
    name = filename.lower()

    if name.endswith(".pdf"):
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            return "\n".join(page.extract_text() or "" for page in pdf.pages)

    if name.endswith(".docx"):
        doc = Document(io.BytesIO(content))
        return "\n".join(p.text for p in doc.paragraphs)

    if name.endswith(".txt"):
        return content.decode("utf-8", errors="ignore")

    raise ValueError("Unsupported file type. Use PDF, DOCX or TXT.")