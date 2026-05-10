// UI primitives — Card, Button, Badge, Tabs, Slider, Pagination, Kbd, ToggleGroup
const cls = (...a) => a.filter(Boolean).join(" ");

function Corners({ color = "rgba(243,239,230,0.30)" }) {
  const s = { borderColor: color };
  return (
    <>
      <span className="corner-tick corner-tl" style={s}/>
      <span className="corner-tick corner-tr" style={s}/>
      <span className="corner-tick corner-bl" style={s}/>
      <span className="corner-tick corner-br" style={s}/>
    </>
  );
}

function Card({ label, hint, corner, children, className = "", padded = true, glow }) {
  return (
    <div className={cls(
      "relative bg-pane border border-line",
      glow === "amber" && "glow-amber",
      glow === "cyan" && "glow-cyan",
      className
    )}>
      <Corners />
      {(label || corner) && (
        <div className="absolute -top-2 left-0 right-0 px-3 flex items-center justify-between pointer-events-none">
          {label ? (
            <span className="bg-ink px-2 tracker tracker-bone">{label}{hint && <span className="text-mute"> · {hint}</span>}</span>
          ) : <span/>}
          {corner ? <span className="bg-ink px-2 tracker">{corner}</span> : <span/>}
        </div>
      )}
      <div className={padded ? "p-5" : ""}>{children}</div>
    </div>
  );
}

function Btn({ variant = "ghost", size = "md", icon, children, className = "", ...rest }) {
  const base = "inline-flex items-center gap-2 font-mono uppercase tracking-[.14em] text-[11px] leading-none transition-colors select-none";
  const sizes = { sm: "h-7 px-2.5", md: "h-9 px-3.5", lg: "h-11 px-5 text-[12px]" };
  const vars = {
    primary: "bg-amber text-ink hover:bg-[#ffc36b]",
    cyan:    "bg-cyan text-ink hover:bg-[#7df0d8]",
    ghost:   "border border-line2 text-bone hover:border-bone hover:bg-pane2",
    danger:  "border border-rose/50 text-rose hover:bg-rose/10",
    bare:    "text-mute2 hover:text-bone",
  };
  return (
    <button className={cls(base, sizes[size], vars[variant], className)} {...rest}>
      {icon}{children}
    </button>
  );
}

function Badge({ tone = "bone", children, className = "" }) {
  const m = {
    amber: "border-amber/40 text-amber bg-amber/5",
    cyan:  "border-cyan/40 text-cyan bg-cyan/5",
    bone:  "border-line2 text-bone2",
    rose:  "border-rose/40 text-rose bg-rose/5",
    mute:  "border-line2 text-mute2",
    solidA:"bg-amber text-ink border-amber",
    solidC:"bg-cyan  text-ink border-cyan",
  };
  return (
    <span className={cls("inline-flex items-center h-5 px-1.5 border font-mono uppercase tracking-[.14em] text-[10px]", m[tone], className)}>
      {children}
    </span>
  );
}

function Kbd({ children }) {
  return <kbd className="inline-flex items-center h-5 min-w-[20px] px-1.5 border border-line2 bg-pane2 font-mono text-[10px] text-bone2">{children}</kbd>;
}

function Toggle({ items, value, onChange, tone = "amber", className = "" }) {
  return (
    <div className={cls("inline-flex border border-line2", className)}>
      {items.map((it, i) => {
        const active = value === it.value;
        return (
          <button key={it.value}
            onClick={() => onChange(it.value)}
            className={cls(
              "h-7 px-2.5 font-mono uppercase tracking-[.14em] text-[10.5px] leading-none",
              i > 0 && "border-l border-line2",
              active
                ? (tone === "cyan" ? "bg-cyan text-ink" : "bg-amber text-ink")
                : "text-mute2 hover:text-bone"
            )}>
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

function Tabs({ items, value, onChange }) {
  return (
    <div className="flex border-b border-line">
      {items.map((it) => {
        const a = value === it.value;
        return (
          <button key={it.value}
            onClick={() => onChange(it.value)}
            className={cls(
              "relative h-9 px-3 font-mono text-[11px] uppercase tracking-[.14em] flex items-center gap-2",
              a ? "text-bone" : "text-mute2 hover:text-bone"
            )}>
            {a && <span className="absolute left-0 right-0 -bottom-px h-px bg-amber"/>}
            <span className={cls("inline-block w-1.5 h-1.5", a ? "bg-amber" : "bg-line2")}/>
            {it.label}
          </button>
        );
      })}
      <div className="flex-1 border-b border-line"/>
    </div>
  );
}

function Pagination({ page, total, onPage }) {
  const pages = [1, 2, 3];
  return (
    <div className="flex items-center gap-1 font-mono text-[11px]">
      <button onClick={() => onPage(Math.max(1, page-1))} className="h-7 w-7 grid place-items-center border border-line2 text-mute2 hover:text-bone"><I.Left size={14}/></button>
      {pages.map(n => (
        <button key={n} onClick={() => onPage(n)} className={cls("h-7 min-w-[28px] px-2 border", page===n ? "border-amber text-amber bg-amber/5" : "border-line2 text-mute2 hover:text-bone")}>{String(n).padStart(2,"0")}</button>
      ))}
      <span className="text-mute px-1">···</span>
      <button onClick={() => onPage(total)} className={cls("h-7 min-w-[28px] px-2 border", page===total ? "border-amber text-amber bg-amber/5" : "border-line2 text-mute2 hover:text-bone")}>{total}</button>
      <button onClick={() => onPage(Math.min(total, page+1))} className="h-7 w-7 grid place-items-center border border-line2 text-mute2 hover:text-bone"><I.Right size={14}/></button>
    </div>
  );
}

function Field({ label, children, className }) {
  return (
    <div className={cls("flex items-baseline justify-between gap-3 py-2 border-b border-line/70 last:border-0", className)}>
      <span className="tracker">{label}</span>
      <span className="font-mono text-[12px] text-bone">{children}</span>
    </div>
  );
}

function Bar({ pct, tone = "amber" }) {
  return (
    <div className="h-1 bg-line w-full">
      <div className={cls("h-1", tone === "cyan" ? "bg-cyan" : "bg-amber")} style={{width: `${pct}%`}}/>
    </div>
  );
}

Object.assign(window, { cls, Corners, Card, Btn, Badge, Kbd, Toggle, Tabs, Pagination, Field, Bar });
