// Pages: Inverted Pendulum (02), Ball on Beam (03)

function ParamRow({ sym, name, val, unit, tone="bone" }) {
  return (
    <div className="flex items-baseline justify-between py-2 border-b border-line/60 last:border-0">
      <div className="flex items-baseline gap-3">
        <span className={cls("font-serif text-[20px] leading-none", tone==="amber"&&"text-amber", tone==="cyan"&&"text-cyan")}>{sym}</span>
        <span className="tracker">{name}</span>
      </div>
      <span className="font-mono text-[12.5px] text-bone">{val}<span className="text-mute2 ml-1">{unit}</span></span>
    </div>
  );
}

function GainBox({ k, label="K", tone="amber" }) {
  return (
    <div className="border border-line2 bg-pane2/40 p-4">
      <div className="flex items-center justify-between">
        <span className="tracker">{label}</span>
        <Badge tone={tone}>1×4</Badge>
      </div>
      <pre className={cls("mt-2 font-mono text-[12.5px] leading-relaxed", tone==="amber"?"text-amber":"text-cyan")}>
{`[ ${k.map(v => v.toString().padStart(8)).join("  ")} ]`}
      </pre>
    </div>
  );
}

function PagePendulum({ tt, lang }) {
  const data = React.useMemo(() => pendResponse(220, 10), []);
  const [r, setR] = React.useState(0.20);
  const [running, setRunning] = React.useState(true);
  const t = useTick(60, running);
  const totalT = 10;
  const cursorT = (t * 1.0) % totalT;
  const idx = Math.max(0, Math.min(data.length-1, Math.floor((cursorT/totalT)*(data.length-1))));
  const cur = data[idx] || data[0] || { pos: 0, ang: 0, t: 0 };

  return (
    <div className="pg-enter">
      <div className="flex items-end justify-between mb-6 gap-6 flex-wrap">
        <div>
          <div className="tracker">{tt.nav[2].hint} · STATE-SPACE · LQR</div>
          <h2 className="font-serif text-[56px] leading-none mt-2">{tt.nav[2].label}<span className="text-amber wonk">.</span></h2>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="amber">CART · POLE</Badge>
          <Badge tone="bone">A−BK · STABLE</Badge>
          <Badge tone="cyan">{running?"STREAM":"PAUSED"}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* params */}
        <Card className="col-span-12 lg:col-span-3" label="PARAMS · 02" corner="MODEL">
          <h4 className="font-serif text-[20px] mb-2">{tt.parameters}</h4>
          <ParamRow sym="M" name={lang==="sk"?"hmotnosť vozíka":"cart mass"}    val="0.500" unit="kg"/>
          <ParamRow sym="m" name={lang==="sk"?"hmotnosť kyvadla":"pendulum mass"} val="0.200" unit="kg" tone="amber"/>
          <ParamRow sym="b" name={lang==="sk"?"trenie":"friction"}              val="0.100" unit="N·s/m"/>
          <ParamRow sym="I" name={lang==="sk"?"moment zotrv.":"inertia"}        val="0.006" unit="kg·m²"/>
          <ParamRow sym="ℓ" name={lang==="sk"?"polovica dĺžky":"half-length"}   val="0.300" unit="m" tone="amber"/>
          <ParamRow sym="g" name="gravity"                                       val="9.80"  unit="m/s²"/>
          <div className="mt-4 pt-3 border-t border-line">
            <div className="tracker mb-2">DERIVED</div>
            <div className="font-mono text-[12px] text-bone2">p = I(M+m) + Mmℓ²</div>
            <div className="font-mono text-[12px] text-bone2">  = <span className="text-amber">0.0249</span></div>
          </div>
        </Card>

        {/* animation panel */}
        <Card className="col-span-12 lg:col-span-9 relative scanlines" padded={false}
              label="STAGE · 21:10" corner={`t = ${cursorT.toFixed(2)}s · idx ${idx}`} glow="amber">
          <PendulumViz posMeters={cur.pos} angleRad={cur.ang} height={340}/>
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <Btn variant="ghost" size="sm" icon={running ? <I.Pause size={12}/> : <I.Play size={12}/>} onClick={()=>setRunning(r=>!r)}>
              {running?(lang==="sk"?"Pauza":"Pause"):(lang==="sk"?"Hrať":"Play")}
            </Btn>
            <Btn variant="ghost" size="sm" icon={<I.Reset size={12}/>}>{tt.reset}</Btn>
          </div>
          <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between font-mono text-[10.5px] text-mute2 uppercase tracking-[.14em]">
            <span>x ∈ [−0.10, 0.70] m · θ visual ×1.0</span>
            <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-amber pulse-amber"/>STREAM 60 fps</span>
          </div>
        </Card>

        {/* setpoint + gain */}
        <Card className="col-span-12 lg:col-span-7" label="SETPOINT · r" corner="0–0.5 m">
          <div className="flex items-end justify-between gap-6">
            <div>
              <div className="tracker mb-1">{tt.setpoint}</div>
              <div className="font-serif num text-[96px] leading-none wonk text-amber">
                r = {r.toFixed(2)}<span className="text-mute2 text-[36px]"> m</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Btn variant="primary" icon={<I.Right size={14}/>}>{tt.run} · r=0.2</Btn>
              <Btn variant="ghost" icon={<I.Plus size={14}/>}>{tt.cont} · r=0.5</Btn>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-[auto_1fr_auto] items-center gap-3">
            <span className="tracker">0.00</span>
            <input type="range" className="rng w-full" min="0" max="0.5" step="0.01" value={r} onChange={(e)=>setR(parseFloat(e.target.value))}/>
            <span className="tracker">0.50</span>
          </div>
          <div className="mt-3 flex items-center justify-between font-mono text-[10.5px] uppercase tracking-[.14em] text-mute2">
            <span>step · zero-order hold</span>
            <span>x₀ from previous run</span>
          </div>
        </Card>

        <Card className="col-span-12 lg:col-span-5" label="LQR · K = lqr(A,B,C′C,1)" corner="GAIN">
          <h4 className="font-serif text-[20px] mb-2">{tt.gain}</h4>
          <GainBox k={[-1.0000,-1.6567,18.6854,3.9433]} label="K (1×4)" tone="amber"/>
          <div className="mt-3 grid grid-cols-2 gap-3 font-mono text-[12px]">
            <div className="border border-line2 p-3">
              <div className="tracker mb-1">eig(A−BK)</div>
              <div className="text-bone">−4.97</div>
              <div className="text-bone">−1.34</div>
              <div className="text-amber">−0.61 ± 1.21i</div>
            </div>
            <div className="border border-line2 p-3">
              <div className="tracker mb-1">N̂</div>
              <div className="text-cyan text-[14px] mt-1">−1.0000</div>
              <div className="tracker mt-3 mb-1">solver</div>
              <div className="text-bone">lsim · ZOH</div>
            </div>
          </div>
        </Card>

        {/* trace chart */}
        <Card className="col-span-12 relative" label="TRACE · 24:7" corner={`cursor t = ${cursorT.toFixed(2)} s`} padded={false} glow="amber">
          <div className="px-5 pt-4 pb-2 flex items-end justify-between">
            <div>
              <h4 className="font-serif text-[24px]">{tt.trace}</h4>
              <div className="tracker">y(:,1) = {tt.position} · y(:,2) = {tt.angle}</div>
            </div>
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span className="text-mute2">x =</span>
              <span className="text-amber tabular-nums">{cur.pos.toFixed(3)} m</span>
              <span className="text-mute2 ml-3">θ =</span>
              <span className="text-cyan tabular-nums">{(cur.ang*180/Math.PI).toFixed(2)}°</span>
            </div>
          </div>
          <div className="px-3 pb-2">
            <TraceChart
              data={data}
              accessors={[
                { key:"pos", color:"#ffb547", label:"x · m" },
                { key:"ang", color:"#5eead4", label:"θ · rad", scale:1 },
              ]}
              totalT={10}
              cursorT={cursorT}
              yLabel="state · y(t)"
              height={260}
            />
          </div>
          <div className="border-t border-line px-5 py-2 flex items-center justify-between font-mono text-[10.5px] text-mute2 uppercase tracking-[.14em]">
            <span>sample dt = 0.05 s · n = 201</span>
            <span>shared index · animation ↔ chart</span>
          </div>
        </Card>
      </div>
    </div>
  );
}

