// Pages: Home, Console, Logs, Statistics

function PageHome({ tt, lang, goto }) {
  const pend = React.useMemo(() => pendResponse(120, 10), []);
  const ball = React.useMemo(() => ballResponse(120, 5), []);
  return (
    <div className="pg-enter space-y-10">
      {/* hero */}
      <section className="grid grid-cols-12 gap-6 items-end">
        <div className="col-span-12 lg:col-span-8">
          <div className="tracker mb-4">{tt.appKicker}</div>
          <h1 className="font-serif text-[88px] leading-[0.92] tracking-[-0.02em] num">
            <span className="wonk text-amber">Control</span>
            <span className="text-bone"> systems,</span>
            <br/>
            <span className="text-bone">on the </span>
            <span className="wonk text-cyan">web.</span>
          </h1>
          <p className="mt-6 max-w-[52ch] text-bone2/80 text-[15px] leading-relaxed">
            { lang === "sk"
              ? "Webový front-end k matematickému prostrediu Octave. Píšete kód, dostávate výstup. Spúšťate dve klasické simulácie z teórie riadenia a vidíte, ako sa systémy správajú v reálnom čase."
              : "A web front-end to the Octave numerical environment. Write code, get output. Run two classic control-theory simulations and watch the systems respond in real time." }
          </p>
        </div>
        <div className="col-span-12 lg:col-span-4">
          <Card label="CAS · 60 MIN" corner="STATE: STREAM">
            <div className="flex items-baseline justify-between">
              <div className="font-serif num text-[112px] leading-none text-bone wonk">1,284</div>
              <div className="text-right">
                <Badge tone="amber">+18%</Badge>
                <div className="tracker mt-2">{tt.casCalls}</div>
              </div>
            </div>
            <div className="mt-4">
              <MiniTrace data={pend} color="#ffb547" key1="pos" height={56}/>
            </div>
          </Card>
        </div>
      </section>

      {/* KPI 4-grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { l: tt.cartPend,   v: "428", d: "+9%",  k: "amber" },
          { l: tt.ballBeam,   v: "317", d: "+22%", k: "cyan" },
          { l: tt.csvLogs,    v: "9 124", d: "rows", k: "bone" },
          { l: tt.uniqTokens, v: "612", d: "of 800", k: "bone" },
        ].map((x, i) => (
          <Card key={i} label={`KPI · 0${i+1}`}>
            <div className="font-serif num text-[64px] leading-none text-bone">{x.v}</div>
            <div className="mt-3 flex items-center justify-between">
              <span className="tracker">{x.l}</span>
              <Badge tone={x.k}>{x.d}</Badge>
            </div>
          </Card>
        ))}
      </section>

      {/* Two preview cards */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card label="EXPERIMENT · 02" corner="t = 0:0.05:10" glow="amber" padded={false}>
          <div className="p-5 pb-0 flex items-center justify-between">
            <div>
              <div className="tracker text-amber">{tt.live}</div>
              <h3 className="font-serif text-[34px] leading-tight mt-1">{tt.nav[2].label}</h3>
            </div>
            <Btn variant="primary" icon={<I.Right size={14}/>} onClick={() => goto("pend")}>{tt.run}</Btn>
          </div>
          <div className="mt-4 border-t border-line">
            <PendulumViz posMeters={0.36} angleRad={0.05} height={220}/>
          </div>
          <div className="border-t border-line">
            <MiniTrace data={pend} color="#ffb547" key1="pos" height={70}/>
          </div>
          <div className="px-5 py-3 border-t border-line flex items-center justify-between font-mono text-[10px] text-mute2 uppercase tracking-[.14em]">
            <span>K = lqr(A,B,C′C,1)</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-amber pulse-amber"/>STREAM 60 fps</span>
          </div>
        </Card>

        <Card label="EXPERIMENT · 03" corner="t = 0:0.01:5" glow="cyan" padded={false}>
          <div className="p-5 pb-0 flex items-center justify-between">
            <div>
              <div className="tracker text-cyan">{tt.live}</div>
              <h3 className="font-serif text-[34px] leading-tight mt-1">{tt.nav[3].label}</h3>
            </div>
            <Btn variant="cyan" icon={<I.Right size={14}/>} onClick={() => goto("ball")}>{tt.run}</Btn>
          </div>
          <div className="mt-4 border-t border-line">
            <BallBeamViz y={0.4} alphaRad={2.4e-4} height={220}/>
          </div>
          <div className="border-t border-line">
            <MiniTrace data={ball} color="#5eead4" key1="y" height={70}/>
          </div>
          <div className="px-5 py-3 border-t border-line flex items-center justify-between font-mono text-[10px] text-mute2 uppercase tracking-[.14em]">
            <span>K = place(A,B,[−2±2i,−20,−80])</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-cyan pulse-cyan"/>STREAM 100 fps</span>
          </div>
        </Card>
      </section>

      {/* feature row */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { ic: <I.Terminal size={18}/>, k: "console" },
          { ic: <I.Scroll   size={18}/>, k: "logs" },
          { ic: <I.Bar      size={18}/>, k: "stats" },
          { ic: <I.Book     size={18}/>, k: "pdf" },
        ].map((f, i) => {
          const F = tt.features[f.k];
          return (
            <Card key={i} label={`${tt.feature} · 0${i+1}`}>
              <div className="flex items-start gap-3">
                <span className="grid place-items-center w-9 h-9 border border-line2 text-bone">{f.ic}</span>
                <div>
                  <h4 className="font-serif text-[22px] leading-tight">{F.t}</h4>
                  <p className="mt-1 text-mute2 text-[12.5px] leading-relaxed">{F.d}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </section>
    </div>
  );
}

// ---------- CAS Console ----------
function PageConsole({ tt, lang }) {
  const [tab, setTab] = React.useState("session.m");
  const [code, setCode] = React.useState(`% session.m — persistent Octave workspace
% nech a = 1+1, potom a + 2  → 4
a = 1 + 1
b = a + 2

% open-loop pole placement, ball+beam (excerpt)
m = 0.111; R = 0.015; g = -9.8; J = 9.99e-6;
H = -m*g/(J/(R^2)+m);
A = [0 1 0 0; 0 0 H 0; 0 0 0 1; 0 0 0 0];
B = [0;0;0;1];
K = place(A,B,[-2+2i,-2-2i,-20,-80]);

disp(K)
`);
  const lines = code.split("\n");
  const highlight = (line) => {
    if (/^\s*%/.test(line)) return <span className="tok-cm">{line}</span>;
    const out = [];
    let rest = line;
    const re = /(\b(?:function|end|return|if|else|for|while|disp|plot|lsim|place|lqr|inv|ss|ones|size)\b)|(-?\d+\.?\d*(?:[eE][-+]?\d+)?)|('[^']*')|([A-Za-z_][A-Za-z0-9_]*)/g;
    let m, last = 0, key=0;
    while ((m = re.exec(line)) !== null) {
      if (m.index > last) out.push(<span key={key++}>{line.slice(last, m.index)}</span>);
      if (m[1]) out.push(<span key={key++} className="tok-kw">{m[1]}</span>);
      else if (m[2]) out.push(<span key={key++} className="tok-num">{m[2]}</span>);
      else if (m[3]) out.push(<span key={key++} className="tok-str">{m[3]}</span>);
      else if (m[4]) out.push(<span key={key++} className="tok-fn">{m[4]}</span>);
      last = m.index + m[0].length;
    }
    if (last < line.length) out.push(<span key={key++}>{line.slice(last)}</span>);
    return out;
  };
  return (
    <div className="pg-enter">
      <div className="flex items-end justify-between mb-6 gap-6">
        <div>
          <div className="tracker">EXPERIMENT · 01 / CAS</div>
          <h2 className="font-serif text-[56px] leading-none mt-2">{tt.nav[1].label}<span className="text-amber wonk">.</span></h2>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="bone">OCTAVE 9.2.0</Badge>
          <Badge tone="cyan">SANDBOX</Badge>
          <Badge tone="amber">5s · 10000 ch</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* editor */}
        <Card className="lg:col-span-3" padded={false} label="EDITOR" corner="WORKSPACE 7f3e..a912.mat">
          <Tabs value={tab} onChange={setTab} items={[
            { value:"session.m",  label:"session.m"  },
            { value:"scratch.m",  label:"scratch.m"  },
            { value:"util.m",     label:"util.m"     },
          ]}/>
          <div className="grid grid-cols-[44px_1fr] font-mono text-[12.5px] leading-[1.55]">
            <div className="bg-pane2 text-mute py-3 text-right select-none">
              {lines.map((_,i) => <div key={i} className="px-2">{String(i+1).padStart(2,"0")}</div>)}
            </div>
            <pre className="py-3 px-3 whitespace-pre-wrap text-bone">
              {lines.map((l, i) => <div key={i}>{highlight(l)}</div>)}
              <div><span className="cursor"/></div>
            </pre>
          </div>
          <div className="border-t border-line px-3 py-2 flex items-center justify-between font-mono text-[10.5px] text-mute2 uppercase tracking-[.14em]">
            <span>{tt.persist} · 7f3e..a912.mat</span>
            <div className="flex items-center gap-2">
              <Btn variant="ghost" size="sm" icon={<I.Reset size={12}/>}>{tt.reset}</Btn>
              <Btn variant="primary" size="sm" icon={<I.Right size={12}/>}>{tt.run} ⏎</Btn>
            </div>
          </div>
        </Card>

        {/* output / terminal */}
        <Card className="lg:col-span-2 relative scanlines" padded={false} label="OUTPUT" corner="200 OK · 24 ms" glow="amber">
          <div className="font-mono text-[12.5px] p-4 space-y-1.5">
            <div className="flex justify-between text-mute2 text-[10px] uppercase tracking-[.14em] mb-2">
              <span>tty/octave</span><span>POST /api/cas/execute</span>
            </div>
            <div><span className="text-amber">a = 1 + 1</span></div>
            <div className="text-bone2">a = <span className="text-cyan">2</span></div>
            <div className="h-2"/>
            <div><span className="text-amber">b = a + 2</span></div>
            <div className="text-bone2">b = <span className="text-cyan">4</span></div>
            <div className="h-2"/>
            <div className="text-mute">% workspace persists between calls →</div>
            <div className="text-bone2">a + b = <span className="text-cyan">6</span></div>
            <div className="h-2"/>
            <div><span className="text-amber">disp(K)</span></div>
            <div className="text-bone2">K =</div>
            <div className="text-cyan ml-3">  -71.5944  -38.4250  152.7820   31.6228</div>
            <div className="h-2"/>
            <div className="text-mute2 flex items-center gap-2">
              <span className="text-cyan">&gt;</span><span className="cursor"/>
            </div>
          </div>
          <div className="border-t border-line px-3 py-2 flex items-center justify-between font-mono text-[10.5px] uppercase tracking-[.14em]">
            <span className="text-mute2">elapsed</span>
            <div className="flex items-center gap-2">
              <Badge tone="cyan">200</Badge>
              <span className="text-bone2">24 ms</span>
              <span className="text-mute2">·</span>
              <span className="text-mute2">432 b</span>
            </div>
          </div>
        </Card>
      </div>

      {/* rules + request */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <Card label="RULES · 04">
          <h4 className="font-serif text-[20px] mb-3">{tt.rules}</h4>
          <ul className="space-y-2.5 text-[12.5px]">
            {[
              ["timeout", "5 s"],
              ["max_input", "10 000 char"],
              ["sandbox", "Docker · network: none"],
              ["fs_writes", "denied (RO root)"],
              ["banned", "system(), unix(), popen()"],
              ["persist", "/sessions/{token}.mat"],
            ].map(([k,v],i) => (
              <li key={i} className="flex justify-between border-b border-line/60 pb-1.5">
                <span className="tracker">{k}</span>
                <span className="font-mono text-bone">{v}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="lg:col-span-2" label="REQUEST · CURL" corner="X-API-Key required">
          <pre className="font-mono text-[12.5px] leading-relaxed text-bone2 whitespace-pre-wrap">
{`POST /api/cas/execute HTTP/1.1
Host: webte2.fei.stuba.sk
`}<span className="text-amber">{`X-API-Key`}</span>{`: `}<span className="text-cyan">{`sk_live_4f3a…d901`}</span>{`
Content-Type: application/json

{
  "code": "a = 1 + 1\\nb = a + 2\\ndisp(K)",
  "session": "7f3e…a912"
}`}
          </pre>
          <div className="mt-3 flex items-center justify-between">
            <Badge tone="amber">POST</Badge>
            <Btn variant="ghost" size="sm" icon={<I.ArrowUR size={12}/>}>{tt.tryIt}</Btn>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ---------- Logs ----------
function PageLogs({ tt, lang }) {
  const [filter, setFilter] = React.useState("ALL");
  const [page, setPage] = React.useState(1);
  const rows = [
    ["13:42:08.214","manual","K = lqr(A,B,C'*C,1)","200","K = [-1.0  -1.6  18.7  3.9]","31"],
    ["13:42:01.061","inverted_pendulum","lsim(sys, r*ones, t, x0)","200","y(:,1) → 0.20 m, y(:,2) → 0.00 rad","412"],
    ["13:41:48.902","ball_beam","place(A,B,[-2+2i,-2-2i,-20,-80])","200","K = [3 555.6  1 944.4  -722.2  -36.1]","78"],
    ["13:41:30.117","manual","system('rm -rf /')","ERR","permission denied · sandbox policy","8"],
    ["13:41:12.840","ball_beam","lsim(N*sys, 0.25*ones, t, [0;0;0;0])","200","y(:,1) → 0.250 m","402"],
    ["13:40:59.231","inverted_pendulum","disp(K)","200","K = [-1.0000  -1.6567  18.6854  3.9433]","12"],
    ["13:40:41.005","manual","syms x; integrate(sin(x), x, 0, pi)","200","ans = 2","59"],
    ["13:40:25.118","ball_beam","H = -m*g/(J/(R^2)+m)","200","H = 6.997","6"],
    ["13:40:09.872","manual","[V,D] = eig(A)","200","D = diag(0,0,0,0)","41"],
    ["13:39:55.301","inverted_pendulum","r=0.5; lsim(sys, …, x_last)","200","y settled at 0.50 m, θ → 0","415"],
    ["13:39:38.244","manual","while true; end","ERR","timeout · 5.0 s exceeded","5000"],
  ];
  const sourceTone = { manual: "bone", inverted_pendulum: "amber", ball_beam: "cyan" };
  const filtered = rows.filter(r => filter === "ALL" || r[1].toUpperCase().replace("_PENDULUM","_PEND.") === filter);

  return (
    <div className="pg-enter">
      <div className="flex items-end justify-between mb-6 gap-6 flex-wrap">
        <div>
          <div className="tracker">{tt.nav[4].hint} · LOG STREAM</div>
          <h2 className="font-serif text-[56px] leading-none mt-2">{tt.nav[4].label}<span className="text-amber wonk">.</span></h2>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <I.Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-mute2"/>
            <input className="h-9 w-72 bg-pane border border-line2 pl-8 pr-12 font-mono text-[12px] text-bone placeholder:text-mute2 outline-none focus:border-bone"
                   placeholder={lang==="sk"?"hľadať v príkazoch…":"search commands…"}/>
            <span className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1"><Kbd>⌘</Kbd><Kbd>K</Kbd></span>
          </div>
          <Toggle value={filter} onChange={setFilter} items={[
            {value:"ALL",label:"ALL"},
            {value:"MANUAL",label:"MANUAL"},
            {value:"INVERTED_PEND.",label:"INVERTED_PEND."},
            {value:"BALL_BEAM",label:"BALL_BEAM"},
          ]}/>
          <Btn variant="primary" icon={<I.Download size={14}/>}>{lang==="sk"?"Export CSV":"Export CSV"}</Btn>
        </div>
      </div>

      <Card padded={false} label="DATA · /api/logs" corner={`ROWS ${filtered.length} of 9 124`}>
        <div className="overflow-x-auto">
          <table className="w-full font-mono text-[12px]">
            <thead className="text-mute2 uppercase tracking-[.14em] text-[10.5px]">
              <tr className="[&>th]:py-2.5 [&>th]:px-3 [&>th]:text-left [&>th]:font-normal border-b border-line">
                <th>TIME</th><th>SOURCE</th><th>COMMAND</th><th className="!text-right">STATUS</th><th>OUTPUT</th><th className="!text-right">MS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
                const ok = r[3] === "200";
                return (
                  <tr key={i} className="[&>td]:py-2.5 [&>td]:px-3 border-b border-line/60 hover:bg-pane2/60">
                    <td className="text-mute2 whitespace-nowrap">{r[0]}</td>
                    <td><Badge tone={sourceTone[r[1]] || "bone"}>{r[1].replace("_"," ").replace("inverted","inv.")}</Badge></td>
                    <td className="text-bone whitespace-nowrap max-w-[420px] overflow-hidden text-ellipsis">{r[2]}</td>
                    <td className="text-right"><Badge tone={ok?"solidC":"rose"}>{r[3]}</Badge></td>
                    <td className={ok ? "text-bone2" : "text-rose"}>{r[4]}</td>
                    <td className="text-right text-bone2">{r[5]}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="border-t border-line px-3 py-3 flex items-center justify-between">
          <span className="tracker">SAMPLED · 60s window</span>
          <Pagination page={page} total={156} onPage={setPage}/>
        </div>
      </Card>
    </div>
  );
}

// ---------- Statistics ----------
function PageStats({ tt, lang }) {
  const days = tt.days;
  const dataA = [38, 52, 41, 64, 78, 33, 22];
  const dataB = [22, 31, 28, 49, 51, 18, 14];
  const max = Math.max(...dataA, ...dataB);
  const cities = [
    ["Bratislava","SK", 142, 100],
    ["Košice","SK", 86, 60],
    ["Praha","CZ", 71, 50],
    ["Brno","CZ", 44, 31],
    ["Wien","AT", 38, 27],
    ["Berlin","DE", 14, 10],
  ];
  return (
    <div className="pg-enter">
      <div className="flex items-end justify-between mb-6 gap-6 flex-wrap">
        <div>
          <div className="tracker">{tt.nav[5].hint} · METRICS</div>
          <h2 className="font-serif text-[56px] leading-none mt-2">{tt.nav[5].label}<span className="text-amber wonk">.</span></h2>
        </div>
        <div className="flex items-center gap-2">
          <Toggle value="30D" onChange={()=>{}} items={[{value:"24H",label:"24H"},{value:"7D",label:"7D"},{value:"30D",label:"30D"}]}/>
        </div>
      </div>

      {/* 3 KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { l: tt.cartPend,   v: "428", k: "amber" },
          { l: tt.ballBeam,   v: "317", k: "cyan" },
          { l: tt.uniqTokens, v: "612", k: "bone" },
        ].map((x,i) => (
          <Card key={i} label={`KPI · 0${i+1}`} corner={i<2?"30 D":"AGE"}>
            <div className={cls("font-serif num leading-none wonk text-[112px]", x.k==="amber" && "text-amber", x.k==="cyan" && "text-cyan", x.k==="bone" && "text-bone")}>{x.v}</div>
            <div className="mt-4 tracker">{x.l}</div>
          </Card>
        ))}
      </div>

      {/* weekly bar chart + geo */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3" label="USAGE · 7D" corner={tt.weekly}>
          <div className="grid grid-cols-7 gap-3 h-[220px] items-end">
            {days.map((d,i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="flex items-end gap-1 h-[180px]">
                  <div className="w-5 bg-amber/15 border-t border-amber" style={{height:`${(dataA[i]/max)*100}%`, boxShadow:"0 0 10px #ffb54744"}}>
                    <div className="w-full bg-amber" style={{height:"100%", opacity:.85}}/>
                  </div>
                  <div className="w-5 bg-cyan/15 border-t border-cyan" style={{height:`${(dataB[i]/max)*100}%`, boxShadow:"0 0 10px #5eead444"}}>
                    <div className="w-full bg-cyan" style={{height:"100%", opacity:.85}}/>
                  </div>
                </div>
                <span className="tracker">{d}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-5 font-mono text-[10.5px] text-mute2 uppercase tracking-[.14em]">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-amber"/>{tt.cartPend}</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-cyan"/>{tt.ballBeam}</span>
          </div>
        </Card>

        <Card className="lg:col-span-2" label="GEO · TOP" corner={tt.geoTop}>
          <ul className="space-y-3.5">
            {cities.map((c,i) => (
              <li key={i}>
                <div className="flex items-center justify-between font-mono text-[12px]">
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-amber"/>
                    <span className="text-bone">{c[0]}</span>
                    <span className="text-mute2">{c[1]}</span>
                  </span>
                  <span className="text-bone2">{c[2]}</span>
                </div>
                <div className="mt-1.5"><Bar pct={c[3]} tone={i%2?"cyan":"amber"}/></div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* table */}
      <Card padded={false} className="mt-8" label="DETAIL · /api/statistics" corner={tt.deduplicateNote}>
        <div className="overflow-x-auto">
          <table className="w-full font-mono text-[12px]">
            <thead className="text-mute2 uppercase tracking-[.14em] text-[10.5px]">
              <tr className="[&>th]:py-2.5 [&>th]:px-3 [&>th]:text-left [&>th]:font-normal border-b border-line">
                <th>TIME</th><th>ANIMATION</th><th>TOKEN</th><th>CITY</th><th>COUNTRY</th><th className="!text-right">COUNTED</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["13:42:01","inverted_pendulum","sk_4f3a..d901","Bratislava","SK","yes"],
                ["13:41:48","ball_beam","sk_4f3a..d901","Bratislava","SK","<10m"],
                ["13:41:12","ball_beam","sk_8c11..71ab","Praha","CZ","yes"],
                ["13:40:59","inverted_pendulum","sk_2d77..ee04","Berlin","DE","yes"],
                ["13:40:25","ball_beam","sk_8c11..71ab","Praha","CZ","<10m"],
                ["13:39:55","inverted_pendulum","sk_a900..f0c2","Wien","AT","yes"],
                ["13:39:38","inverted_pendulum","sk_a900..f0c2","Wien","AT","<10m"],
              ].map((r,i) => {
                const yes = r[5] === "yes";
                const tone = r[1] === "ball_beam" ? "cyan" : "amber";
                return (
                  <tr key={i} className="[&>td]:py-2.5 [&>td]:px-3 border-b border-line/60 hover:bg-pane2/60">
                    <td className="text-mute2">{r[0]}</td>
                    <td><Badge tone={tone}>{r[1]}</Badge></td>
                    <td className="text-bone2">{r[2]}</td>
                    <td className="text-bone">{r[3]}</td>
                    <td className="text-mute2">{r[4]}</td>
                    <td className="text-right"><Badge tone={yes?"solidC":"mute"}>{yes?tt.yesCounted:tt.notCounted}</Badge></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

Object.assign(window, { PageHome, PageConsole, PageLogs, PageStats });
