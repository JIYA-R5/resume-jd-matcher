import { useState } from "react";
import type { ReactNode } from "react";

type Check = { label: string; ok: boolean | null; detail: string };

export type AnalysisResult = {
    score: number;
    matched: string[];
    missing: string[];
    metrics: { name: string; value: number }[];
    eligibility?: { score: number | null; checks: Check[] };
    health?: { tips: string[] };
    roles?: string[];
    roadmap?: { skill: string; weeks: number; task: string }[];
    ai?: { suggestions: string[]; highlights: string[] } | null;
};

const tipFor = (skill: string) =>
    `Learn ${skill} and add one small project that uses it to your resume.`;

const getHighlights = (r: AnalysisResult): string[] =>
    r.ai?.highlights ?? [
        ...r.matched.slice(0, 3).map((s) => `Strong in ${s}`),
        ...(r.eligibility?.checks.filter((c) => c.ok).map((c) => `${c.label}: ${c.detail}`) ?? []),
    ];

const getSuggestions = (r: AnalysisResult): string[] =>
    r.ai?.suggestions ?? [...r.missing.slice(0, 3).map(tipFor), ...(r.health?.tips ?? [])];

function Box({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="card an-card">
            <h3>{title}</h3>
            {children}
        </section>
    );
}

function Chips({ items, ok }: { items: string[]; ok?: boolean }) {
    if (!items.length) return <p className="an-muted">Nothing to show.</p>;
    return (
        <div className="an-chips">
            {items.map((s) => (
                <span key={s} className={ok ? "an-chip ok" : "an-chip miss"}>{s}</span>
            ))}
        </div>
    );
}

/* ---------- box 3 ---------- */
export function BreakdownCard({ result }: { result: AnalysisResult }) {
    const total = result.matched.length + result.missing.length;
    const skills = total ? (result.matched.length / total) * 100 : 0;
    const meaning = result.metrics.find((m) => /semantic|meaning/i.test(m.name))?.value ?? 0;
    const elig = result.eligibility?.score;
    const rows: [string, number][] = [["Skills match", skills], ["Meaning match", meaning]];
    if (elig != null) rows.push(["Eligibility", elig]);
    return (
        <Box title="📊 Score breakdown">
            {rows.map(([name, v]) => (
                <div key={name}>
                    <div className="bar-label"><span>{name}</span><b>{Math.round(v)}%</b></div>
                    <div className="bar"><i style={{ width: `${Math.min(100, v)}%` }} /></div>
                </div>
            ))}
        </Box>
    );
}

/* ---------- boxes 4, 5, 6 ---------- */
function GapsCard({ result }: { result: AnalysisResult }) {
    return (
        <Box title="🧩 Skills gaps">
            <Chips items={result.missing} />
        </Box>
    );
}

function HighlightsCard({ result }: { result: AnalysisResult }) {
    return (
        <Box title="⭐ Key highlights">
            <ul className="an-list">
                {getHighlights(result).slice(0, 5).map((t) => <li key={t}>✓ {t}</li>)}
            </ul>
        </Box>
    );
}

function SuggestionsCard({ result }: { result: AnalysisResult }) {
    return (
        <Box title="💡 Suggestions">
            <ul className="an-list">
                {getSuggestions(result).slice(0, 5).map((t) => <li key={t}>{t}</li>)}
            </ul>
        </Box>
    );
}

/* ---------- box 7: PDF ---------- */
async function downloadReport(result: AnalysisResult) {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const M = 48;
    let y = M;

    const need = (h: number) => {
        if (y + h > H - M) { doc.addPage(); y = M; }
    };
    const heading = (t: string) => {
        need(40);
        y += 10;
        doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.setTextColor(37, 99, 235);
        doc.text(t, M, y); y += 8;
        doc.setDrawColor(191, 219, 254); doc.line(M, y, W - M, y); y += 16;
    };
    const para = (t: string) => {
        doc.setFont("helvetica", "normal"); doc.setFontSize(11); doc.setTextColor(30, 41, 59);
        (doc.splitTextToSize(t, W - M * 2) as string[]).forEach((ln) => {
            need(16); doc.text(ln, M, y); y += 15;
        });
    };
    const bullets = (items: string[]) => items.forEach((t) => para(`- ${t}`));

    const total = result.matched.length + result.missing.length;
    const skills = total ? (result.matched.length / total) * 100 : 0;
    const meaning = result.metrics.find((m) => /semantic|meaning/i.test(m.name))?.value ?? 0;
    const elig = result.eligibility?.score;

    doc.setFont("helvetica", "bold"); doc.setFontSize(22); doc.setTextColor(11, 27, 63);
    doc.text("Skillora", M, y); y += 20;
    doc.setFont("helvetica", "normal"); doc.setFontSize(11); doc.setTextColor(81, 99, 138);
    doc.text(`Resume match report - ${new Date().toLocaleDateString()}`, M, y); y += 34;
    doc.setFont("helvetica", "bold"); doc.setFontSize(34); doc.setTextColor(37, 99, 235);
    doc.text(`${Math.round(result.score)} / 100`, M, y); y += 10;

    heading("Score breakdown");
    para(`Skills match: ${Math.round(skills)}%`);
    para(`Meaning match: ${Math.round(meaning)}%`);
    if (elig != null) para(`Eligibility: ${Math.round(elig)}%`);

    heading("Skills found in your resume");
    para(result.matched.join(", ") || "None found");

    heading("Skills missing");
    para(result.missing.join(", ") || "No gaps found");

    heading("Key highlights");
    bullets(getHighlights(result).slice(0, 6));

    heading("Suggestions");
    bullets(getSuggestions(result).slice(0, 6));

    if (result.roles?.length) {
        heading("Role recommendations");
        para(result.roles.slice(0, 5).join(", "));
    }
    if (result.roadmap?.length) {
        heading("Learning roadmap");
        bullets(result.roadmap.map((s) => `${s.skill} (${s.weeks} wk): ${s.task}`));
    }

    doc.save("skillora-report.pdf");
}

function DownloadCard({ result }: { result: AnalysisResult }) {
    const [busy, setBusy] = useState(false);
    return (
        <Box title="📄 Download PDF report">
            <p>Save your score, skill gaps, suggestions and learning roadmap as a PDF.</p>
            <button
                type="button"
                className="dl-btn"
                disabled={busy}
                onClick={async () => {
                    setBusy(true);
                    try { await downloadReport(result); } finally { setBusy(false); }
                }}
            >
                {busy ? "Preparing..." : "Download report"}
            </button>
        </Box>
    );
}

/* ---------- boxes 8, 9 ---------- */
function RolesCard({ result }: { result: AnalysisResult }) {
    return (
        <Box title="🎯 Role recommendations">
            <Chips items={(result.roles ?? []).slice(0, 5)} ok />
        </Box>
    );
}

function RoadmapCard({ result }: { result: AnalysisResult }) {
    return (
        <Box title="🗺️ Learning roadmap">
            <ol className="an-list">
                {(result.roadmap ?? []).map((s) => (
                    <li key={s.skill}><b>{s.skill}</b> ({s.weeks} wk): {s.task}</li>
                ))}
            </ol>
        </Box>
    );
}

/* ---------- the two rows under the top section ---------- */
export function AnalysisRows({ result }: { result: AnalysisResult }) {
    return (
        <>
            <div className="cards-3">
                <GapsCard result={result} />
                <HighlightsCard result={result} />
                <SuggestionsCard result={result} />
            </div>
            <div className="cards-3">
                <DownloadCard result={result} />
                <RolesCard result={result} />
                <RoadmapCard result={result} />
            </div>
        </>
    );
}
