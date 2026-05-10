// Inline SVG icons — line-art, monoline, 1.5px stroke. Lucide-style without the package.
const Ic = ({ d, size = 16, stroke = 1.5, className = "", children }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none"
       stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
       className={className}>
    {d ? <path d={d}/> : children}
  </svg>
);

const I = {
  Home:        (p) => <Ic {...p}><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/></Ic>,
  Terminal:    (p) => <Ic {...p}><path d="M4 17l5-5-5-5"/><path d="M11 19h9"/></Ic>,
  Activity:    (p) => <Ic {...p} d="M22 12h-4l-3 9-6-18-3 9H2"/>,
  CircleDot:   (p) => <Ic {...p}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.2" fill="currentColor"/></Ic>,
  Scroll:      (p) => <Ic {...p}><path d="M6 4h11a3 3 0 013 3v10a3 3 0 01-3 3H8"/><path d="M6 4a3 3 0 00-3 3v2h12"/><path d="M9 12h7M9 16h5"/></Ic>,
  Bar:         (p) => <Ic {...p}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></Ic>,
  Book:        (p) => <Ic {...p}><path d="M4 4h10a4 4 0 014 4v12H8a4 4 0 01-4-4V4z"/><path d="M4 16a4 4 0 014-4h10"/></Ic>,
  File:        (p) => <Ic {...p}><path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4"/><path d="M9 12h6M9 16h4"/></Ic>,
  Search:      (p) => <Ic {...p}><circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4-4"/></Ic>,
  Play:        (p) => <Ic {...p} d="M7 5l12 7-12 7z"/>,
  Pause:       (p) => <Ic {...p}><path d="M7 5v14M17 5v14"/></Ic>,
  Reset:       (p) => <Ic {...p}><path d="M3 12a9 9 0 109-9"/><path d="M3 4v5h5"/></Ic>,
  Right:       (p) => <Ic {...p} d="M9 6l6 6-6 6"/>,
  Left:        (p) => <Ic {...p} d="M15 6l-6 6 6 6"/>,
  Down:        (p) => <Ic {...p} d="M6 9l6 6 6-6"/>,
  Plus:        (p) => <Ic {...p}><path d="M12 5v14M5 12h14"/></Ic>,
  Dot:         (p) => <Ic {...p}><circle cx="12" cy="12" r="3" fill="currentColor"/></Ic>,
  Check:       (p) => <Ic {...p} d="M5 12l4 4L19 6"/>,
  X:           (p) => <Ic {...p}><path d="M6 6l12 12M18 6L6 18"/></Ic>,
  Lock:        (p) => <Ic {...p}><rect x="5" y="11" width="14" height="9" rx="1"/><path d="M8 11V8a4 4 0 018 0v3"/></Ic>,
  Globe:       (p) => <Ic {...p}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/></Ic>,
  Download:    (p) => <Ic {...p}><path d="M12 4v12M6 12l6 6 6-6"/><path d="M4 20h16"/></Ic>,
  Cpu:         (p) => <Ic {...p}><rect x="6" y="6" width="12" height="12" rx="1"/><rect x="9" y="9" width="6" height="6"/><path d="M3 9h3M3 15h3M18 9h3M18 15h3M9 3v3M15 3v3M9 18v3M15 18v3"/></Ic>,
  Wave:        (p) => <Ic {...p} d="M3 12c2 0 2-6 4-6s2 12 4 12 2-9 4-9 2 6 4 6 2-3 2-3"/>,
  Pin:         (p) => <Ic {...p}><circle cx="12" cy="10" r="3"/><path d="M12 13v8M5 10a7 7 0 1114 0c0 5-7 11-7 11S5 15 5 10z"/></Ic>,
  Clock:       (p) => <Ic {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></Ic>,
  ArrowUR:     (p) => <Ic {...p} d="M7 17L17 7M9 7h8v8"/>,
  Filter:      (p) => <Ic {...p} d="M3 5h18l-7 9v6l-4-2v-4z"/>,
  Bracket:     (p) => <Ic {...p}><path d="M9 4H5v16h4M15 4h4v16h-4"/></Ic>,
  Ruler:       (p) => <Ic {...p}><rect x="3" y="9" width="18" height="6"/><path d="M6 9v3M9 9v4M12 9v3M15 9v4M18 9v3"/></Ic>,
  Layers:      (p) => <Ic {...p}><path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/></Ic>,
};

window.I = I;
