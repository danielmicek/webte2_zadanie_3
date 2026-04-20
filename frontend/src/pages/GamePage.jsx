import {Navigate, useOutletContext} from 'react-router-dom'
import GameCanvas from '../GameCanvas.jsx'
import MenuButton from '../components/MenuButton.jsx'
import Pill from '../components/Pill.jsx'
import ResultPanel from '../components/ResultPanel.jsx'

export default function GamePage() {
    const context = useOutletContext()
    const { snapshot, playerId, notice, shotEvent, sendMessage, handleDisconnect, isActivePlayer } = context

    if (!playerId) {
        return <Navigate to="/" replace />
    }

    if (!isActivePlayer) {
        return <Navigate to="/lobby" replace />
    }

    const players = snapshot?.lobby?.players ?? []
    const game = snapshot?.game
    const me = players.find((player) => player.playerId === playerId)
    const isLeader = Boolean(me?.isLeader)
    const isMyTurn = game?.turnPlayerId === playerId
    const hasMovingShot = Boolean(game?.currentShot)
    const shotsTaken = game?.shotsTaken?.[playerId] ?? 0
    const canShoot =
        game?.status === 'running' &&
        !game?.paused &&
        isMyTurn &&
        !hasMovingShot &&
        shotsTaken < (game?.shotsPerPlayer ?? 0)

    const restartVotes = game?.restartVotes ?? []
    const pausedBy = players.find((player) => player.playerId === game?.pausedByPlayerId)

    return (
        <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#163252_0%,#08111d_36%,#050816_100%)]">
            <div className="flex min-h-screen items-center justify-center px-3 pb-3">
                <div className="flex h-screen w-full items-center justify-center">
                    <GameCanvas
                        playerId={playerId}
                        isMyTurn={isMyTurn}
                        canShoot={canShoot}
                        game={game}
                        shotEvent={shotEvent}
                        onShoot={(vector) => sendMessage({ type: 'shoot', vector })}
                        onSettled={(shotId, stones) => sendMessage({ type: 'shot_settled', shotId, stones })}
                    />
                </div>
            </div>

            <div className="lg:absolute relative lg:left-4 lg:right-4 lg:top-4 z-20 my-5 lg:my-0 flex flex-col lg:flex-row items-center justify-between gap-4">
                <div className="lg:w-[30%] w-[300px] min-w- rounded-lg border border-slate-800 bg-slate-950/82 p-5 shadow-[0_24px_60px_rgba(0,0,0,0.38)] backdrop-blur">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Stav hry</p>
                            <h1 className="mt-2 text-2xl font-semibold text-slate-50">
                                {game?.status === 'finished' ? 'Hra skončila' : 'Curling duel'}
                            </h1>
                        </div>
                        <Pill tone={game?.paused ? 'warning' : game?.status === 'finished' ? 'accent' : 'success'}>
                            {game?.paused ? 'pauza' : game?.status === 'finished' ? 'výsledok' : 'beží'}
                        </Pill>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Ťah</p>
                            <p className="mt-2 text-lg font-semibold text-slate-50">
                                {isMyTurn ? 'Tvoj ťah' : players.find((player) => player.playerId === game?.turnPlayerId)?.nickname ?? 'Čaká sa'}
                            </p>
                        </div>
                        <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Počet kameňov</p>
                            <p className="mt-2 text-lg font-semibold text-slate-50">
                                {shotsTaken}/{game?.shotsPerPlayer ?? 0}
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300">
                        {notice}
                    </div>

                    {game?.paused ? (
                        <div className="mt-4 rounded-lg border border-orange-400/20 bg-orange-400/10 p-4 text-sm text-orange-50">
                            {pausedBy ? `Hru pozastavil ${pausedBy.nickname}.` : 'Hra je pozastavená.'}
                        </div>
                    ) : null}
                </div>

                <div className="lg:w-[30%] w-[300px] rounded-lg border border-slate-800 bg-slate-950/82 p-5 shadow-[0_24px_60px_rgba(0,0,0,0.38)] backdrop-blur">
                    <p className="text-xs uppercase tracking-[0.28em] mb-3 text-slate-400">Možnosti hry</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <MenuButton type="button" variant="secondary" onClick={() => sendMessage({ type: 'toggle_pause' })} disabled={game?.status !== 'running'}>
                            {game?.paused ? 'Zrušiť pauzu' : 'Pauza'}
                        </MenuButton>
                        <MenuButton type="button" variant="secondary" onClick={() => sendMessage({ type: 'request_restart' })}>
                            {restartVotes.includes(playerId) ? 'Reštart navrhnutý' : 'Navrhnúť reštart'}
                        </MenuButton>
                        <MenuButton type="button" variant="danger" onClick={() => sendMessage({ type: 'end_game' })} disabled={!isLeader}>
                            Ukončiť hru
                        </MenuButton>
                        <MenuButton type="button" variant="secondary" onClick={handleDisconnect}>
                            Ukončiť spojenie
                        </MenuButton>
                    </div>

                    <div className="mt-4 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Reštart</p>
                        <p className="mt-2 text-sm text-slate-300">
                            Navrhnutý: {restartVotes.length}/{game?.activePlayerIds?.length ?? 0}
                        </p>
                    </div>

                    <div className="mt-4">
                        <ResultPanel result={game?.result} players={players} />
                    </div>
                </div>
            </div>
        </div>
    )
}
