import { useEffect, useState } from "react";
import ScoreCard from "./components/ScoreCard";
import ThemeToggle from "./components/ThemeToggle";

const API_URL = import.meta.env.VITE_API_URL ?? "/api";

interface Metric {
  name: string;
  value: number;
}

interface Result {
  score: number;
  metrics: Metric[];
  matched: string[];
  missing: string[];
}

interface Gap {
  category: string;
  matched: string[];
  missing: string[];
}

type Panel =
  | { type: "found" }
  | { type: "missing" }
  | { type: "why" }
  | { type: "gap"; index: number }
  | null;

/* ---------- skills ko categories mein baantna ---------- */
const CATEGORIES: Record<string, string[]> = {
  Languages: ["python", "java", "c", "c++", "javascript", "typescript", "go"],
  Frameworks: ["fastapi", "flask", "django", "react", "node.js", "express", "spring"],
  Databases: ["sql", "mysql", "postgresql", "mongodb", "sqlite"],
  "Tools & Cloud": ["docker", "aws", "git", "github", "kubernetes", "linux", "azure", "gcp"],
  Concepts: ["rest api", "data structures", "algorithms", "oop", "machine learning"],
};

function buildGaps(matched: string[], missing: string[]): Gap[] {
  const names = [...Object.keys(CATEGORIES), "Other"];
  const catOf = (s: string) =>
    Object.keys(CATEGORIES).find((c) => CATEGORIES[c].includes(s.toLowerCase())) ?? "Other";
  const map: Record<string, Gap> = {};
  names.forEach((c) => (map[c] = { category: c, matched: [], missing: [] }));
  matched.forEach((s) => map[catOf(s)].matched.push(s));
  missing.forEach((s) => map[catOf(s)].missing.push(s));
  return names.map((c) => map[c]).filter((g) => g.matched.length + g.missing.length > 0);
}

const TIPS: Record<string, string> = {
  docker: "Docker: apne ek project ko containerise karo aur Dockerfile GitHub par daalo.",
  fastapi: "FastAPI: 2 endpoints wali chhoti API banao aur resume mein likho.",
  "rest api": "REST API: project bullet mein likho ki kaun se endpoints banaye.",
  aws: "AWS: free tier par ek app deploy karo (EC2 ya S3).",
  sql: "SQL: ek project mein real database queries use karo.",
  git: "Git: chhote commits ke saath GitHub profile active rakho.",
};
const tipFor = (s: string) =>
  TIPS[s.toLowerCase()] ?? `${s}: iska ek chhota project banao aur resume mein jodo.`;

/* ---------- glass popup ---------- */
function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div className="rs-overlay" onClick={onClose}>
      <div className="rs-pop" onClick={(e) => e.stopPropagation()}>
        <h3>
          {title}
          <button className="rs-x" onClick={onClose} aria-label="Close">
            ×
          </button>
        </h3>
        {children}
      </div>
    </div>
  );
}

function Chips({ items, ok }: { items: string[]; ok?: boolean }) {
  if (!items.length) return null;
  return (
    <div className="rs-chips">
      {items.map((s) => (
        <span key={s} className={`rs-chip ${ok ? "ok" : "ms"}`}>
          {ok ? "✓ " : ""}
          {s}
        </span>
      ))}
    </div>
  );
}

