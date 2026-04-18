import {useOutletContext} from 'react-router-dom'
import Card from '../components/Card.jsx'
import MenuButton from '../components/MenuButton.jsx'
import RulesPanel from '../components/RulesPanel.jsx'

export default function HomePage() {
    const { nicknameInput, setNicknameInput, handleConnect, connecting, notice, showRules, setShowRules } =
        useOutletContext()
    const trimmed = nicknameInput.trim()

    return (
        <div className="flex min-h-screen w-full items-center justify-center px-5">
            <Card className="relative w-full max-w-3xl overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-40" />
                <div className="relative">
                    <p className="text-xs font-semibold uppercase tracking-[0.4em] text-lime-200/70">Curling</p>
                    <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-50">
                        Pripoj sa a čakaj na štart od lobby-leadera
                    </h1>

                    <div className="mt-6 rounded-[24px] border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300">
                        {notice}
                    </div>

                    <form
                        onSubmit={(event) => {
                            event.preventDefault()
                            handleConnect()
                        }}
                        className="mt-6 space-y-4"
                    >
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-300">Meno hráča</label>
                            <input
                                value={nicknameInput}
                                onChange={(event) => setNicknameInput(event.target.value)}
                                placeholder="napr. Player1"
                                maxLength={24}
                                className="w-full rounded-[20px] border border-slate-700 bg-slate-950/80 px-4 py-3 text-slate-50 outline-none transition focus:border-lime-300"
                            />
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                            <MenuButton type="submit" className="w-full" disabled={!trimmed || connecting}>
                                {connecting ? 'Pripájanie...' : 'Pripojiť'}
                            </MenuButton>
                            <MenuButton type="button" variant="secondary" onClick={() => setShowRules((value) => !value)} className="w-full">
                                {showRules ? 'Skryť pravidlá' : 'Zobraziť pravidlá'}
                            </MenuButton>
                        </div>
                    </form>

                    {showRules ? <div className="mt-6"><RulesPanel /></div> : null}
                </div>
            </Card>
        </div>
    )
}
