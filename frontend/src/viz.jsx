// Animation + chart helpers for both simulations
// We approximate step responses analytically (this is a UI mockup; real values would come from Octave).

// Step response: critically-damped with overshoot, settles to r over ~tau seconds.
// y(t) = r1 + (r2 - r1) * (1 - exp(-t/tau) * (cos(w t) + (1/(w*tau))*sin(w t)))
function pendResponse(N = 200, T = 10) {
  const arr = [];
  for (let i = 0; i < N; i++) {
    const t = (i / (N - 1)) * T;
    const r = t < 5 ? 0.2 : 0.5;
    const r0 = 0;
    const t0 = t < 5 ? t : t - 5;
    const r1 = t < 5 ? 0 : 0.2;
    const tau = 0.9;
    const w = 1.6;
    const env = Math.exp(-t0 / tau);
    const pos = r1 + (r - r1) * (1 - env * (Math.cos(w * t0) + (1/(w*tau)) * Math.sin(w * t0)));
    // angle: derivative-like decaying oscillation
    const ang = -0.06 * env * Math.sin(w * t0 + 0.5) * (r - r1) / 0.2;
    arr.push({ t, pos, ang });
  }
  return arr;
}
function ballResponse(N = 200, T = 5) {
  const arr = [];
  for (let i = 0; i < N; i++) {
    const t = (i / (N - 1)) * T;
    const r = t < 2.5 ? 0.25 : 0.5;
    const r1 = t < 2.5 ? 0 : 0.25;
    const t0 = t < 2.5 ? t : t - 2.5;
    const tau = 0.6;
    const w = 2.0;
    const env = Math.exp(-t0 / tau);
    const y = r1 + (r - r1) * (1 - env * (Math.cos(w * t0) + (1/(w*tau)) * Math.sin(w * t0)));
    const a = (r - r1) * 0.0001 * env * Math.cos(w * t0); // tiny rad
    arr.push({ t, y, a });
  }
  return arr;
}

