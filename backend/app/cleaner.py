import re


def clean_text(text: str) -> str:
    text = text.replace("•", "\n").replace("●", "\n")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{2,}", "\n", text)
    return text.strip()


def split_chunks(text: str, min_len: int = 25) -> list[str]:
    chunks: list[str] = []
    for line in text.split("\n"):
        line = line.strip(" -*\t")
        if not line:
            continue
        if chunks and len(chunks[-1]) < min_len:
            chunks[-1] += " " + line
        else:
            chunks.append(line)
    return chunks