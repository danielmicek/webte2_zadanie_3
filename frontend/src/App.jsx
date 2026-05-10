import {createRoot} from 'react-dom/client'
import {useEffect, useState} from "react";

const NAV_ICONS = [I.Home, I.Terminal, I.Activity, I.CircleDot, I.Scroll, I.Bar, I.Book, I.File];

function Sidebar({ tt, lang, page, goto }) {
  return (
    <aside className="w-[260px] shrink-0 border-r border-line bg-pane/40 sticky top-0 h-screen flex flex-col">
      {/* logo */}
      <div className="px-5 pt-6 pb-5 border-b border-line">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 grid place-items-center bg-amber text-ink">
            <span className="font-serif wonk text-[20px] leading-none">W²</span>
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-cyan"/>
          </div>
          <div>
            <div className="font-serif text-[22px] leading-none">WEBTE<span className="text-amber wonk">²</span></div>
            <div className="tracker mt-1">CONTROL · CONSOLE</div>
          </div>
        </div>
      </div>

      {/* nav */}
      <nav className="flex-1 py-2">
        {tt.nav.map((n, i) => {
          const Icon = NAV_ICONS[i];
          const a = page === n.id;
          return (
            <button key={n.id} onClick={() => goto(n.id)}
              className={cls(
                "relative w-full grid grid-cols-[44px_1fr_auto] items-center gap-2 h-11 px-3 text-left",
                a ? "bg-pane2 text-bone" : "text-bone2/80 hover:text-bone hover:bg-pane2/50"
              )}>
              {a && <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] bg-amber"/>}
              <span className={cls("grid place-items-center w-9 h-9 border", a ? "border-amber/60 text-amber" : "border-line2 text-bone2")}>
                <Icon size={16}/>
              </span>
              <span className="text-[13.5px]">{n.label}</span>
              <span className={cls("font-mono text-[10.5px]", a ? "text-amber" : "text-mute")}>{n.hint}</span>
            </button>
          );
        })}
      </nav>

      {/* status */}
      <div className="px-4 py-4 border-t border-line space-y-2.5 font-mono text-[10.5px]">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-bone2"><span className="w-1.5 h-1.5 bg-cyan pulse-cyan"/>{tt.octaveOnline}</span>
          <span className="text-mute2">9.2.0</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-bone2"><span className="w-1.5 h-1.5 bg-amber pulse-amber"/>{tt.apiKeyOK}</span>
          <span className="text-mute2">200</span>
        </div>
        <div className="border-t border-line pt-2.5">
          <div className="flex justify-between"><span className="tracker">{tt.tokenLbl}</span><span className="text-bone2">sk_…d901</span></div>
          <div className="flex justify-between mt-1"><span className="tracker">{tt.sessionLbl}</span><span className="text-bone2">7f3e..a912</span></div>
        </div>
      </div>
    </aside>
  );
}

function Topbar({ tt, lang, setLang, page }) {
  const navItem = tt.nav.find(n => n.id === page) || tt.nav[0];
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const hh = String(now.getHours()).padStart(2,"0");
  const mm = String(now.getMinutes()).padStart(2,"0");
  const ss = String(now.getSeconds()).padStart(2,"0");

  return (
    <header className="sticky top-0 z-10 h-14 bg-ink/85 backdrop-blur border-b border-line">
      <div className="h-full px-6 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="font-mono text-[11.5px] text-mute2 uppercase tracking-[.14em] truncate">
            <span className="text-bone2">WEBTE²</span>
            <span className="mx-2 text-mute">/</span>
            <span className="text-amber">{navItem.hint}</span>
            <span className="mx-2 text-mute">/</span>
            <span className="text-bone">{navItem.label}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Toggle value={lang} onChange={setLang} items={[{value:"sk",label:"SK"},{value:"en",label:"EN"}]}/>
          <span className="hidden md:flex items-center gap-2 font-mono text-[11px] text-bone2">
            <Badge tone="solidC">200</Badge>
            <span className="text-mute2">·</span>
            <span className="tabular-nums">{hh}:{mm}<span className="text-mute2">:{ss}</span></span>
          </span>
          <span className="hidden lg:flex items-center gap-1.5 text-bone2">
            <I.Clock size={14} className="text-mute2"/>
            <span className="font-mono text-[11px]">UTC+02</span>
          </span>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-line mt-14">
      <div className="max-w-[1400px] mx-auto px-8 py-6 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          {[
            "PostgreSQL 16",
            "Octave 9.2",
            "Docker · sandbox",
            "Node 22 · Express",
            "OpenAPI 3.1",
          ].map(s => (
            <span key={s} className="inline-flex items-center h-7 px-2.5 border border-line2 font-mono text-[10.5px] text-bone2 uppercase tracking-[.14em]">{s}</span>
          ))}
        </div>
        <div className="font-mono text-[10.5px] text-mute2 uppercase tracking-[.14em] flex items-center gap-3">
          <span>FEI STU · Bratislava</span>
          <span className="text-mute">·</span>
          <span>WEBTE² / 2025</span>
          <span className="text-mute">·</span>
          <span className="text-bone2">build d901·main</span>
        </div>
      </div>
    </footer>
  );
}

function App() {
  const [lang, setLang] = useState("sk");
  const [page, setPage] = useState("home");
  const tt = T[lang];

  const PAGES = {
    home: PageHome,
    console: PageConsole,
    pend: PagePendulum,
    ball: PageBall,
    logs: PageLogs,
    stats: PageStats,
    api: PageApi,
    manual: PageManual,
  };
  const Page = PAGES[page] || PageHome;

  return (
    <div className="min-h-screen flex bg-ink">
      <Sidebar tt={tt} lang={lang} page={page} goto={setPage}/>
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar tt={tt} lang={lang} setLang={setLang} page={page}/>
        <main className="flex-1">
          <div className="max-w-[1400px] mx-auto px-8 py-10">
            <Page key={page+lang} tt={tt} lang={lang} goto={setPage}/>
          </div>
        </main>
        <Footer/>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App/>);
