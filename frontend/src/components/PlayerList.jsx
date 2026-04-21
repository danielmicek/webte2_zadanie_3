import Pill from './Pill.jsx'

export default function PlayerList({ players, playerId, gameStatus }) {
    const playerStatus = gameStatus === 'running' || gameStatus === 'finished'
        ? 'Hrá v hre'
        : 'Čaká v lobby'

    return (
        <div className="grid gap-3">
            {players.map((player) => (
                <div key={player.playerId} className="rounded-lg border border-slate-800 bg-slate-950/70 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-lg font-semibold text-slate-50">
                                {player.nickname}
                                {player.playerId === playerId ? ' (ty)' : ''}
                            </p>
                            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                                {playerStatus}
                            </p>
                        </div>
                        <div className="flex flex-wrap">
                            {player.isLeader ? <Pill tone="accent">Leader</Pill> : null}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
