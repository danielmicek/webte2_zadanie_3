export default function RulesPanel() {
    return (
        <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-5 text-sm leading-6 text-slate-300">
            <p>Hra je pre dvoch aktívnych hráčov. Leader je prvý pripojený hráč a iba on môže spustiť alebo ukončiť hru.</p>
            <p className="mt-2">Hádzanie prebieha striedavo. Ďalší ťah je povolený až po úplnom zastavení všetkých kameňov.</p>
            <p className="mt-2">Kameň sa odpaľuje mechanikou praku z vyznačenej štartovacej pozície. Smer aj sila sa zobrazia šípkou.</p>
            <p className="mt-2">Po odohraní všetkých kameňov vyhráva hráč, ktorého kameň je najbližšie k cieľu.</p>
            <p className="mt-2">Hru je možné pozastaviť, po vzájomnom súhlase reštartovať a pri odpojení niektorého hráča sa korektne ukončí.</p>
        </div>
    )
}
