import { useState } from "react";
import ScoreCard from "./components/ScoreCard";
import SkillChips from "./components/SkillChips";
import ThemeToggle from "./components/ThemeToggle";

const API_URL = "http://127.0.0.1:8000";

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
          <SkillChips matched={result.matched} missing={result.missing} />
        </>
      )}
    </div>
  );
}