function PageBall({ tt, lang }) {
  const data = React.useMemo(() => ballResponse(220, 5), []);
  const [r, setR] = React.useState(0.25);
  const [running, setRunning] = React.useState(true);
  const t = useTick(60, running);
  const totalT = 5;
  const cursorT = (t * 1.0) % totalT;
  const idx = Math.max(0, Math.min(data.length-1, Math.floor((cursorT/totalT)*(data.length-1))));
  const cur = data[idx] || data[0] || { y: 0, a: 0, t: 0 };

  return (
    <div className="pg-enter">
      <div className="flex items-end justify-between mb-6 gap-6 flex-wrap">
        <div>
          <div className="tracker">{tt.nav[3].hint} · POLE PLACEMENT</div>
          <h2 className="font-serif text-[56px] leading-none mt-2">{tt.nav[3].label}<span className="text-cyan wonk">.</span></h2>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="cyan">BALL · BEAM</Badge>
          <Badge tone="bone">A−BK · CRITICAL</Badge>
          <Badge tone="amber">{running?"STREAM":"PAUSED"}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <Card className="col-span-12 lg:col-span-3" label="PARAMS · 03" corner="MODEL">
          <h4 className="font-serif text-[20px] mb-2">{tt.parameters}</h4>
          <ParamRow sym="m" name={lang==="sk"?"hmotnosť guličky":"ball mass"}     val="0.111"     unit="kg" tone="cyan"/>
          <ParamRow sym="R" name={lang==="sk"?"polomer guličky":"ball radius"}    val="0.015"     unit="m" tone="cyan"/>
          <ParamRow sym="g" name="gravity"                                         val="−9.80"     unit="m/s²"/>
          <ParamRow sym="J" name={lang==="sk"?"moment zotrv.":"ball inertia"}     val="9.99e−6"   unit="kg·m²"/>
          <ParamRow sym="L" name={lang==="sk"?"dĺžka tyče":"beam length"}         val="1.00"      unit="m"/>
          <div className="mt-4 pt-3 border-t border-line">
            <div className="tracker mb-2">DERIVED</div>
            <div className="font-mono text-[12px] text-bone2">H = −mg / (J/R² + m)</div>
            <div className="font-mono text-[12px] text-bone2">  = <span className="text-cyan">6.997</span></div>
          </div>
        </Card>

        <Card className="col-span-12 lg:col-span-9 relative scanlines" padded={false}
              label="STAGE · BEAM" corner={`t = ${cursorT.toFixed(2)}s · idx ${idx}`} glow="cyan">
          <BallBeamViz y={cur.y} alphaRad={cur.a} height={340}/>
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <Btn variant="ghost" size="sm" icon={running ? <I.Pause size={12}/> : <I.Play size={12}/>} onClick={()=>setRunning(r=>!r)}>
              {running?(lang==="sk"?"Pauza":"Pause"):(lang==="sk"?"Hrať":"Play")}
            </Btn>
            <Btn variant="ghost" size="sm" icon={<I.Reset size={12}/>}>{tt.reset}</Btn>
          </div>
          <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between font-mono text-[10.5px] text-mute2 uppercase tracking-[.14em]">
            <span>y ∈ [0, 1.0] m · α visual ×4000</span>
            <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-cyan pulse-cyan"/>STREAM 100 fps</span>
          </div>
        </Card>

        <Card className="col-span-12 lg:col-span-7" label="SETPOINT · r" corner="0–0.8 m">
          <div className="flex items-end justify-between gap-6">
            <div>
              <div className="tracker mb-1">{tt.setpoint}</div>
              <div className="font-serif num text-[96px] leading-none wonk text-cyan">
                r = {r.toFixed(2)}<span className="text-mute2 text-[36px]"> m</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Btn variant="cyan" icon={<I.Right size={14}/>}>{tt.run} · r=0.25</Btn>
              <Btn variant="ghost" icon={<I.Plus size={14}/>}>{tt.cont} · r=0.5</Btn>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-[auto_1fr_auto] items-center gap-3">
            <span className="tracker">0.00</span>
            <input type="range" className="rng rng-cyan w-full" min="0" max="0.8" step="0.01" value={r} onChange={(e)=>setR(parseFloat(e.target.value))}/>
            <span className="tracker">0.80</span>
          </div>
          <div className="mt-3 flex items-center justify-between font-mono text-[10.5px] uppercase tracking-[.14em] text-mute2">
            <span>step · ZOH · t=0:0.01:5</span>
            <span>x₀ ← x_last from previous run</span>
          </div>
        </Card>

        <Card className="col-span-12 lg:col-span-5" label="POLES · place(A,B,…)" corner="GAIN">
          <h4 className="font-serif text-[20px] mb-2">{tt.gain}</h4>
          <GainBox k={[3555.6, 1944.4, -722.2, -36.1]} label="K (1×4)" tone="cyan"/>
          <div className="mt-3 grid grid-cols-2 gap-3 font-mono text-[12px]">
            <div className="border border-line2 p-3">
              <div className="tracker mb-1">desired poles</div>
              <div className="text-cyan">−2 ± 2i</div>
              <div className="text-cyan">−20</div>
              <div className="text-cyan">−80</div>
            </div>
            <div className="border border-line2 p-3">
              <div className="tracker mb-1">N̂ = −(C(A−BK)⁻¹B)⁻¹</div>
              <div className="text-amber text-[14px] mt-1">−1.0000</div>
              <div className="tracker mt-3 mb-1">solver</div>
              <div className="text-bone">lsim · ZOH</div>
            </div>
          </div>
        </Card>

        {/* twin charts */}
        <Card className="col-span-12 lg:col-span-7 relative" label="TRACE · y(t)" corner={`cursor t = ${cursorT.toFixed(2)} s`} padded={false} glow="cyan">
          <div className="px-5 pt-4 pb-2 flex items-end justify-between">
            <div>
              <h4 className="font-serif text-[24px]">{tt.position} · y(t)</h4>
              <div className="tracker">m · ball position along beam</div>
            </div>
            <div className="font-mono text-[11px]"><span className="text-mute2">y = </span><span className="text-cyan tabular-nums">{cur.y.toFixed(3)} m</span></div>
          </div>
          <div className="px-3 pb-2">
            <TraceChart
              data={data}
              accessors={[{ key:"y", color:"#5eead4", label:"y · m" }]}
              totalT={5} cursorT={cursorT} yLabel="m" height={240}
            />
          </div>
        </Card>

        <Card className="col-span-12 lg:col-span-5 relative" label="TRACE · α(t)" corner="x(:,3)" padded={false}>
          <div className="px-5 pt-4 pb-2 flex items-end justify-between">
            <div>
              <h4 className="font-serif text-[24px]">{tt.angle} · α(t)</h4>
              <div className="tracker">rad · scale 1×10⁻⁴</div>
            </div>
            <div className="font-mono text-[11px]"><span className="text-mute2">α = </span><span className="text-amber tabular-nums">{cur.a.toExponential(2)} rad</span></div>
          </div>
          <div className="px-3 pb-2">
            <TraceChart
              data={data}
              accessors={[{ key:"a", color:"#ffb547", label:"α · rad" }]}
              totalT={5} cursorT={cursorT} yLabel="rad · 1e−4" height={240}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

Object.assign(window, { PagePendulum, PageBall });
