// Pages: API documentation (06), Manual (07)

const ENDPOINTS = [
  { m:"POST", p:"/api/cas/execute",                   d:{ sk:"Vykonať Octave kód", en:"Execute Octave code" } },
  { m:"POST", p:"/api/simulations/inverted-pendulum", d:{ sk:"Spustiť kyvadlo",    en:"Run pendulum sim" } },
  { m:"POST", p:"/api/simulations/ball-beam",         d:{ sk:"Spustiť guličku",    en:"Run ball-on-beam sim" } },
  { m:"GET",  p:"/api/logs",                          d:{ sk:"Zoznam logov",       en:"List logs" } },
  { m:"GET",  p:"/api/logs/export.csv",               d:{ sk:"Export CSV",         en:"Export CSV" } },
  { m:"GET",  p:"/api/statistics",                    d:{ sk:"Súhrnné štatistiky", en:"Aggregate statistics" } },
  { m:"GET",  p:"/api/statistics/inverted-pendulum",  d:{ sk:"Stats kyvadla",      en:"Pendulum stats" } },
  { m:"GET",  p:"/api/statistics/ball-beam",          d:{ sk:"Stats guličky",      en:"Ball-beam stats" } },
  { m:"GET",  p:"/api/openapi.json",                  d:{ sk:"OpenAPI 3.1",        en:"OpenAPI 3.1" } },
  { m:"GET",  p:"/api/docs/pdf",                      d:{ sk:"Generované PDF",     en:"Generated PDF" } },
  { m:"GET",  p:"/api/health",                        d:{ sk:"Health-check",       en:"Health-check" } },
];

