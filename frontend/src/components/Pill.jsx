export default function Pill({ children, tone = 'neutral' }) {
    const tones = {
        neutral: 'border-slate-700 bg-slate-900/80 text-slate-200',
        accent: 'border-amber-300/40 bg-amber-300/10 text-amber-100',
        success: 'border-emerald-300/30 bg-emerald-300/10 text-emerald-100',
        warning: 'border-orange-300/30 bg-orange-300/10 text-orange-100',
        danger: 'border-rose-300/30 bg-rose-300/10 text-rose-100',
    }

    return (
        <span className={`inline-flex rounded-lg border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${tones[tone]}`}>
            {children}
        </span>
    )
}
