import fs from 'fs'
import WebSocket, {WebSocketServer} from 'ws'
import Matter from 'matter-js'

const PORT = Number(process.env.PORT) || 3000
const CONFIG_PATH = '/home/xmicek/curling-game-config/game-config.json'
const PHYSICS_TIMESTEP_MS = 1000 / 60
const PHYSICS_SNAPSHOT_EVERY_TICKS = 3
const WALL_THICKNESS = 90

function readPositiveNumber(value, label) {
    const numeric = Number(value)

    if (!Number.isFinite(numeric) || numeric <= 0) {
        throw new Error(`KonfigurĂˇcia hry nemĂˇ validnĂ© ${label}.`)
    }

    return numeric
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max)
}

function loadGameConfig() {
    try {
        const raw = fs.readFileSync(CONFIG_PATH, 'utf8')
        const parsed = JSON.parse(raw)
        const boardWidth = readPositiveNumber(parsed?.board?.width, 'board.width')
        const boardHeight = readPositiveNumber(parsed?.board?.height, 'board.height')

        return {
            stonesPerPlayer: Math.max(1, readPositiveNumber(parsed?.stonesPerPlayer, 'stonesPerPlayer')),
            stoneRadius: clamp(Number(parsed?.stoneRadius) || 26, 16, 42),
            maxPullDistance: clamp(Number(parsed?.maxPullDistance) || 190, 80, 280),
            launchPosition: {
                x: clamp(Number(parsed?.launchPosition?.x) || boardWidth / 2, 40, boardWidth - 40),
                y: clamp(Number(parsed?.launchPosition?.y) || boardHeight - 130, boardHeight / 2, boardHeight - 40),
            },
            shotPower: clamp(Number(parsed?.shotPower) || 0.00085, 0.0002, 0.003),
            frictionAir: clamp(Number(parsed?.physics?.frictionAir) || 0.018, 0.001, 0.08),
            restitution: clamp(Number(parsed?.physics?.restitution) || 0.92, 0.4, 1),
            wallRestitution: clamp(Number(parsed?.physics?.wallRestitution) || 0.96, 0.4, 1),
            settleSpeed: clamp(Number(parsed?.physics?.settleSpeed) || 0.08, 0.01, 0.3),
            settleFrames: Math.max(10, Number(parsed?.physics?.settleFrames) || 24),
            board: {
                width: boardWidth,
                height: boardHeight,
            },
            target: {
                x: readPositiveNumber(parsed?.target?.x, 'target.x'),
                y: readPositiveNumber(parsed?.target?.y, 'target.y'),
                radius: readPositiveNumber(parsed?.target?.radius, 'target.radius'),
            },
        }
    } catch (error) {
        console.error('Nepodarilo sa naÄŤĂ­taĹĄ validnĂ˝ game-config.json.', error)
        process.exit(1)
    }
}

const config = loadGameConfig()
const wss = new WebSocketServer({ port: PORT })

let nextPlayerId = 1
let nextGameId = 1
const players = []

const game = {
    status: 'lobby',
    gameId: null,
    playersIds: [],
    turnPlayerId: null,
    currentShot: null,
    paused: false,
    pausedByPlayerId: null,
    pauseComment: '',
    shotsPerPlayer: config.stonesPerPlayer,
    shotsTaken: {},
    restartVotes: [],
    result: null,
    stones: [],
}

let physicsEngine = null
let settledFrames = 0
let physicsTickCounter = 0
let physicsSnapshotSeq = 0

function send(ws, payload) {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(payload))
    }
}

function broadcast(payload) {
    const message = JSON.stringify(payload)

    for (const client of wss.clients) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message)
        }
    }
}

function sendError(ws, message) {
    send(ws, { type: 'error', message })
}

function getLeader() {
    return players[0] ?? null
}

function getLeaderId() {
    return getLeader()?.playerId ?? null
}

function getPlayerById(playerId) {
    return players.find((player) => player.playerId === playerId) ?? null
}

