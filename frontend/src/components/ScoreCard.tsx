interface Metric { name: string; value: number }
interface Props { score: number; metrics?: Metric[] }

const R = 80;
const C = 2 * Math.PI * R;
const ARC = C * 0.75;

function tierOf(score: number) {
    if (score >= 75) return { text: "A-Tier / Strong Match", cls: "good" };
    if (score >= 50) return { text: "B-Tier / Good Match", cls: "" };
    return { text: "Needs Work", cls: "low" };
}

export default function ScoreCard({ score, metrics = [] }: Props) {
    const s = Math.max(0, Math.min(100, score));
    const tier = tierOf(s);

    return (
        <div className="card score-card">
            <h3>🎯 Match Score</h3>

            <div className="gauge">
                <svg viewBox="0 0 200 200">
                    <defs>
                        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#7c4dff" />
                            <stop offset="60%" stopColor="#b13cf0" />
                            <stop offset="100%" stopColor="#e879f9" />
                        </linearGradient>
                    </defs>
                    <circle className="track" cx="100" cy="100" r={R} fill="none" strokeWidth="14"
                        strokeLinecap="round" strokeDasharray={`${ARC} ${C}`} />
                    <circle className="value" cx="100" cy="100" r={R} fill="none" strokeWidth="14"
                        stroke="url(#g)" strokeLinecap="round"
                        strokeDasharray={`${(ARC * s) / 100} ${C}`} />
                </svg>
                <div className="label">
                    <div className="num">{Math.round(s)}</div>
                    <div className="sub">AI SCORE</div>
                </div>
            </div>

            <div className={`tier ${tier.cls}`}>{tier.text}</div>

            {metrics.length > 0 && (
                <div className="metrics">
                    {metrics.map((m) => {
                        const on = Math.round((m.value / 100) * 7);
                        return (
                            <div className="metric" key={m.name}>
                                <div className="name">{m.name}</div>
                                <div className="bars">
                                    {Array.from({ length: 7 }).map((_, i) => (
                                        <div key={i} className={`bar ${i < on ? "on" : ""}`} />
                                    ))}
                                </div>
                                <div className="pct">{Math.round(m.value)}%</div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
