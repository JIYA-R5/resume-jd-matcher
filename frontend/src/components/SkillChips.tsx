const Tick = () => (
    <svg className="tick" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
);

interface Props { matched: string[]; missing: string[] }

export default function SkillChips({ matched, missing }: Props) {
    return (
        <div className="card">
            <h3>
                ✅ Matched Skills <span className="count ok">{matched.length} found</span>
            </h3>
            <div className="chips">
                {matched.length === 0 && <span className="tip">No matched skills yet.</span>}
                {matched.map((s) => (
                    <span key={s} className="chip ok">{s}<Tick /></span>
                ))}
            </div>

            <h3>
                ⚠️ Missing Skills <span className="count miss">{missing.length} missing</span>
            </h3>
            <div className="chips">
                {missing.length === 0 && <span className="tip">Nothing missing, great job!</span>}
                {missing.map((s) => (
                    <span key={s} className="chip miss">{s}</span>
                ))}
            </div>

            {missing.length > 0 && (
                <p className="tip">
                    💡 Tip: add these missing skills to your resume (projects/experience) where relevant
                    to improve your score.
                </p>
            )}
        </div>
    );
}
