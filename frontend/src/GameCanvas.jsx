import {useEffect, useRef, useState} from 'react'
import Matter from 'matter-js'
import {sanitizeGameConfig} from './gameConfig.js'

const VIEWPORT_PADDING = 20
const PLAYER_COLORS = ['#ef4444', '#2563eb']

function clampMagnitude(dx, dy, maxDistance) {
    const distance = Math.hypot(dx, dy)

    if (!distance || distance <= maxDistance) {
        return { dx, dy, distance }
    }

    const ratio = maxDistance / distance

    return {
        dx: dx * ratio,
        dy: dy * ratio,
        distance: maxDistance,
    }
}

function drawCircle(ctx, x, y, radius, fillStyle) {
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fillStyle = fillStyle
    ctx.fill()
}

function drawArrow(ctx, startX, startY, endX, endY) {
    const angle = Math.atan2(endY - startY, endX - startX)
    const headLength = 18

    ctx.beginPath()
    ctx.moveTo(startX, startY)
    ctx.lineTo(endX, endY)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(endX, endY)
    ctx.lineTo(
        endX - headLength * Math.cos(angle - Math.PI / 6),
        endY - headLength * Math.sin(angle - Math.PI / 6),
    )
    ctx.lineTo(
        endX - headLength * Math.cos(angle + Math.PI / 6),
        endY - headLength * Math.sin(angle + Math.PI / 6),
    )
    ctx.closePath()
    ctx.fill()
}

function normalizeVector(vector) {
    const x = Number(vector?.x)
    const y = Number(vector?.y)

    if (!Number.isFinite(x) || !Number.isFinite(y)) {
        return null
    }

    return { x, y }
}