/* ---------- 4 sections ---------- */
function ResultSections({ result }: { result: Result }) {
  const [panel, setPanel] = useState<Panel>(null);
  const close = () => setPanel(null);

  const { matched, missing, score, metrics } = result;
  const total = matched.length + missing.length;
  const skills = total ? (matched.length / total) * 100 : 0;
  const meaningMetric =
    metrics.find((m) => /semantic|meaning/i.test(m.name)) ?? metrics[0];
  const meaning = meaningMetric?.value ?? 0;
  const gaps = buildGaps(matched, missing);

  const tips = missing.slice(0, 3).map(tipFor);
  if (tips.length < 3) tips.push("JD ke words apne project bullets mein use karo.");
  if (tips.length < 3) tips.push("Sabse mazboot project resume mein sabse upar rakho.");

  return (
    <>
      <section className="rs-card">
        <h3>1 · Skills in the job description</h3>
        <div className="rs-two">
          <button className="rs-box ok" onClick={() => setPanel({ type: "found" })}>
            <b>{matched.length}</b>
            <span>Found in your resume · tap to open</span>
          </button>
          <button className="rs-box ms" onClick={() => setPanel({ type: "missing" })}>
            <b>{missing.length}</b>
            <span>Missing from your resume · tap to open</span>
          </button>
        </div>
      </section>

      <section className="rs-card">
        <h3>2 · Where the gaps are</h3>
        <div className="rs-gaps">
          {gaps.map((g, i) => {
            const t = g.matched.length + g.missing.length;
            return (
              <button
                key={g.category}
                className="rs-box rs-row"
                onClick={() => setPanel({ type: "gap", index: i })}
              >
                <b>{g.category}</b>
                <div className="rs-bar">
                  <i style={{ width: `${(g.matched.length / t) * 100}%` }} />
                </div>
                <span>
                  {g.matched.length}/{t}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rs-card">
        <h3>3 · Why this score?</h3>
        <p className="rs-muted">
          Tumhari skills coverage {skills.toFixed(1)}% hai aur resume ki wording JD se{" "}
          {meaning.toFixed(1)}% milti hai.
        </p>
        <button className="rs-ghost" onClick={() => setPanel({ type: "why" })}>
          Read full explanation
        </button>
      </section>

      <section className="rs-card">
        <h3>4 · How to improve</h3>
        <ul className="rs-list">
          {tips.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </section>

      {panel?.type === "found" && (
        <Modal title="Skills found in your resume" onClose={close}>
          <p className="rs-muted">Ye skills resume mein pehle se hain. Inhe visible rakho.</p>
          <Chips items={matched} ok />
        </Modal>
      )}
      {panel?.type === "missing" && (
        <Modal title="Skills missing from your resume" onClose={close}>
          <p className="rs-muted">
            Inhe tabhi jodo jab sach mein aati hon. Nahi aati to chhota project banao.
          </p>
          <Chips items={missing} />
          <ul className="rs-list">
            {missing.map((s) => (
              <li key={s}>{tipFor(s)}</li>
            ))}
          </ul>
        </Modal>
      )}
      {panel?.type === "gap" && gaps[panel.index] && (
        <Modal title={`${gaps[panel.index].category} · gaps`} onClose={close}>
          <Chips items={gaps[panel.index].matched} ok />
          <Chips items={gaps[panel.index].missing} />
          <p className="rs-muted">
            {gaps[panel.index].missing.length
              ? `Missing: ${gaps[panel.index].missing.join(", ")}.`
              : "Is category mein koi gap nahi hai."}
          </p>
        </Modal>
      )}
      {panel?.type === "why" && (
        <Modal title="How your score is calculated" onClose={close}>
          <p>
            <b>Meaning match ({meaning.toFixed(1)}%)</b>: resume aur JD ke words kitne milte hain.
          </p>
          <p>
            <b>Skills covered ({skills.toFixed(1)}%)</b>: JD ki {total} skills mein se{" "}
            {matched.length} resume mein mili.
          </p>
          <p>
            <b>Final score: {Math.round(score)} / 100</b>
          </p>
        </Modal>
      )}
    </>
  );
}

/* ---------- main App ---------- */
export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !jd.trim()) {
      setError("Resume upload karo aur Job Description paste karo.");
      return;
    }
    setError("");
    setLoading(true);
    setResult(null);

    try {
      const form = new FormData();
      form.append("resume", file);
      form.append("jd_text", jd);

      const res = await fetch(`${API_URL}/match`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();

      setResult({
        score: data.score ?? 0,
        metrics: data.metrics ?? [
          { name: "Semantic", value: data.semantic_score ?? 0 },
          ...(data.coverage != null
            ? [{ name: "Skill Coverage", value: data.coverage * 100 }]
            : []),
        ],
        matched: data.matched_skills ?? [],
        missing: data.missing_skills ?? [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kuch galat ho gaya.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1>Resume Matcher</h1>
        <ThemeToggle />
      </header>

      <form className="card" onSubmit={handleSubmit}>
        <h3>📄 Upload Resume</h3>
        <input
          type="file"
          accept=".pdf,.docx,.txt"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />

        <h3>📝 Job Description</h3>
        <textarea
          rows={8}
          style={{ width: "100%" }}
          placeholder="Job description yahan paste karo..."
          value={jd}
          onChange={(e) => setJd(e.target.value)}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Analyzing..." : "Match Karo"}
        </button>
        {error && <p className="tip">⚠️ {error}</p>}
      </form>

      {result && (
        <>
          <ScoreCard score={result.score} metrics={result.metrics} />
          <ResultSections result={result} />
        </>
      )}
    </div>
  );
}
