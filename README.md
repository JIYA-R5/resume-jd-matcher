# 🎯 Resume JD Matcher

> Am I ready for this job? Get your answer in seconds.

![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB&style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white&style=for-the-badge)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white&style=for-the-badge)
![scikit-learn](https://img.shields.io/badge/scikit--learn-F7931E?logo=scikitlearn&logoColor=white&style=for-the-badge)

Built for **freshers and first-time job seekers**. Upload your resume, paste a job description, and see where you stand *before* you apply.

🔗 **[Live Demo](https://matchresume-delta.vercel.app/)**

## Features

- 🎯 Match score out of 100 (meaning match + skills covered)
- 🧩 Clickable Found / Missing skill boxes with glass popups
- 📊 Gaps grouped by Languages, Frameworks, Databases, Tools & Cloud, Concepts
- 🧠 "Why this score?" explained in plain language
- 🚀 A tip for every missing skill
- 🌙 Dark and light theme

## How it works

```mermaid
flowchart LR
    A[📄 Resume] --> C[Extract & clean text]
    B[📝 Job Description] --> C
    C --> D[Skill detection]
    C --> E[TF-IDF + Cosine similarity]
    D --> F[🧩 Skills covered]
    E --> G[🧠 Meaning match]
    F --> H[🎯 Score + gaps + tips]
    G --> H
```

## What I learned building this

- My first version used `sentence-transformers`, but it was too heavy for free hosting.
- I replaced it with **TF-IDF + cosine similarity**, which is lightweight and runs on a 512 MB server.
- Splitting React code into small components made adding new sections easy.

---

Built by **Jiya Shah** · Computer Engineering student
