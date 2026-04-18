export default function Card({ children, className = '' }) {
    return (
        <section className={`rounded-[30px] border border-slate-800 bg-slate-950/70 p-6 shadow-lg ${className}`}>
            {children}
        </section>
    )
}