function serializeDynamicBodies() {
    if (!physicsEngine) {
        return []
    }

    const {Composite} = Matter

    return Composite.allBodies(physicsEngine.world)
        .filter((body) => !body.isStatic)
        .map((body) => ({
            id: body.plugin?.stoneId ?? body.label,
            ownerPlayerId: Number(body.plugin?.ownerPlayerId),
            x: Number(body.position.x.toFixed(3)),
            y: Number(body.position.y.toFixed(3)),
            vx: Number(body.velocity.x.toFixed(4)),
            vy: Number(body.velocity.y.toFixed(4)),
            radius: Number(body.circleRadius?.toFixed(3) || config.stoneRadius),
        }))
}

function syncGameStonesFromPhysics() {
    game.stones = serializeDynamicBodies()
}

function createSnapshot() {
    const leader = getLeader()
    const activeIds = new Set(game.playersIds)

    return {
        type: 'snapshot',
        lobby: {
            connectedPlayers: players.length,
            leaderId: leader?.playerId ?? null,
            leaderName: leader?.nickname ?? null,
            players: players.map((player) => ({
                playerId: player.playerId,
                nickname: player.nickname,
                isLeader: player.playerId === leader?.playerId,
                isConnected: true,
                isActivePlayer: activeIds.has(player.playerId),
            })),
        },
        game: {
            status: game.status,
            gameId: game.gameId,
            playersIds: game.playersIds,
            turnPlayerId: game.turnPlayerId,
            currentShot: game.currentShot,
            paused: game.paused,
            pausedByPlayerId: game.pausedByPlayerId,
            pauseComment: game.pauseComment,
            shotsPerPlayer: game.shotsPerPlayer,
            shotsTaken: game.shotsTaken,
            restartVotes: game.restartVotes,
            result: game.result,
            stones: game.stones,
        },
        config,
    }
}

function broadcastSnapshot() {
    broadcast(createSnapshot())
}

function broadcastNotice(message, tone = 'info') {
    broadcast({ type: 'notice', message, tone })
}

function createPhysicsEngine() {
    const {Engine, Bodies, Composite} = Matter
    const engine = Engine.create({
        gravity: {x: 0, y: 0},
        enableSleeping: false,
    })

    engine.positionIterations = 10
    engine.velocityIterations = 8
    engine.constraintIterations = 2

    const {width, height} = config.board
    const wallOptions = {
        isStatic: true,
        restitution: config.wallRestitution,
        friction: 0,
        frictionStatic: 0,
        slop: 0,
        render: {visible: false},
    }

    const walls = [
        Bodies.rectangle(width / 2, -WALL_THICKNESS / 2, width + WALL_THICKNESS * 2, WALL_THICKNESS, wallOptions),
        Bodies.rectangle(width / 2, height + WALL_THICKNESS / 2, width + WALL_THICKNESS * 2, WALL_THICKNESS, wallOptions),
        Bodies.rectangle(-WALL_THICKNESS / 2, height / 2, WALL_THICKNESS, height + WALL_THICKNESS * 2, wallOptions),
        Bodies.rectangle(width + WALL_THICKNESS / 2, height / 2, WALL_THICKNESS, height + WALL_THICKNESS * 2, wallOptions),
    ]

    Composite.add(engine.world, walls)
    return engine
}

function ensurePhysicsEngine() {
    if (!physicsEngine) {
        physicsEngine = createPhysicsEngine()
    }

    return physicsEngine
}

function clearDynamicBodies() {
    if (!physicsEngine) {
        return
    }

    const {Composite, World} = Matter
    const bodies = Composite.allBodies(physicsEngine.world).filter((body) => !body.isStatic)

    for (const body of bodies) {
        World.remove(physicsEngine.world, body)
    }
}

function resetPhysicsState() {
    ensurePhysicsEngine()
    clearDynamicBodies()
    settledFrames = 0
    physicsTickCounter = 0
    physicsSnapshotSeq = 0
    game.stones = []
}

function settleStoppedBodies() {
    if (!physicsEngine) {
        return
    }

    const {Body, Composite} = Matter

    for (const body of Composite.allBodies(physicsEngine.world)) {
        if (body.isStatic) {
            continue
        }

        if (body.speed <= config.settleSpeed) {
            Body.setVelocity(body, {x: 0, y: 0})
            Body.setAngularVelocity(body, 0)
        }
    }
}