function useTick(rate = 60, running = true) {
  const [t, setT] = React.useState(0);
  React.useEffect(() => {
    if (!running) return;
    let id;
    let last = performance.now();
    const loop = (now) => {
      setT(p => p + (now - last) / 1000);
      last = now;
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [running]);
  return t;
}

// ---- Trace chart with synced cursor ----
function TraceChart({ data, accessors, totalT, cursorT, height = 220, padding = { l: 44, r: 16, t: 16, b: 28 }, yLabel, ticks = 5 }) {
  // accessors: [{key, color, label, scale?}]
  const wRef = React.useRef(null);
  const [w, setW] = React.useState(800);
  React.useEffect(() => {
    if (!wRef.current) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(wRef.current);
    return () => ro.disconnect();
  }, []);
  const H = height;
  const W = w;
  const px = (t) => padding.l + (t / totalT) * (W - padding.l - padding.r);
  // y range across all series
  let ymin = Infinity, ymax = -Infinity;
  for (const s of accessors) {
    for (const d of data) { const v = d[s.key] * (s.scale || 1); if (v < ymin) ymin = v; if (v > ymax) ymax = v; }
  }
  if (ymin === ymax) { ymin -= 1; ymax += 1; }
  const pad = (ymax - ymin) * 0.15;
  ymin -= pad; ymax += pad;
  const py = (v) => padding.t + (1 - (v - ymin) / (ymax - ymin)) * (H - padding.t - padding.b);

  const xTicks = 6;
  return (
    <div ref={wRef} className="w-full">
      <svg width={W} height={H} className="block">
        {/* grid */}
        <g stroke="#252a32" strokeWidth="1">
          {Array.from({length: xTicks+1}).map((_,i) => {
            const x = padding.l + (i / xTicks) * (W - padding.l - padding.r);
            return <line key={"vx"+i} x1={x} x2={x} y1={padding.t} y2={H-padding.b} strokeDasharray="2 4" opacity=".7"/>;
          })}
          {Array.from({length: ticks}).map((_,i) => {
            const y = padding.t + (i / (ticks-1)) * (H - padding.t - padding.b);
            return <line key={"hy"+i} x1={padding.l} x2={W-padding.r} y1={y} y2={y} strokeDasharray="2 4" opacity=".7"/>;
          })}
        </g>
        {/* axes */}
        <g stroke="#3a414c" strokeWidth="1">
          <line x1={padding.l} x2={padding.l} y1={padding.t} y2={H-padding.b}/>
          <line x1={padding.l} x2={W-padding.r} y1={H-padding.b} y2={H-padding.b}/>
        </g>
        {/* y labels */}
        <g fontFamily="JetBrains Mono" fontSize="10" fill="#7d8593">
          {Array.from({length: ticks}).map((_,i) => {
            const v = ymax - (i / (ticks-1)) * (ymax - ymin);
            const y = padding.t + (i / (ticks-1)) * (H - padding.t - padding.b);
            return <text key={"yl"+i} x={padding.l - 6} y={y + 3} textAnchor="end">{v.toFixed(Math.abs(v) < 0.01 ? 5 : 2)}</text>;
          })}
          {Array.from({length: xTicks+1}).map((_,i) => {
            const t = (i/xTicks)*totalT;
            const x = padding.l + (i / xTicks) * (W - padding.l - padding.r);
            return <text key={"xl"+i} x={x} y={H-padding.b+14} textAnchor="middle">{t.toFixed(1)}</text>;
          })}
          <text x={padding.l} y={padding.t - 4} fill="#cfc9bd" fontSize="10">{yLabel}</text>
        </g>
        {/* series */}
        {accessors.map((s) => {
          const path = data.map((d, i) => {
            const x = px(d.t);
            const y = py(d[s.key] * (s.scale || 1));
            return `${i===0?'M':'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
          }).join(" ");
          return (
            <g key={s.key}>
              <path d={path} stroke={s.color} strokeWidth="1.5" fill="none" opacity=".95"
                    style={{ filter: `drop-shadow(0 0 4px ${s.color}88)` }}/>
            </g>
          );
        })}
        {/* cursor */}
        {cursorT != null && (
          <g>
            <line x1={px(cursorT)} x2={px(cursorT)} y1={padding.t} y2={H-padding.b} stroke="#f3efe6" strokeOpacity=".25" strokeDasharray="1 3"/>
            {accessors.map(s => {
              const di = Math.max(0, Math.min(data.length-1, Math.floor(cursorT/totalT * (data.length-1))));
              const d = data[di] || data[data.length-1] || { t: 0, [s.key]: 0 };
              return <circle key={s.key} cx={px(d.t)} cy={py(d[s.key]*(s.scale||1))} r="3" fill={s.color}/>;
            })}
          </g>
        )}
        {/* legend */}
        <g fontFamily="JetBrains Mono" fontSize="10">
          {accessors.map((s, i) => (
            <g key={s.key} transform={`translate(${W - padding.r - 220 + i*110}, ${padding.t + 4})`}>
              <line x1="0" x2="14" y1="6" y2="6" stroke={s.color} strokeWidth="2"/>
              <text x="20" y="9" fill={s.color}>{s.label}</text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}

// ---- Inverted Pendulum animation (cart + pole) ----
function PendulumViz({ posMeters = 0.2, angleRad = 0, height = 260 }) {
  // map x in meters to px; show range -0.1..0.7 m
  const wRef = React.useRef(null);
  const [w, setW] = React.useState(900);
  React.useEffect(() => {
    if (!wRef.current) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(wRef.current);
    return () => ro.disconnect();
  }, []);
  const H = height;
  const railY = H - 70;
  const x0 = -0.1, x1 = 0.7;
  const W = w;
  const cartW = 90, cartH = 50;
  const poleLen = 130;
  const px = (m) => 40 + ((m - x0) / (x1 - x0)) * (W - 80);
  const cx = px(posMeters);
  const tipX = cx + poleLen * Math.sin(angleRad);
  const tipY = railY - cartH/2 - poleLen * Math.cos(angleRad);

  // ticks every 0.05m
  const ticks = [];
  for (let m = 0; m <= 0.6 + 0.0001; m += 0.05) ticks.push(m);

  return (
    <div ref={wRef} className="relative w-full overflow-hidden grid-bg-fine" style={{height: H}}>
      <svg width={W} height={H} className="absolute inset-0">
        {/* horizon line */}
        <line x1="0" x2={W} y1={railY} y2={railY} stroke="#2f353e"/>
        {/* ticks */}
        {ticks.map((m, i) => (
          <g key={i}>
            <line x1={px(m)} x2={px(m)} y1={railY} y2={railY+8} stroke="#3a414c"/>
            <text x={px(m)} y={railY+22} textAnchor="middle" fontFamily="JetBrains Mono" fontSize="9" fill="#5b6371">{m.toFixed(2)}</text>
          </g>
        ))}
        {/* setpoint marker at posMeters target line is r-rendered externally */}
        {/* cart */}
        <g transform={`translate(${cx - cartW/2}, ${railY - cartH})`}>
          <rect x="0" y="0" width={cartW} height={cartH} fill="#0e1014" stroke="#cfc9bd" strokeWidth="1"/>
          <line x1="6" y1="6" x2={cartW-6} y2="6" stroke="#cfc9bd" strokeOpacity=".25"/>
          <line x1="6" y1={cartH-6} x2={cartW-6} y2={cartH-6} stroke="#cfc9bd" strokeOpacity=".25"/>
          <circle cx={cartW*0.25} cy={cartH+4} r="6" fill="#0e1014" stroke="#cfc9bd"/>
          <circle cx={cartW*0.75} cy={cartH+4} r="6" fill="#0e1014" stroke="#cfc9bd"/>
        </g>
        {/* pole */}
        <g style={{ filter: `drop-shadow(0 0 6px #ffb54799)` }}>
          <line x1={cx} y1={railY - cartH/2} x2={tipX} y2={tipY} stroke="#ffb547" strokeWidth="6" strokeLinecap="round"/>
          <circle cx={tipX} cy={tipY} r="10" fill="#ffb547"/>
          <circle cx={cx} cy={railY - cartH/2} r="3" fill="#cfc9bd"/>
        </g>
        {/* readout */}
        <g fontFamily="JetBrains Mono" fontSize="10" fill="#cfc9bd">
          <text x="16" y="22" fill="#7d8593">x = </text><text x="36" y="22" fill="#ffb547">{posMeters.toFixed(3)} m</text>
          <text x="16" y="38" fill="#7d8593">θ = </text><text x="36" y="38" fill="#ffb547">{(angleRad*180/Math.PI).toFixed(2)}°</text>
        </g>
      </svg>
    </div>
  );
}

// ---- Ball on Beam animation ----
function BallBeamViz({ y = 0.25, alphaRad = 0, height = 260 }) {
  const wRef = React.useRef(null);
  const [w, setW] = React.useState(900);
  React.useEffect(() => {
    if (!wRef.current) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(wRef.current);
    return () => ro.disconnect();
  }, []);
  const H = height;
  const W = w;
  const cx = W/2, cy = H/2 + 20;
  const beamLen = Math.min(W * 0.7, 720);
  const ang = alphaRad * 4000; // exaggerate (real is 1e-4 rad)
  const cos = Math.cos(ang), sin = Math.sin(ang);
  const x1 = cx - (beamLen/2)*cos, y1 = cy - (beamLen/2)*sin;
  const x2 = cx + (beamLen/2)*cos, y2 = cy + (beamLen/2)*sin;
  // ball at distance y from left end of beam (y meters along beam, beam length ~ 1m)
  const dist = (y - 0) / 1.0; // 0..1
  const bx = x1 + (x2 - x1) * Math.max(0, Math.min(1, dist));
  const by = y1 + (y2 - y1) * Math.max(0, Math.min(1, dist)) - 12;

  const ticks = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    ticks.push({ x: x1 + (x2-x1)*t, y: y1 + (y2-y1)*t, label: t.toFixed(1) });
  }
  return (
    <div ref={wRef} className="relative w-full overflow-hidden grid-bg-fine" style={{height: H}}>
      <svg width={W} height={H} className="absolute inset-0">
        {/* fulcrum */}
        <polygon points={`${cx-22},${cy+34} ${cx+22},${cy+34} ${cx},${cy+4}`} fill="#0e1014" stroke="#cfc9bd"/>
        <line x1={cx-32} x2={cx+32} y1={cy+34} y2={cy+34} stroke="#cfc9bd"/>
        <g stroke="#3a414c">
          {Array.from({length:6}).map((_,i)=>(
            <line key={i} x1={cx-22+i*9} x2={cx-30+i*9} y1={cy+44} y2={cy+52}/>
          ))}
        </g>
        {/* beam */}
        <g style={{ filter: `drop-shadow(0 0 6px #5eead488)` }}>
          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#5eead4" strokeWidth="4" strokeLinecap="round"/>
          {ticks.map((tk,i) => {
            const nx = -sin, ny = cos;
            return (
              <g key={i}>
                <line x1={tk.x} y1={tk.y} x2={tk.x + nx*6} y2={tk.y + ny*6} stroke="#5eead4" opacity=".7"/>
                {i % 2 === 0 && <text x={tk.x + nx*16} y={tk.y + ny*16} fontFamily="JetBrains Mono" fontSize="9" fill="#7d8593" textAnchor="middle">{tk.label}</text>}
              </g>
            );
          })}
        </g>
        {/* ball */}
        <circle cx={bx} cy={by} r="11" fill="#0e1014" stroke="#5eead4" strokeWidth="2"/>
        <circle cx={bx} cy={by} r="4" fill="#5eead4"/>
        {/* readout */}
        <g fontFamily="JetBrains Mono" fontSize="10" fill="#cfc9bd">
          <text x="16" y="22" fill="#7d8593">y = </text><text x="36" y="22" fill="#5eead4">{y.toFixed(3)} m</text>
          <text x="16" y="38" fill="#7d8593">α = </text><text x="36" y="38" fill="#5eead4">{alphaRad.toExponential(2)} rad</text>
        </g>
      </svg>
    </div>
  );
}

// Mini sparkline-style trace for dashboard preview cards
function MiniTrace({ data, color, scale = 1, key1 = "pos", height = 140 }) {
  const w = 600, H = height;
  const xs = data.length;
  let mn = Infinity, mx = -Infinity;
  data.forEach(d => { const v = d[key1]*scale; if (v < mn) mn = v; if (v > mx) mx = v; });
  if (mn === mx) { mn -= 1; mx += 1; }
  const pad = (mx - mn)*.15; mn -= pad; mx += pad;
  const path = data.map((d,i) => {
    const x = (i/(xs-1))*w;
    const y = (1 - (d[key1]*scale - mn)/(mx - mn)) * H;
    return `${i===0?'M':'L'}${x} ${y}`;
  }).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${H}`} preserveAspectRatio="none" className="w-full" style={{height: H}}>
      <path d={path} stroke={color} strokeWidth="1.5" fill="none" style={{ filter: `drop-shadow(0 0 4px ${color}99)` }}/>
    </svg>
  );
}

Object.assign(window, { pendResponse, ballResponse, useTick, TraceChart, PendulumViz, BallBeamViz, MiniTrace });