export default function GameCanvas({
    playerId,
    isMyTurn,
    canShoot,
    game,
    shotEvent,
    onShoot,
    onSettled,
}) {
    const canvasRef = useRef(null)
    const animationFrameRef = useRef(null)
    const engineRef = useRef(null)
    const wallsRef = useRef([])
    const stoneBodiesRef = useRef(new Map())
    const aimingRef = useRef(null)
    const dimensionsRef = useRef({
        logicalWidth: 1,
        logicalHeight: 1,
        displayWidth: 1,
        displayHeight: 1,
        uniformScale: 1,
        pixelRatio: 1,
    })
    const gameRef = useRef(game)
    const reportedShotIdRef = useRef(null)
    const appliedShotIdsRef = useRef(new Set())
    const [config, setConfig] = useState(null)
    const [loadError, setLoadError] = useState('')

    gameRef.current = game

    useEffect(() => {
        try {
            setConfig(sanitizeGameConfig())
            setLoadError('')
        } catch (error) {
            console.error(error)
            setLoadError('Nepodarilo sa načítať konfiguráciu hry.')
        }
    }, [])

    useEffect(() => {
        if (!config || !game?.gameId) {
            return
        }

        const { Engine, Bodies, Composite } = Matter
        const engine = Engine.create({
            gravity: { x: 0, y: 0 },
            enableSleeping: false,
        })

        engine.positionIterations = 10
        engine.velocityIterations = 8
        engine.constraintIterations = 2
        engineRef.current = engine
        stoneBodiesRef.current = new Map()
        wallsRef.current = []
        reportedShotIdRef.current = null
        appliedShotIdsRef.current = new Set()

        const wallThickness = 90
        const { width, height } = config.board
        const wallOptions = {
            isStatic: true,
            restitution: config.wallRestitution,
            friction: 0,
            frictionStatic: 0,
            slop: 0,
            render: { visible: false },
        }

        const walls = [
            Bodies.rectangle(width / 2, -wallThickness / 2, width + wallThickness * 2, wallThickness, wallOptions),
            Bodies.rectangle(width / 2, height + wallThickness / 2, width + wallThickness * 2, wallThickness, wallOptions),
            Bodies.rectangle(-wallThickness / 2, height / 2, wallThickness, height + wallThickness * 2, wallOptions),
            Bodies.rectangle(width + wallThickness / 2, height / 2, wallThickness, height + wallThickness * 2, wallOptions),
        ]

        Composite.add(engine.world, walls)
        wallsRef.current = walls

        return () => {
            Matter.World.clear(engine.world, false)
            Matter.Engine.clear(engine)
            engineRef.current = null
            stoneBodiesRef.current = new Map()
        }
    }, [config, game?.gameId, playerId])

    useEffect(() => {
        if (!config || !engineRef.current) {
            return
        }

        const resizeCanvas = () => {
            const logicalWidth = config.board.width
            const logicalHeight = config.board.height
            const availableWidth = Math.max(window.innerWidth - VIEWPORT_PADDING * 2, 220)
            const availableHeight = Math.max(window.innerHeight - VIEWPORT_PADDING * 2, 360)
            const uniformScale = Math.min(availableWidth / logicalWidth, availableHeight / logicalHeight)
            const displayWidth = logicalWidth * uniformScale
            const displayHeight = logicalHeight * uniformScale
            const pixelRatio = window.devicePixelRatio || 1
            const canvas = canvasRef.current

            dimensionsRef.current = {
                logicalWidth,
                logicalHeight,
                displayWidth,
                displayHeight,
                uniformScale,
                pixelRatio,
            }

            canvas.width = Math.round(displayWidth * pixelRatio)
            canvas.height = Math.round(displayHeight * pixelRatio)
            canvas.style.width = `${displayWidth}px`
            canvas.style.height = `${displayHeight}px`

            drawScene()
        }

        let lastTime = 0
        let settledFrames = 0

        const animate = (timestamp) => {
            if (!engineRef.current) {
                return
            }

            const delta = Math.min((timestamp - lastTime) / 1000 || 0.016, 0.05)
            lastTime = timestamp

            const movingShot = Boolean(gameRef.current?.currentShot)
            if (!gameRef.current?.paused && gameRef.current?.status === 'running') {
                Matter.Engine.update(engineRef.current, delta * 1000)
                settleStoppedBodies(config)
            }

            const hasBodies = stoneBodiesRef.current.size > 0
            const allStill = hasBodies && [...stoneBodiesRef.current.values()].every((body) => body.speed <= config.settleSpeed)

            if (movingShot && allStill) {
                settledFrames += 1
            } else {
                settledFrames = 0
            }

            if (
                movingShot &&
                settledFrames >= config.settleFrames &&
                gameRef.current?.currentShot?.shotId &&
                reportedShotIdRef.current !== gameRef.current.currentShot.shotId
            ) {
                const stones = serializeBodies()
                reportedShotIdRef.current = gameRef.current.currentShot.shotId
                onSettled(gameRef.current.currentShot.shotId, stones)
            }

            drawScene()
            animationFrameRef.current = window.requestAnimationFrame(animate)
        }

        resizeCanvas()
        animationFrameRef.current = window.requestAnimationFrame(animate)
        window.addEventListener('resize', resizeCanvas)

        return () => {
            window.removeEventListener('resize', resizeCanvas)
            window.cancelAnimationFrame(animationFrameRef.current)
        }
    }, [config, onSettled])

    useEffect(() => {
        if (!config || !engineRef.current || !shotEvent?.shotId) {
            return
        }

        if (appliedShotIdsRef.current.has(shotEvent.shotId)) {
            return
        }

        applyShotToEngine(shotEvent, config, engineRef.current)
        appliedShotIdsRef.current.add(shotEvent.shotId)
        reportedShotIdRef.current = null
    }, [config, shotEvent])

    useEffect(() => {
        if (game?.status === 'lobby' && game?.gameId === null) {
            aimingRef.current = null
        }
    }, [game?.status, game?.gameId])

    function applyShotToEngine(shot, loadedConfig, engine) {
        const { Bodies, Body, Composite } = Matter
        const vector = normalizeVector(shot.vector)

        if (!vector) {
            return
        }

        const body = Bodies.circle(
            loadedConfig.launchPosition.x,
            loadedConfig.launchPosition.y,
            loadedConfig.stoneRadius,
            {
                restitution: loadedConfig.restitution,
                friction: 0,
                frictionStatic: 0,
                frictionAir: loadedConfig.frictionAir,
                slop: 0,
                inertia: Infinity,
                label: shot.stoneId,
            },
        )

        body.plugin = {
            stoneId: shot.stoneId,
            ownerPlayerId: shot.playerId,
        }

        Composite.add(engine.world, body)
        stoneBodiesRef.current.set(shot.stoneId, body)

        Body.applyForce(body, body.position, {
            x: vector.x * loadedConfig.shotPower,
            y: vector.y * loadedConfig.shotPower,
        })
    }

    function settleStoppedBodies(loadedConfig) {
        const { Body } = Matter

        for (const body of stoneBodiesRef.current.values()) {
            if (body.speed <= loadedConfig.settleSpeed) {
                Body.setVelocity(body, { x: 0, y: 0 })
                Body.setAngularVelocity(body, 0)
            }
        }
    }

    function serializeBodies() {
        return [...stoneBodiesRef.current.values()].map((body) => ({
            id: body.plugin?.stoneId ?? body.label,
            ownerPlayerId: Number(body.plugin?.ownerPlayerId),
            x: Number(body.position.x.toFixed(3)),
            y: Number(body.position.y.toFixed(3)),
            vx: Number(body.velocity.x.toFixed(4)),
            vy: Number(body.velocity.y.toFixed(4)),
            radius: Number(body.circleRadius?.toFixed(3) || config?.stoneRadius || 0),
        }))
    }

    function toLogicalPoint(event) {
        const canvas = canvasRef.current
        const rect = canvas.getBoundingClientRect()
        const { logicalWidth, logicalHeight, uniformScale } = dimensionsRef.current
        const localX = event.clientX - rect.left
        const localY = event.clientY - rect.top

        return {
            x: localX / uniformScale,
            y: localY / uniformScale,
            insideBoard:
                localX >= 0 &&
                localX <= logicalWidth * uniformScale &&
                localY >= 0 &&
                localY <= logicalHeight * uniformScale,
        }
    }

    function drawScene() {
        const canvas = canvasRef.current
        if (!canvas || !config) {
            return
        }

        const ctx = canvas.getContext('2d')
        const { logicalWidth, logicalHeight, uniformScale, pixelRatio } = dimensionsRef.current

        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.setTransform(pixelRatio * uniformScale, 0, 0, pixelRatio * uniformScale, 0, 0)

        ctx.fillStyle = '#d9f2ff'
        ctx.fillRect(0, 0, logicalWidth, logicalHeight)

        ctx.fillStyle = 'rgba(255, 255, 255, 0.18)'
        for (let y = 0; y < logicalHeight; y += 72) {
            ctx.fillRect(0, y, logicalWidth, 30)
        }

        ctx.strokeStyle = '#082f49'
        ctx.lineWidth = 4
        ctx.strokeRect(2, 2, logicalWidth - 4, logicalHeight - 4)

        drawCircle(ctx, config.target.x, config.target.y, config.target.radius, '#ef4444')
        drawCircle(ctx, config.target.x, config.target.y, config.target.radius * 0.72, '#ffffff')
        drawCircle(ctx, config.target.x, config.target.y, config.target.radius * 0.4, '#2563eb')
        drawCircle(ctx, config.target.x, config.target.y, config.target.radius * 0.16, '#ffffff')

        ctx.beginPath()
        ctx.moveTo(24, config.launchPosition.y + config.stoneRadius + 18)
        ctx.lineTo(logicalWidth - 24, config.launchPosition.y + config.stoneRadius + 18)
        ctx.strokeStyle = 'rgba(8, 47, 73, 0.25)'
        ctx.lineWidth = 5
        ctx.stroke()

        if (canShoot) {
            const meIndex = game.playersIds.indexOf(playerId)
            drawCircle(
                ctx,
                config.launchPosition.x,
                config.launchPosition.y,
                config.stoneRadius,
                PLAYER_COLORS[meIndex] ?? '#94a3b8',
            )
            drawCircle(
                ctx,
                config.launchPosition.x,
                config.launchPosition.y,
                config.stoneRadius * 0.42,
                'rgba(255,255,255,0.85)',
            )
            ctx.beginPath()
            ctx.arc(config.launchPosition.x, config.launchPosition.y, config.stoneRadius, 0, Math.PI * 2)
            ctx.strokeStyle = '#111827'
            ctx.lineWidth = 2
            ctx.stroke()
        }

        for (const body of stoneBodiesRef.current.values()) {
            const ownerIndex = game.playersIds.indexOf(body.plugin?.ownerPlayerId)
            drawCircle(ctx, body.position.x, body.position.y, body.circleRadius, PLAYER_COLORS[ownerIndex] ?? '#94a3b8')
            drawCircle(ctx, body.position.x, body.position.y, body.circleRadius * 0.42, 'rgba(255,255,255,0.85)')

            ctx.beginPath()
            ctx.arc(body.position.x, body.position.y, body.circleRadius, 0, Math.PI * 2)
            ctx.strokeStyle = '#111827'
            ctx.lineWidth = 2
            ctx.stroke()
        }

        if (aimingRef.current) {
            const clamped = clampMagnitude(
                aimingRef.current.pointerX - config.launchPosition.x,
                aimingRef.current.pointerY - config.launchPosition.y,
                config.maxPullDistance,
            )
            const shotEndX = config.launchPosition.x - clamped.dx
            const shotEndY = config.launchPosition.y - clamped.dy

            ctx.beginPath()
            ctx.moveTo(config.launchPosition.x, config.launchPosition.y)
            ctx.lineTo(config.launchPosition.x + clamped.dx, config.launchPosition.y + clamped.dy)
            ctx.strokeStyle = 'rgba(15, 23, 42, 0.25)'
            ctx.lineWidth = 4
            ctx.stroke()

            ctx.strokeStyle = '#f59e0b'
            ctx.fillStyle = '#f59e0b'
            ctx.lineWidth = 6
            drawArrow(ctx, config.launchPosition.x, config.launchPosition.y, shotEndX, shotEndY)

            ctx.beginPath()
            ctx.arc(config.launchPosition.x, config.launchPosition.y, config.maxPullDistance, 0, Math.PI * 2)
            ctx.strokeStyle = 'rgba(245, 158, 11, 0.18)'
            ctx.lineWidth = 2
            ctx.stroke()
        }

        ctx.setTransform(1, 0, 0, 1, 0, 0)
    }

    function handlePointerDown(event) {
        if (!config || !isMyTurn || !canShoot) {
            return
        }

        const pointer = toLogicalPoint(event)
        if (!pointer.insideBoard) {
            return
        }

        const distance = Math.hypot(pointer.x - config.launchPosition.x, pointer.y - config.launchPosition.y)
        if (distance > config.stoneRadius) {
            return
        }

        aimingRef.current = {
            pointerX: pointer.x,
            pointerY: pointer.y,
        }

        event.currentTarget.setPointerCapture(event.pointerId)
    }

    function handlePointerMove(event) {
        if (!aimingRef.current) {
            return
        }

        const pointer = toLogicalPoint(event)
        aimingRef.current = {
            pointerX: pointer.x,
            pointerY: pointer.y,
        }
    }

    function handlePointerUp(event) {
        if (!aimingRef.current || !config) {
            return
        }

        const pointer = toLogicalPoint(event)
        const clamped = clampMagnitude(
            pointer.x - config.launchPosition.x,
            pointer.y - config.launchPosition.y,
            config.maxPullDistance,
        )

        aimingRef.current = null

        if (clamped.distance > 4) {
            onShoot({
                x: Number((-clamped.dx).toFixed(4)),
                y: Number((-clamped.dy).toFixed(4)),
            })
        }

        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId)
        }
    }

    function handlePointerCancel(event) {
        aimingRef.current = null

        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId)
        }
    }

    if (loadError) {
        return (
            <div className="flex items-center justify-center p-4">
                <div className="rounded-lg border border-red-400/50 bg-red-950/60 px-6 py-4 text-sm text-red-100">
                    {loadError}
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-full w-full items-center justify-center">
            <canvas
                ref={canvasRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerCancel}
                className="block touch-none rounded-lg bg-white shadow-[0_25px_60px_rgba(15,23,42,0.45)]"
            />
        </div>
    )
}