function PageApi({ tt, lang }) {
  const [sel, setSel] = React.useState(1);
  const ep = ENDPOINTS[sel];
  return (
    <div className="pg-enter">
      <div className="flex items-end justify-between mb-6 gap-6 flex-wrap">
        <div>
          <div className="tracker">{tt.nav[6].hint} · OPENAPI 3.1</div>
          <h2 className="font-serif text-[56px] leading-none mt-2">{tt.nav[6].label}<span className="text-amber wonk">.</span></h2>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="bone">11 ENDPOINTS</Badge>
          <Badge tone="cyan">v1.0.0</Badge>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <Card className="col-span-12 lg:col-span-4" label="ENDPOINTS" corner="11" padded={false}>
          <ul>
            {ENDPOINTS.map((e,i) => {
              const a = i === sel;
              return (
                <li key={i}>
                  <button onClick={()=>setSel(i)}
                    className={cls("w-full text-left grid grid-cols-[58px_1fr] items-center gap-3 px-4 py-3 border-b border-line/60 last:border-0",
                      a ? "bg-pane2" : "hover:bg-pane2/60")}>
                    <Badge tone={e.m==="POST"?"solidA":"solidC"}>{e.m}</Badge>
                    <div>
                      <div className="font-mono text-[12.5px] text-bone truncate">{e.p}</div>
                      <div className="tracker mt-0.5">{e.d[lang]}</div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card className="col-span-12 lg:col-span-8" label="DETAIL" corner={`${ep.m} · ${ep.p}`} padded={false}>
          <div className="px-5 py-4 border-b border-line flex items-center gap-3">
            <Badge tone={ep.m==="POST"?"solidA":"solidC"}>{ep.m}</Badge>
            <span className="font-mono text-[16px] text-bone">{ep.p}</span>
          </div>
          <div className="px-5 py-4 border-b border-line">
            <h4 className="font-serif text-[22px] leading-tight">{ep.d[lang]}</h4>
            <p className="mt-1 text-bone2/80 text-[13px] max-w-[68ch]">
              {lang==="sk"
                ? "Volaním tohto endpointu spustíte numerickú simuláciu v sandboxe. Workspace ostáva pre token medzi volaniami, takže pokračovanie z koncových stavov je triviálne."
                : "Calling this endpoint runs the numerical simulation inside the sandbox. The workspace persists per token across calls, so continuing from final states is trivial."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="p-5 border-r border-line">
              <div className="flex items-center justify-between mb-2">
                <span className="tracker">{tt.request}</span>
                <Badge tone="amber">JSON</Badge>
              </div>
              <pre className="font-mono text-[12px] leading-relaxed text-bone2 whitespace-pre-wrap">
{`{
  "r": 0.20,
  "t_end": 10,
  "dt": 0.05,
  "x0": [0, 0, 0, 0],
  "params": {
    "M": 0.5, "m": 0.2,
    "b": 0.1, "I": 0.006,
    "l": 0.3
  }
}`}
              </pre>
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="tracker">{tt.response} · 200</span>
                <Badge tone="cyan">200 OK</Badge>
              </div>
              <pre className="font-mono text-[12px] leading-relaxed text-bone2 whitespace-pre-wrap">
{`{
  "time":   [0.00, 0.05, 0.10, …],
  "outputs": {
    "position": [0.000, 0.018, 0.041, …],
    "angle":    [0.000, 0.012, 0.027, …]
  },
  "x_last": [0.20, 0.00, 0.00, 0.00],
  "delay_ms": 300
}`}
              </pre>
            </div>
          </div>

          <div className="border-t border-line px-5 py-3 flex items-center justify-between">
            <span className="tracker flex items-center gap-2"><I.Lock size={12}/> {tt.apiKeyReq}</span>
            <div className="flex items-center gap-2">
              <Btn variant="ghost" icon={<I.ArrowUR size={12}/>}>{tt.tryIt}</Btn>
              <Btn variant="primary" icon={<I.Download size={14}/>}>{tt.dlPdf} · {fmt(tt.pageOf,{a:1,b:8})}</Btn>
            </div>
          </div>
        </Card>
      </div>

      {/* PDF preview */}
      <div className="mt-10">
        <div className="flex items-end justify-between mb-3">
          <h3 className="font-serif text-[28px]">PDF · <span className="italic text-amber wonk">8 pages</span></h3>
          <span className="tracker">{lang==="sk"?"živý náhľad generovaného dokumentu":"live preview of generated doc"}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1,2,3].map(n => (
            <div key={n} className="relative aspect-[3/4] bg-bone text-ink p-6 shadow-[0_30px_60px_-20px_rgba(0,0,0,.7)] border border-line2">
              <Corners color="rgba(14,16,20,.20)"/>
              <div className="flex items-center justify-between text-[9.5px] tracking-[.20em] uppercase font-mono text-ink/70">
                <span>WEBTE² · API DOCUMENTATION</span>
                <span>v1.0.0</span>
              </div>
              <div className="mt-5">
                <div className="font-mono text-[10px] uppercase tracking-[.20em] text-ink/60">Section · 0{n}</div>
                <h5 className="font-serif text-[22px] leading-tight mt-1">
                  {n===1 && (lang==="sk"?"Úvod & autentifikácia":"Introduction & auth")}
                  {n===2 && "POST /api/cas/execute"}
                  {n===3 && "POST /api/simulations/…"}
                </h5>
              </div>
              <div className="mt-3 space-y-1.5">
                {Array.from({length:11}).map((_,i)=>(
                  <div key={i} className="h-[3px] bg-ink/15" style={{ width: `${65 + ((i*23)%32)}%` }}/>
                ))}
                <div className="h-2"/>
                <div className="font-mono text-[8px] text-ink/70 bg-ink/5 border border-ink/10 p-2 leading-snug">
                  POST /api/cas/execute<br/>X-API-Key: sk_live_…<br/>{`{ "code": "a = 1+1" }`}
                </div>
                {Array.from({length:6}).map((_,i)=>(
                  <div key={"l"+i} className="h-[3px] bg-ink/15" style={{ width: `${45 + ((i*31)%42)}%` }}/>
                ))}
              </div>
              <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between text-[9.5px] uppercase font-mono tracking-[.20em] text-ink/70">
                <span>FEI STU · BRATISLAVA</span>
                <span>{n}/8</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PageManual({ tt, lang }) {
  const chap = lang === "sk"
    ? ["Začíname","API kľúč & token","Manuálna konzola","Inverzné kyvadlo","Gulička na tyči","Logy & export","Štatistiky","Bezpečnosť & limity"]
    : ["Getting started","API key & token","Manual console","Inverted pendulum","Ball on beam","Logs & export","Statistics","Security & limits"];

  return (
    <div className="pg-enter">
      <div className="flex items-end justify-between mb-6 gap-6 flex-wrap">
        <div>
          <div className="tracker">{tt.nav[7].hint} · MANUAL</div>
          <h2 className="font-serif text-[56px] leading-none mt-2">{tt.nav[7].label}<span className="text-amber wonk">.</span></h2>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="bone">8 CHAPTERS</Badge>
          <Badge tone="cyan">PDF · 1/8</Badge>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        <aside className="col-span-12 lg:col-span-3">
          <div className="tracker mb-3">{tt.chap}</div>
          <ol className="space-y-1">
            {chap.map((c,i) => (
              <li key={i}>
                <button className={cls(
                  "w-full text-left grid grid-cols-[36px_1fr] items-center gap-2 py-2 px-2 border-l-2",
                  i===0 ? "border-amber bg-pane2" : "border-transparent hover:bg-pane2/60"
                )}>
                  <span className="font-mono text-[10.5px] text-mute2">{String(i).padStart(2,"0")}</span>
                  <span className={cls("text-[13px]", i===0 ? "text-bone" : "text-bone2")}>{c}</span>
                </button>
              </li>
            ))}
          </ol>
        </aside>

        <article className="col-span-12 lg:col-span-9">
          <div className="tracker text-amber">{tt.prologue}</div>
          <h1 className="mt-3 font-serif text-[64px] leading-[0.95] tracking-[-0.01em] max-w-[20ch]">
            <span className="wonk">{tt.bigQuote.split(",")[0]},</span>
            <br/>
            <span className="text-bone2">{tt.bigQuote.split(",")[1]?.trim()}</span>
          </h1>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-[1fr_220px] gap-8">
            <div className="prose prose-invert max-w-none text-bone2 text-[15px] leading-[1.7]" style={{ textWrap:"pretty" }}>
              <p>
                {lang==="sk"
                  ? "Toto je referenčná webová aplikácia pre predmet WEBTE² na FEI STU v Bratislave. Beží nad Octave 9.x v Docker sandboxe a vystavuje úzke, dobre definované REST API. V tomto dokumente sa naučíte, ako poslať Octave výraz, ako spustiť dve simulácie z teórie riadenia, a ako zúročiť perzistenciu workspace medzi volaniami."
                  : "This is the reference web application for the WEBTE² course at FEI STU Bratislava. It runs on top of Octave 9.x inside a Docker sandbox and exposes a narrow, well-defined REST API. In this document you will learn how to send an Octave expression, how to run two control-theory simulations, and how to take advantage of workspace persistence across calls."}
              </p>
              <p>
                {lang==="sk"
                  ? "Identita používateľa je anonymná — pri prvej návšteve dostávate 256-bitový token v cookie, ktorý slúži ako kľúč k vášmu workspace súboru .mat na serveri. Žiadne prihlasovanie, žiadne heslá, žiadne osobné údaje."
                  : "User identity is anonymous — on first visit you receive a 256-bit cookie token that doubles as the key to your workspace .mat file on the server. No login, no passwords, no personal data."}
              </p>
            </div>

            <div className="border-l border-line pl-6">
              <div className="tracker mb-2">{lang==="sk"?"Pred vámi":"Ahead of you"}</div>
              <ol className="space-y-3 font-mono text-[12px] text-bone2">
                <li><span className="text-amber">01</span> · {lang==="sk"?"~12 minút":"~12 min read"}</li>
                <li><span className="text-amber">02</span> · 8 {lang==="sk"?"kapitol":"chapters"}</li>
                <li><span className="text-amber">03</span> · {lang==="sk"?"24 príkladov":"24 examples"}</li>
                <li><span className="text-amber">04</span> · {lang==="sk"?"3 simulácie":"3 simulations"}</li>
              </ol>
            </div>
          </div>

          {/* 3 step grid */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            {tt.threeStep.map((s,i) => (
              <div key={i} className="border-l-2 border-amber pl-5 py-1">
                <div className="font-mono text-[10.5px] text-amber tracking-[.18em] uppercase">step · 0{i+1}</div>
                <h4 className="font-serif text-[26px] mt-1 leading-tight">{s}</h4>
                <p className="mt-2 text-bone2/80 text-[13.5px] leading-relaxed">{tt.threeStepD[i]}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex items-center gap-3">
            <Btn variant="primary" icon={<I.Download size={14}/>}>{tt.download} · {fmt(tt.pageOf,{a:1,b:8})}</Btn>
            <Btn variant="ghost" icon={<I.Book size={14}/>}>{tt.apiDocs}</Btn>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card label="EXAMPLE · CURL" corner="cas/execute">
              <pre className="font-mono text-[12px] text-bone2 leading-relaxed whitespace-pre-wrap">
{`curl -X POST https://webte2.fei.stuba.sk/api/cas/execute \\
  -H "X-API-Key: $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"code":"a=1+1\\nb=a+2"}'`}
              </pre>
            </Card>
            <Card label="LIMITS · 04" corner="hard">
              <ul className="space-y-2 text-[13px]">
                <li className="flex justify-between border-b border-line/60 pb-1.5"><span className="tracker">timeout</span><span className="font-mono">5.0 s</span></li>
                <li className="flex justify-between border-b border-line/60 pb-1.5"><span className="tracker">max input</span><span className="font-mono">10 000 ch</span></li>
                <li className="flex justify-between border-b border-line/60 pb-1.5"><span className="tracker">rate</span><span className="font-mono">60 / token / 60 s</span></li>
                <li className="flex justify-between"><span className="tracker">dedup window</span><span className="font-mono">10 min</span></li>
              </ul>
            </Card>
          </div>
        </article>
      </div>
    </div>
  );
}

Object.assign(window, { PageApi, PageManual });