function areAllDynamicBodiesStill() {
    if (!physicsEngine) {
        return false
    }

    const {Composite} = Matter
    const bodies = Composite.allBodies(physicsEngine.world).filter((body) => !body.isStatic)
    return bodies.length > 0 && bodies.every((body) => body.speed <= config.settleSpeed)
}

function broadcastPhysicsSnapshot() {
    if (!game.currentShot) {
        return
    }

    physicsSnapshotSeq += 1
    broadcast({
        type: 'physics_snapshot',
        shotId: game.currentShot.shotId,
        seq: physicsSnapshotSeq,
        serverTime: Date.now(),
        stones: game.stones,
    })
}

function buildScoreResult(stones) {
    const ranked = stones
        .map((stone) => ({
            ...stone,
            distance: Math.hypot(stone.x - config.target.x, stone.y - config.target.y),
        }))
        .sort((a, b) => a.distance - b.distance)

    const bestStone = ranked[0] ?? null
    const winner = bestStone ? getPlayerById(bestStone.ownerPlayerId) : null

    return {
        type: 'score',
        winnerPlayerId: winner?.playerId ?? null,
        winnerNickname: winner?.nickname ?? null,
        stones: ranked,
        message: winner
            ? `VyhrĂˇva ${winner.nickname}, jeho kameĹ je najbliĹľĹˇie k cieÄľu.`
            : 'Nepodarilo sa urÄŤiĹĄ vĂ­ĹĄaza.',
    }
}

function finalizeCurrentShot() {
    syncGameStonesFromPhysics()

    const finishedShotId = game.currentShot?.shotId ?? null
    const totalShots = Object.values(game.shotsTaken).reduce((sum, count) => sum + count, 0)
    const maxShots = game.playersIds.length * game.shotsPerPlayer

    game.currentShot = null
    settledFrames = 0

    if (totalShots >= maxShots) {
        finishGame(buildScoreResult(game.stones))
    } else {
        const currentTurnIndex = game.playersIds.indexOf(game.turnPlayerId)
        const nextTurnIndex = currentTurnIndex === 0 ? 1 : 0
        game.turnPlayerId = game.playersIds[nextTurnIndex] ?? null
        game.restartVotes = []
    }

    broadcast({
        type: 'shot_finished',
        shotId: finishedShotId,
        seq: physicsSnapshotSeq + 1,
        serverTime: Date.now(),
        stones: game.stones,
        nextTurnPlayerId: game.turnPlayerId,
        gameStatus: game.status,
        result: game.result,
    })
    broadcastSnapshot()
}

function tickPhysics() {
    if (!physicsEngine || game.status !== 'running' || game.paused || !game.currentShot) {
        return
    }

    Matter.Engine.update(physicsEngine, PHYSICS_TIMESTEP_MS)
    settleStoppedBodies()
    syncGameStonesFromPhysics()

    physicsTickCounter += 1
    if (physicsTickCounter % PHYSICS_SNAPSHOT_EVERY_TICKS === 0) {
        broadcastPhysicsSnapshot()
    }

    if (areAllDynamicBodiesStill()) {
        settledFrames += 1
    } else {
        settledFrames = 0
    }

    if (settledFrames >= config.settleFrames) {
        finalizeCurrentShot()
    }
}

setInterval(tickPhysics, PHYSICS_TIMESTEP_MS)

function resetGameState() {
    game.status = 'lobby'
    game.gameId = null
    game.playersIds = []
    game.turnPlayerId = null
    game.currentShot = null
    game.paused = false
    game.pausedByPlayerId = null
    game.pauseComment = ''
    game.shotsPerPlayer = config.stonesPerPlayer
    game.shotsTaken = {}
    game.restartVotes = []
    game.result = null
    resetPhysicsState()
}

function startGame() {
    game.status = 'running'
    game.gameId = nextGameId++
    game.playersIds = players.map((player) => player.playerId)
    game.turnPlayerId = game.playersIds[0] ?? null
    game.currentShot = null
    game.paused = false
    game.pausedByPlayerId = null
    game.pauseComment = ''
    game.shotsPerPlayer = config.stonesPerPlayer
    game.shotsTaken = Object.fromEntries(game.playersIds.map((playerId) => [playerId, 0]))
    game.restartVotes = []
    game.result = null
    resetPhysicsState()
}

