import {Navigate, useOutletContext} from 'react-router-dom'
import Card from '../components/Card.jsx'
import MenuButton from '../components/MenuButton.jsx'
import PlayerList from '../components/PlayerList.jsx'
import RulesPanel from '../components/RulesPanel.jsx'

const WS_STATE = {
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
}

export default function LobbyPage() {
    const context = useOutletContext()
    const { snapshot, playerId, nickname, socketState, notice, showRules, setShowRules, handleDisconnect, sendMessage } = context

    if (!playerId) {
        return <Navigate to="/" replace />
    }

    const players = snapshot?.lobby?.players ?? []
    const leaderId = snapshot?.lobby?.leaderId
    const me = players.find((player) => player.playerId === playerId)
    const connectedPlayers = snapshot?.lobby?.connectedPlayers ?? 0
    const canStart = me?.isLeader && connectedPlayers === 2 && snapshot?.game?.status === 'lobby'

    return (
        <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col items-center justify-center gap-4 md:flex-row">
            <Card className="relative w-full max-w-4xl overflow-hidden">
                <div className="relative">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-sky-200/70">Waiting Lobby</p>
                            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-50">
                                {snapshot?.game?.status === 'lobby' ? 'Čaká sa na štart hry' : 'Prebieha iná hra'}
                            </h1>
                        </div>
                    </div>

                    <div className="mt-8 flex gap-4">
                        <div className="rounded-[24px] border border-slate-800 bg-slate-900/70 p-4">
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Pripojení hráči</p>
                            <p className="mt-3 text-4xl font-semibold text-slate-50">{connectedPlayers}</p>
                        </div>

                        <div className="rounded-[24px] border border-slate-800 bg-slate-900/70 p-4">
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Tvoja rola</p>
                            <p className="mt-3 text-xl font-semibold text-slate-50">
                                {playerId === leaderId ? 'Leader' : 'Player'}
                            </p>
                            <p className="mt-2 text-xs text-slate-400">{nickname}</p>
                        </div>
                    </div>

                    <div className="mt-6 rounded-[24px] border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300">
                        {notice}
                    </div>

                    {connectedPlayers > 2 ? (
                        <div className="mt-6 rounded-[24px] border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300">
                            Na hru sú potrební dvaja hráči, momentálne nie je možné začať hru.
                        </div>
                    ) : null}

                    <div className="mt-6 grid gap-3 md:grid-cols-2">
                        <MenuButton type="button" onClick={() => sendMessage({ type: 'start_game' })} disabled={!canStart}>
                            Začať hru
                        </MenuButton>
                        <MenuButton type="button" variant="secondary" onClick={() => setShowRules((value) => !value)}>
                            {showRules ? 'Skryť pravidlá' : 'Zobraziť pravidlá'}
                        </MenuButton>
                        <MenuButton type="button" variant="secondary" onClick={handleDisconnect}>
                            Ukončiť spojenie
                        </MenuButton>
                    </div>

                    {showRules ? <div className="mt-6"><RulesPanel /></div> : null}
                </div>
            </Card>

            <Card className="w-full">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Pripojení hráči</p>
                        <h2 className="mt-2 text-2xl font-semibold text-slate-50">Lobby</h2>
                    </div>
                </div>
                <div className="mt-5">
                    <PlayerList players={players} playerId={playerId} />
                </div>
            </Card>
        </div>
    )
}
