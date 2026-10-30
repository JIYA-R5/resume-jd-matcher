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
    return {skill for skill, p in PATTERNS.items() if p.search(text)}