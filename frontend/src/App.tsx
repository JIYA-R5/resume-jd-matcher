import { useEffect, useState } from "react";
import ScoreCard from "./components/ScoreCard";
import ThemeToggle from "./components/ThemeToggle";
import { BreakdownCard, AnalysisRows } from "./AnalysisCards";

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

//glass reume card 
function ResumePreview() {
  return (
    <div className="resume-scene">
      <div className="resume-card">
        <div className="resume-header">
          <div className="resume-icon">📄</div>
          <div className="resume-title">
            <h3>My Resume</h3>
            <span>resume.pdf</span>
          </div>
          <div className="live-badge">
            <span className="live-dot"></span>
            LIVE
          </div>
        </div>

        <div className="resume-content">
          <div className="resume-name"></div>
          <div className="resume-role typing-text">Frontend Developer</div>
          <div className="resume-divider"></div>

          <div className="resume-section">SKILLS</div>
          <div className="resume-line long"></div>
          <div className="resume-line medium"></div>
          <div className="resume-line short"></div>

          <div className="resume-section">EXPERIENCE</div>
          <div className="resume-line long"></div>
          <div className="resume-line medium"></div>
          <div className="resume-line long"></div>

          <div className="resume-section">EDUCATION</div>
          <div className="resume-line medium"></div>
          <div className="resume-line short"></div>
        </div>

        <div className="scan-line"></div>
      </div>

      <div className="ai-label">✨ AI Resume Analysis</div>
    </div>
  );
}


//skillora 
const WORD = "Skillora";
const HEADLINE = "Know Your Match. Bridge Your Gaps. Get Career-Ready.";
const DESC =
  "See where you stand, discover what's missing, and get smarter insights to move closer to your dream job. Turn your potential into progress with personalized recommendations that help you stand out.";

function Landing({ onStart }: { onStart: () => void }) {
  const [n, setN] = useState(() =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ? DESC.length : 0
  );

  useEffect(() => {
    if (n >= DESC.length) return;
    const t = setTimeout(() => setN(n + 1), 28);
    return () => clearTimeout(t);
  }, [n]);

  return (
    <div className="lp-hero">
      <div className="lp-topbar">
        <ThemeToggle />
      </div>
      <div className="lp-split">
        <div className="lp-left">
          <div className="lp-brand">
            <img src="/final_logo.png" alt="Skillora logo" className="lp-mark" />
            <h1 className="lp-word" aria-label={WORD}>
              {WORD.split("").map((c, k) => (
                <span key={k} style={{ animationDelay: `${0.3 + k * 0.09}s` }}>{c}</span>
              ))}
            </h1>
          </div>

          <p className="lp-headline">{HEADLINE}</p>

          <p className="lp-desc" aria-label={DESC}>
            <span className="lp-ghost" aria-hidden="true">{DESC}</span>
            <span className="lp-type" aria-hidden="true">
              {DESC.slice(0, n)}
              <span className="lp-caret">|</span>
            </span>
          </p>

          <button className="lp-btn" onClick={onStart}>Analyze Your Resume</button>
        </div>

        <div className="lp-right">
          <ResumePreview />
        </div>
      </div>
    </div>
  );
}



/* ---------- main App ---------- */
export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [started, setStarted] = useState(false);
  if (!started) return <Landing onStart={() => setStarted(true)} />;

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
        <div className="app-left">
          <button className="back-btn" onClick={() => setStarted(false)} aria-label="Back">
            ← Back
          </button>

          <div className="app-brand">
            <img src="/final_logo.png" alt="Skillora logo" className="app-logo" />
            <span className="app-name">Skillora</span>
          </div>
        </div>

        <ThemeToggle />
      </header>


      <div className="app-grid">
        {/* LEFT: upload + job description */}
        <form className="card left-card" onSubmit={handleSubmit}>
          <h3>📄 Upload Resume</h3>
          <input
            type="file"
            accept=".pdf,.docx,.txt"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />

          <h3>📝 Job Description</h3>
          <textarea
            placeholder="Job description yahan paste karo..."
            value={jd}
            onChange={(e) => setJd(e.target.value)}
          />

          <button type="submit" disabled={loading}>
            {loading ? "Analyzing..." : "Match Karo"}
          </button>
          {error && <p className="tip">⚠️ {error}</p>}
        </form>


        {/* RIGHT: score + results */}
        <div className="right-col">
          {result ? (
            <>
              <ScoreCard score={result.score} metrics={result.metrics} />
              <BreakdownCard result={result} />
            </>
          ) : (
            <div className="card right-empty">
              <h3>🎯 Match Score</h3>
              <p>Resume upload karo, job description paste karo, phir "Match Karo" dabao.</p>
            </div>
          )}
        </div>
      </div>

      {result && <AnalysisRows result={result} />}
    </div>
  );
}
