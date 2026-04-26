import {useEffect, useRef} from 'react'
import Matter from 'matter-js'

const VIEWPORT_PADDING = 20
const PLAYER_COLORS = ['#ef4444', '#2563eb']
const PHYSICS_TIMESTEP_MS = 1000 / 60
const SNAP_THRESHOLD_PX = 18
const POSITION_BLEND = 0.35
const VELOCITY_BLEND = 0.35

function clampMagnitude(dx, dy, maxDistance) {
    if (!Number.isFinite(maxDistance) || maxDistance <= 0) {
        return {dx, dy, distance: Math.hypot(dx, dy)}
    }

    const distance = Math.hypot(dx, dy)

    if (!distance || distance <= maxDistance) {
        return {dx, dy, distance}
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

export default function GameCanvas({
    playerId,
    isMyTurn,
    canShoot,
    game,
    config,
    shotStartedEvent,
    physicsSnapshotEvent,
    shotFinishedEvent,
    onShoot,
}) {
    const canvasRef = useRef(null)
    const engineRef = useRef(null)
    const animationFrameRef = useRef(null)
    const lastFrameTimeRef = useRef(0)
    const accumulatorRef = useRef(0)
    const stoneBodiesRef = useRef(new Map())
    const aimingRef = useRef(null)
    const localShotIdRef = useRef(null)
    const latestSeqRef = useRef(-1)
    const currentShotRef = useRef(game?.currentShot ?? null)
    const dimensionsRef = useRef({
        logicalWidth: 1,
        logicalHeight: 1,
        displayWidth: 1,
        displayHeight: 1,
        uniformScale: 1,
        pixelRatio: 1,
    })

    currentShotRef.current = game?.currentShot ?? null

    useEffect(() => {
        if (!config || !game?.gameId) {
            return
        }

        const {Engine, Bodies, Composite} = Matter
        const engine = Engine.create({
            gravity: {x: 0, y: 0},
            enableSleeping: false,
        })

        engine.positionIterations = 10
        engine.velocityIterations = 8
        engine.constraintIterations = 2
        engineRef.current = engine
        stoneBodiesRef.current = new Map()
        localShotIdRef.current = null
        latestSeqRef.current = -1
        accumulatorRef.current = 0
        lastFrameTimeRef.current = 0

        const wallOptions = {
            isStatic: true,
            restitution: config.wallRestitution,
            friction: 0,
            frictionStatic: 0,
            slop: 0,
            render: {visible: false},
        }

        const walls = [
            Bodies.rectangle(config.board.width / 2, -45, config.board.width + 180, 90, wallOptions),
            Bodies.rectangle(config.board.width / 2, config.board.height + 45, config.board.width + 180, 90, wallOptions),
            Bodies.rectangle(-45, config.board.height / 2, 90, config.board.height + 180, wallOptions),
            Bodies.rectangle(config.board.width + 45, config.board.height / 2, 90, config.board.height + 180, wallOptions),
        ]

        Composite.add(engine.world, walls)
        hardSyncBodies(game?.stones ?? [], config)

        return () => {
            window.cancelAnimationFrame(animationFrameRef.current)
            Matter.World.clear(engine.world, false)
            Matter.Engine.clear(engine)
            engineRef.current = null
            stoneBodiesRef.current = new Map()
        }
    }, [config, game?.gameId])

    useEffect(() => {
        if (!config) {
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

            if (!canvas) {
                return
            }

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

        resizeCanvas()
        window.addEventListener('resize', resizeCanvas)

        return () => {
            window.removeEventListener('resize', resizeCanvas)
        }
    }, [config])

    useEffect(() => {
        if (!engineRef.current || !config) {
            return
        }

        const animate = (timestamp) => {
            if (!engineRef.current) {
                return
            }

            if (!lastFrameTimeRef.current) {
                lastFrameTimeRef.current = timestamp
            }

            const elapsed = Math.min(timestamp - lastFrameTimeRef.current, 50)
            lastFrameTimeRef.current = timestamp
            accumulatorRef.current += elapsed

            while (accumulatorRef.current >= PHYSICS_TIMESTEP_MS) {
                if (currentShotRef.current && !game?.paused) {
                    Matter.Engine.update(engineRef.current, PHYSICS_TIMESTEP_MS)
                    settleStoppedBodies(config)
                }

                accumulatorRef.current -= PHYSICS_TIMESTEP_MS
            }

            drawScene()
            animationFrameRef.current = window.requestAnimationFrame(animate)
        }

        animationFrameRef.current = window.requestAnimationFrame(animate)

        return () => {
            window.cancelAnimationFrame(animationFrameRef.current)
            lastFrameTimeRef.current = 0
            accumulatorRef.current = 0
        }
    }, [config, game?.paused])

    useEffect(() => {
        if (!config || !engineRef.current) {
            return
        }

        if (game?.status === 'lobby' && game?.gameId === null) {
            aimingRef.current = null
        }

        if (game?.currentShot && !localShotIdRef.current) {
            localShotIdRef.current = game.currentShot.shotId
            latestSeqRef.current = -1
            hardSyncBodies(game?.stones ?? [], config)
        }

        if (!game?.currentShot) {
            localShotIdRef.current = null
            latestSeqRef.current = -1
            hardSyncBodies(game?.stones ?? [], config)
        }

        drawScene()
    }, [game, config])

    useEffect(() => {
        if (!config || !engineRef.current || !shotStartedEvent?.shotId || !shotStartedEvent?.shot) {
            return
        }

        localShotIdRef.current = shotStartedEvent.shotId
        currentShotRef.current = shotStartedEvent.shot
        latestSeqRef.current = Number(shotStartedEvent.seq ?? 0)
        hardSyncBodies(shotStartedEvent.stones ?? [], config)
        spawnPredictedShot(shotStartedEvent.shot, config)
        drawScene()
    }, [shotStartedEvent, config])

    useEffect(() => {
        if (!config || !engineRef.current || !physicsSnapshotEvent?.shotId) {
            return
        }

        if (localShotIdRef.current !== physicsSnapshotEvent.shotId) {
            return
        }

        const seq = Number(physicsSnapshotEvent.seq ?? -1)
        if (seq <= latestSeqRef.current) {
            return
        }

        latestSeqRef.current = seq
        reconcileBodies(physicsSnapshotEvent.stones ?? [], config)
        drawScene()
    }, [physicsSnapshotEvent, config])

    useEffect(() => {
        if (!config || !engineRef.current || !shotFinishedEvent?.shotId) {
            return
        }

        const seq = Number(shotFinishedEvent.seq ?? -1)
        if (
            localShotIdRef.current === shotFinishedEvent.shotId &&
            seq >= latestSeqRef.current
        ) {
            latestSeqRef.current = seq
            hardSyncBodies(shotFinishedEvent.stones ?? [], config)
            localShotIdRef.current = null
            currentShotRef.current = null
            drawScene()
        }
    }, [shotFinishedEvent, config])

    function createStoneBody(stone, loadedConfig) {
        const {Bodies} = Matter
        const body = Bodies.circle(
            Number(stone.x),
            Number(stone.y),
            Number(stone.radius) || loadedConfig.stoneRadius,
            {
                restitution: loadedConfig.restitution,
                friction: 0,
                frictionStatic: 0,
                frictionAir: loadedConfig.frictionAir,
                slop: 0,
                inertia: Infinity,
                label: stone.id,
            },
        )

        body.plugin = {
            stoneId: stone.id,
            ownerPlayerId: stone.ownerPlayerId,
        }

        Matter.Body.setVelocity(body, {
            x: Number(stone.vx) || 0,
            y: Number(stone.vy) || 0,
        })

        return body
    }

    function hardSyncBodies(stones, loadedConfig) {
        if (!engineRef.current) {
            return
        }

        const {Composite, World} = Matter
        const world = engineRef.current.world
        const nextIds = new Set(stones.map((stone) => stone.id))

        for (const [stoneId, body] of stoneBodiesRef.current.entries()) {
            if (!nextIds.has(stoneId)) {
                World.remove(world, body)
                stoneBodiesRef.current.delete(stoneId)
            }
        }

        for (const stone of stones) {
            const existing = stoneBodiesRef.current.get(stone.id)

            if (!existing) {
                const body = createStoneBody(stone, loadedConfig)
                Composite.add(world, body)
                stoneBodiesRef.current.set(stone.id, body)
                continue
            }

            Matter.Body.setPosition(existing, {x: Number(stone.x), y: Number(stone.y)})
            Matter.Body.setVelocity(existing, {
                x: Number(stone.vx) || 0,
                y: Number(stone.vy) || 0,
            })
            existing.plugin = {
                stoneId: stone.id,
                ownerPlayerId: stone.ownerPlayerId,
            }
        }
    }

    function reconcileBodies(stones, loadedConfig) {
        if (!engineRef.current) {
            return
        }

        const {Composite, World, Body} = Matter
        const world = engineRef.current.world
        const nextIds = new Set(stones.map((stone) => stone.id))

        for (const [stoneId, body] of stoneBodiesRef.current.entries()) {
            if (!nextIds.has(stoneId)) {
                World.remove(world, body)
                stoneBodiesRef.current.delete(stoneId)
            }
        }

        for (const stone of stones) {
            const targetX = Number(stone.x)
            const targetY = Number(stone.y)
            const targetVx = Number(stone.vx) || 0
            const targetVy = Number(stone.vy) || 0
            const existing = stoneBodiesRef.current.get(stone.id)

            if (!existing) {
                const body = createStoneBody(stone, loadedConfig)
                Composite.add(world, body)
                stoneBodiesRef.current.set(stone.id, body)
                continue
            }

            existing.plugin = {
                stoneId: stone.id,
                ownerPlayerId: stone.ownerPlayerId,
            }

            const dx = targetX - existing.position.x
            const dy = targetY - existing.position.y
            const distance = Math.hypot(dx, dy)

            if (distance > SNAP_THRESHOLD_PX) {
                Body.setPosition(existing, {x: targetX, y: targetY})
                Body.setVelocity(existing, {x: targetVx, y: targetVy})
                continue
            }

            Body.setPosition(existing, {
                x: existing.position.x + dx * POSITION_BLEND,
                y: existing.position.y + dy * POSITION_BLEND,
            })
            Body.setVelocity(existing, {
                x: existing.velocity.x + (targetVx - existing.velocity.x) * VELOCITY_BLEND,
                y: existing.velocity.y + (targetVy - existing.velocity.y) * VELOCITY_BLEND,
            })
        }
    }

    function spawnPredictedShot(shot, loadedConfig) {
        if (!engineRef.current) {
            return
        }

        const {Body, Composite} = Matter
        const predictedStone = {
            id: shot.stoneId,
            ownerPlayerId: shot.playerId,
            x: loadedConfig.launchPosition.x,
            y: loadedConfig.launchPosition.y,
            vx: 0,
            vy: 0,
            radius: loadedConfig.stoneRadius,
        }

        const body = createStoneBody(predictedStone, loadedConfig)
        Composite.add(engineRef.current.world, body)
        stoneBodiesRef.current.set(shot.stoneId, body)

        Body.applyForce(body, body.position, {
            x: Number(shot.vector?.x || 0) * loadedConfig.shotPower,
            y: Number(shot.vector?.y || 0) * loadedConfig.shotPower,
        })
    }

    function settleStoppedBodies(loadedConfig) {
        const {Body} = Matter

        for (const body of stoneBodiesRef.current.values()) {
            if (body.speed <= loadedConfig.settleSpeed) {
                Body.setVelocity(body, {x: 0, y: 0})
                Body.setAngularVelocity(body, 0)
            }
        }
    }

    function toLogicalPoint(event) {
        const canvas = canvasRef.current
        const rect = canvas.getBoundingClientRect()
        const {logicalWidth, logicalHeight, uniformScale} = dimensionsRef.current
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
        const {logicalWidth, logicalHeight, uniformScale, pixelRatio} = dimensionsRef.current
        const maxPullDistance = Number.isFinite(config.maxPullDistance) ? config.maxPullDistance : 190

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
            const meIndex = game?.playersIds?.indexOf(playerId) ?? -1
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
            const ownerIndex = game?.playersIds?.indexOf(body.plugin?.ownerPlayerId) ?? -1
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
                maxPullDistance,
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
            ctx.arc(config.launchPosition.x, config.launchPosition.y, maxPullDistance, 0, Math.PI * 2)
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

        drawScene()
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

        drawScene()
    }

    function handlePointerUp(event) {
        if (!aimingRef.current || !config) {
            return
        }

        const pointer = toLogicalPoint(event)
        const clamped = clampMagnitude(
            pointer.x - config.launchPosition.x,
            pointer.y - config.launchPosition.y,
            Number.isFinite(config.maxPullDistance) ? config.maxPullDistance : 190,
        )

        aimingRef.current = null

        if (clamped.distance > 4) {
            onShoot({
                x: Number((-clamped.dx).toFixed(4)),
                y: Number((-clamped.dy).toFixed(4)),
            })
        }

        drawScene()

        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId)
        }
    }

    function handlePointerCancel(event) {
        aimingRef.current = null
        drawScene()

        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId)
        }
    }

    if (!config) {
        return (
            <div className="flex items-center justify-center p-4">
                <div className="rounded-lg border border-slate-700/60 bg-slate-950/60 px-6 py-4 text-sm text-slate-200">
                    Načítava sa herná plocha...
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
