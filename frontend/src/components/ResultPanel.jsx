export default function ResultPanel({ result, players }) {
    if (!result) {
        return null
    }

    if (result.type === 'disconnect') {
        return (
            <div className="rounded-[24px] border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-100">
                {result.message}
            </div>
        )
    }

    return (
        <div className="rounded-[24px] border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-50">
            <p className="font-semibold">{result.message}</p>
            <div className="mt-3 grid gap-2">
                {(result.stones ?? []).slice(0, 6).map((stone) => {
                    const owner = players.find((player) => player.playerId === stone.ownerPlayerId)
                    return (
                        <div key={stone.id} className="flex items-center justify-between gap-3 rounded-[16px] bg-black/10 px-3 py-2">
                            <span>{owner?.nickname ?? `Hráč ${stone.ownerPlayerId}`}</span>
                            <span>{stone.distance.toFixed(1)} px</span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
