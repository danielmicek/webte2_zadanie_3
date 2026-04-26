import {useEffect, useRef, useState} from 'react'
import {Outlet, useLocation, useNavigate} from 'react-router-dom'

const WS_STATE = {
    DISCONNECTED: 'disconnected',
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
}

export function AppLayout() {
    const navigate = useNavigate()
    const location = useLocation()
    const socketRef = useRef(null)
    const manualCloseRef = useRef(false)
    const [socketState, setSocketState] = useState(WS_STATE.DISCONNECTED)
    const [snapshot, setSnapshot] = useState(null)
    const [nicknameInput, setNicknameInput] = useState('')
    const [notice, setNotice] = useState('Zadaj meno a pripoj sa na WebSocket server.')
    const [showRules, setShowRules] = useState(false)
    const [session, setSession] = useState(null)
    const [shotStartedEvent, setShotStartedEvent] = useState(null)
    const [physicsSnapshotEvent, setPhysicsSnapshotEvent] = useState(null)
    const [shotFinishedEvent, setShotFinishedEvent] = useState(null)

    const playerId = session?.playerId ?? null
    const nickname = session?.nickname ?? ''

    function closeSocket() {
        if (socketRef.current) {
            socketRef.current.onopen = null
            socketRef.current.onmessage = null
            socketRef.current.onerror = null
            socketRef.current.onclose = null
            socketRef.current.close()
            socketRef.current = null
        }
    }

    function disconnectForUnload() {
        const socket = socketRef.current

        if (!socket || socket.readyState !== WebSocket.OPEN) {
            return
        }

        try {
            socket.send(JSON.stringify({ type: 'disconnect' }))
        } catch {
            return
        }
    }

    function connectSocket({ nicknameToJoin = '' } = {}) {
        manualCloseRef.current = false
        setSocketState(WS_STATE.CONNECTING)

        const socket = new WebSocket('wss://node71.webte.fei.stuba.sk/ws/')
        socketRef.current = socket

        socket.onopen = () => {
            setSocketState(WS_STATE.CONNECTED)

            if (nicknameToJoin) {
                socket.send(JSON.stringify({ type: 'join_lobby', nickname: nicknameToJoin }))
            }
        }

        socket.onmessage = (event) => {
            let message

            try {
                message = JSON.parse(event.data)
            } catch {
                const preview =
                    typeof event.data === 'string'
                        ? event.data.slice(0, 120)
                        : '[non-text websocket frame]'
                setNotice(`Server poslal nevalidnĂş odpoveÄŹ. Na WS porte pravdepodobne beĹľĂ­ inĂ˝ server. OdpoveÄŹ: ${preview}`)
                return
            }

            if (message.type === 'session_ready') {
                const nextSession = {
                    playerId: message.playerId,
                    nickname: message.nickname,
                }

                setSession(nextSession)
                setNicknameInput(message.nickname ?? '')
                setNotice(`PrihlĂˇsenĂ˝ hrĂˇÄŤ: ${message.nickname}.`)
                return
            }

            if (message.type === 'snapshot') {
                setSnapshot(message)
                return
            }

            if (message.type === 'shot_started') {
                setShotStartedEvent(message)
                return
            }

            if (message.type === 'physics_snapshot') {
                setPhysicsSnapshotEvent(message)
                return
            }

            if (message.type === 'shot_finished') {
                setShotFinishedEvent(message)
                return
            }

            if (message.type === 'notice') {
                setNotice(message.message)
                return
            }

            if (message.type === 'error') {
                setNotice(message.message ?? 'Server vrĂˇtil chybu.')
            }
        }

        socket.onerror = () => {
            setNotice('Spojenie so serverom zlyhalo.')
        }

        socket.onclose = () => {
            socketRef.current = null
            setSocketState(WS_STATE.DISCONNECTED)

            if (manualCloseRef.current) {
                manualCloseRef.current = false
                return
            }

            setSession(null)
            setSnapshot(null)
            setShotStartedEvent(null)
            setPhysicsSnapshotEvent(null)
            setShotFinishedEvent(null)
            setNotice('Spojenie bolo ukonÄŤenĂ©.')
        }
    }

    function sendMessage(payload) {
        if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
            setNotice('Socket momentĂˇlne nie je otvorenĂ˝.')
            return false
        }

        socketRef.current.send(JSON.stringify(payload))
        return true
    }

    function resetTransientEvents() {
        setShotStartedEvent(null)
        setPhysicsSnapshotEvent(null)
        setShotFinishedEvent(null)
    }

    function handleConnect() {
        const trimmed = nicknameInput.trim()
        if (!trimmed) {
            setNotice('Zadaj meno hrĂˇÄŤa.')
            return
        }

        if (socketRef.current) {
            closeSocket()
        }

        setSession(null)
        setSnapshot(null)
        resetTransientEvents()
        connectSocket({ nicknameToJoin: trimmed })
        setNotice('PripĂˇjanie na server...')
    }

    function handleDisconnect() {
        manualCloseRef.current = true
        sendMessage({ type: 'disconnect' })
        closeSocket()
        setSession(null)
        setSnapshot(null)
        resetTransientEvents()
        setNotice('Spojenie bolo ukonÄŤenĂ©.')
        navigate('/')
    }

    useEffect(() => {
        const handlePageHide = () => {
            disconnectForUnload()
        }

        window.addEventListener('pagehide', handlePageHide)

        return () => {
            manualCloseRef.current = true
            disconnectForUnload()
            closeSocket()
            window.removeEventListener('pagehide', handlePageHide)
        }
    }, [])

    useEffect(() => {
        if (!session?.playerId) {
            if (location.pathname !== '/') {
                navigate('/')
            }
            return
        }

        if (snapshot?.game?.status && snapshot.game.status !== 'lobby') {
            if (location.pathname !== '/game') {
                navigate('/game')
            }
            return
        }

        if (location.pathname !== '/lobby') {
            navigate('/lobby')
        }
    }, [session, snapshot, navigate, location.pathname])

    const pageContext = {
        snapshot,
        playerId,
        nickname,
        socketState,
        notice,
        showRules,
        setShowRules,
        nicknameInput,
        setNicknameInput,
        connecting: socketState === WS_STATE.CONNECTING,
        shotStartedEvent,
        physicsSnapshotEvent,
        shotFinishedEvent,
        handleConnect,
        handleDisconnect,
        sendMessage,
    }

    return <Outlet context={pageContext} />
}
