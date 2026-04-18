export default function MenuButton({ children, variant = 'primary', className = '', ...props }) {
    const variants = {
        primary: 'border-transparent bg-[#d9ff66] text-slate-950 hover:bg-[#ebff9a]',
        secondary: 'border-slate-700 bg-slate-900/70 text-slate-100 hover:bg-slate-800',
        danger: 'border-rose-400/30 bg-rose-400/10 text-rose-100 hover:bg-rose-400/20',
    }

    return (
        <button
            {...props}
            className={`rounded-[20px] border px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
        >
            {children}
        </button>
    )
}
