import Card from '../components/Card.jsx'

export default function ErrorNotFound() {
    return (
        <div className="mx-auto grid min-h-[70vh] max-w-4xl place-items-center px-4">
            <Card className="w-full max-w-xl text-center">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">404</p>
                <h1 className="mt-3 text-3xl font-semibold text-slate-50">Stránka neexistuje</h1>
            </Card>
        </div>
    )
}