function finishGame(result) {
    game.status = 'finished'
    game.currentShot = null
    game.paused = false
    game.pausedByPlayerId = null
    game.pauseComment = ''
    game.restartVotes = []
    game.result = result
    syncGameStonesFromPhysics()
}

function validateNickname(nickname) {
    if (typeof nickname !== 'string') {
        return null
    }

    const trimmed = nickname.trim().slice(0, 24)
    return trimmed.length > 0 ? trimmed : null
}

function validateVector(vector) {
    const x = Number(vector?.x)
    const y = Number(vector?.y)

    if (!Number.isFinite(x) || !Number.isFinite(y)) {
        return null
    }

    return {x, y}
}

function spawnShotStone(shot) {
    const engine = ensurePhysicsEngine()
    const {Bodies, Body, Composite} = Matter
    const body = Bodies.circle(
        config.launchPosition.x,
        config.launchPosition.y,
        config.stoneRadius,
        {
            restitution: config.restitution,
            friction: 0,
            frictionStatic: 0,
            frictionAir: config.frictionAir,
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
    Body.applyForce(body, body.position, {
        x: shot.vector.x * config.shotPower,
        y: shot.vector.y * config.shotPower,
    })
}

function removePlayer(player, noticeMessage) {
    const index = players.findIndex((item) => item.playerId === player.playerId)
    if (index === -1) {
        return
    }

    players.splice(index, 1)

    if (game.playersIds.includes(player.playerId) && game.status !== 'lobby') {
        finishGame({
            type: 'disconnect',
            winnerPlayerId: null,
            winnerNickname: null,
            stones: game.stones,
            message: `HrĂˇÄŤ ${player.nickname} ukonÄŤil spojenie. Hra bola korektne ukonÄŤenĂˇ.`,
        })
    }

    if (players.length === 0) {
        resetGameState()
    }

    broadcastNotice(noticeMessage, 'warning')
    broadcastSnapshot()
}

wss.on('connection', (ws) => {
    ws.playerId = null

    send(ws, {
        type: 'hello',
        message: 'Spojenie so serverom bolo otvorenĂ©.',
    })

    ws.on('message', (rawMessage) => {
        let message

        try {
            message = JSON.parse(rawMessage.toString())
        } catch {
            sendError(ws, 'SprĂˇva musĂ­ byĹĄ validnĂ˝ JSON.')
            return
        }

        if (message.type === 'join_lobby') {
            const nickname = validateNickname(message.nickname)

            if (!nickname) {
                sendError(ws, 'Hracie meno nie je validnĂ©.')
                return
            }

            const player = {
                playerId: nextPlayerId++,
                nickname,
                ws,
            }

            ws.playerId = player.playerId
            players.push(player)

            send(ws, {
                type: 'session_ready',
                playerId: player.playerId,
                nickname: player.nickname,
            })
            broadcastNotice(`HrĂˇÄŤ ${player.nickname} sa pripojil na server.`, 'success')
            broadcastSnapshot()
            return
        }

        const player = getPlayerById(ws.playerId)

        if (!player) {
            sendError(ws, 'Najprv je potrebnĂ© sa prihlĂˇsiĹĄ.')
            return
        }

        if (message.type === 'request_snapshot') {
            send(ws, createSnapshot())
            return
        }

        if (message.type === 'disconnect') {
            removePlayer(player, `HrĂˇÄŤ ${player.nickname} sa odpojil zo servera.`)
            return
        }

        if (message.type === 'start_game') {
            if (player.playerId !== getLeaderId()) {
                sendError(ws, 'Hru mĂ´Ĺľe spustiĹĄ iba lobby leader.')
                return
            }

            if (players.length !== 2) {
                sendError(ws, 'Na spustenie hry musia byĹĄ pripojenĂ­ prĂˇve dvaja hrĂˇÄŤi.')
                return
            }

            startGame()
            broadcastNotice(`Leader ${player.nickname} spustil hru.`, 'success')
            broadcastSnapshot()
            return
        }

        if (message.type === 'end_game') {
            if (player.playerId !== getLeaderId()) {
                sendError(ws, 'Hru mĂ´Ĺľe ukonÄŤiĹĄ iba lobby leader.')
                return
            }

            resetGameState()
            broadcastNotice(`Leader ${player.nickname} ukonÄŤil hru.`, 'warning')
            broadcastSnapshot()
            return
        }

        if (message.type === 'toggle_pause') {
            if (!game.playersIds.includes(player.playerId)) {
                sendError(ws, 'Pauzu mĂ´Ĺľe meniĹĄ iba aktĂ­vny hrĂˇÄŤ.')
                return
            }

            if (game.status !== 'running') {
                sendError(ws, 'Pauzu je moĹľnĂ© pouĹľiĹĄ iba poÄŤas aktĂ­vnej hry.')
                return
            }

            game.paused = !game.paused
            game.pausedByPlayerId = game.paused ? player.playerId : null
            game.pauseComment = game.paused
                ? `Hru pozastavil ${player.nickname}.`
                : `${player.nickname} obnovil hru.`

            broadcastNotice(game.pauseComment, game.paused ? 'warning' : 'success')
            broadcastSnapshot()
            return
        }

        if (message.type === 'request_restart') {
            if (!game.playersIds.includes(player.playerId)) {
                sendError(ws, 'ReĹˇtart mĂ´Ĺľu potvrdiĹĄ iba aktĂ­vni hrĂˇÄŤi.')
                return
            }

            if (game.status === 'lobby') {
                sendError(ws, 'AktuĂˇlne nie je spustenĂˇ Ĺľiadna hra na reĹˇtart.')
                return
            }

            if (!game.restartVotes.includes(player.playerId)) {
                game.restartVotes.push(player.playerId)
            }

            if (game.playersIds.every((playerId) => game.restartVotes.includes(playerId))) {
                startGame()
                broadcastNotice('SpĂşĹˇĹĄa sa novĂˇ hra.', 'success')
            } else {
                broadcastNotice(`HrĂˇÄŤ ${player.nickname} navrhol reĹˇtart hry.`, 'info')
            }

            broadcastSnapshot()
            return
        }

        if (message.type === 'shoot') {
            if (game.status !== 'running') {
                sendError(ws, 'KameĹ je moĹľnĂ© hodiĹĄ iba poÄŤas aktĂ­vnej hry.')
                return
            }

            if (game.paused) {
                sendError(ws, 'Hra je pozastavenĂˇ.')
                return
            }

            if (game.currentShot) {
                sendError(ws, 'ÄŚakĂˇ sa, kĂ˝m sa vĹˇetky kamene Ăşplne zastavia.')
                return
            }

            if (player.playerId !== game.turnPlayerId) {
                sendError(ws, 'Teraz nie si na ĹĄahu.')
                return
            }

            const vector = validateVector(message.vector)
            if (!vector) {
                sendError(ws, 'Vektor vĂ˝strelu nie je validnĂ˝.')
                return
            }

            const shotNumber = (game.shotsTaken[player.playerId] ?? 0) + 1
            if (shotNumber > game.shotsPerPlayer) {
                sendError(ws, 'Pre tohto hrĂˇÄŤa uĹľ nie sĂş k dispozĂ­cii ÄŹalĹˇie kamene.')
                return
            }

            const baseStones = [...game.stones]

            game.currentShot = {
                shotId: `shot-${Date.now()}-${player.playerId}-${shotNumber}`,
                playerId: player.playerId,
                nickname: player.nickname,
                stoneId: `${player.playerId}-${shotNumber}`,
                shotNumber,
                vector,
            }

            game.shotsTaken[player.playerId] = shotNumber
            game.restartVotes = []
            settledFrames = 0
            physicsSnapshotSeq = 0

            spawnShotStone(game.currentShot)
            syncGameStonesFromPhysics()

            broadcast({
                type: 'shot_started',
                shotId: game.currentShot.shotId,
                seq: physicsSnapshotSeq,
                serverTime: Date.now(),
                stones: baseStones,
                shot: game.currentShot,
            })
            broadcastSnapshot()
            return
        }

        sendError(ws, 'NeznĂˇmy typ sprĂˇvy.')
    })

    ws.on('close', () => {
        const player = getPlayerById(ws.playerId)

        if (player) {
            removePlayer(player, `HrĂˇÄŤ ${player.nickname} sa odpojil zo servera.`)
        }
    })
})

console.log(`WS server beĹľĂ­ na porte ${PORT}`)
