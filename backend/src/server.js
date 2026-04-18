const fs = require('fs')
const path = require('path')
const WebSocket = require('ws')

const PORT = Number(process.env.PORT) || 3000
const CONFIG_PATH = path.resolve(__dirname, '..', '..', 'frontend', 'src', 'config', 'game-config.json')

function readPositiveNumber(value, label) {
    const numeric = Number(value)

    if (!Number.isFinite(numeric) || numeric <= 0) {
        throw new Error(`Konfigurácia hry nemá validné ${label}.`)
    }

    return numeric
}

function loadGameConfig() {
    try {
        const raw = fs.readFileSync(CONFIG_PATH, 'utf8')
        const parsed = JSON.parse(raw)

        return {
            stonesPerPlayer: Math.max(1, readPositiveNumber(parsed?.stonesPerPlayer, 'stonesPerPlayer')),
            board: {
                width: readPositiveNumber(parsed?.board?.width, 'board.width'),
                height: readPositiveNumber(parsed?.board?.height, 'board.height'),
            },
            target: {
                x: readPositiveNumber(parsed?.target?.x, 'target.x'),
                y: readPositiveNumber(parsed?.target?.y, 'target.y'),
                radius: readPositiveNumber(parsed?.target?.radius, 'target.radius'),
            },
        }
    } catch (error) {
        console.error('Nepodarilo sa načítať validný game-config.json.', error)
        process.exit(1)
    }
}

const config = loadGameConfig()
const wss = new WebSocket.Server({ port: PORT })

let nextPlayerId = 1
let nextGameId = 1
const players = []

const game = {
    status: 'lobby',
    gameId: null,
    activePlayerIds: [],
    turnPlayerId: null,
    currentShot: null,
    paused: false,
    pausedByPlayerId: null,
    pauseReason: '',
    shotsPerPlayer: config.stonesPerPlayer,
    shotsTaken: {},
    settleReports: {},
    restartVotes: [],
    result: null,
}

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

function getActivePlayers() {
    return players.slice(0, 2)
}

function createSnapshot() {
    const leader = getLeader()
    const activeIds = new Set(game.activePlayerIds)

    return {
        type: 'snapshot',
        lobby: {
            connectedPlayers: players.length,
            leaderId: leader?.playerId ?? null,
            leaderName: leader?.nickname ?? null,
            players: players.map((player) => ({
                sessionId: player.playerId,
                playerId: player.playerId,
                nickname: player.nickname,
                isLeader: player.playerId === leader?.playerId,
                isConnected: true,
                isActivePlayer: activeIds.has(player.playerId),
                joinedAt: player.joinedAt,
            })),
        },
        game: {
            status: game.status,
            gameId: game.gameId,
            activePlayerIds: game.activePlayerIds,
            turnPlayerId: game.turnPlayerId,
            currentShot: game.currentShot,
            paused: game.paused,
            pausedByPlayerId: game.pausedByPlayerId,
            pauseReason: game.pauseReason,
            shotsPerPlayer: game.shotsPerPlayer,
            shotsTaken: game.shotsTaken,
            restartVotes: game.restartVotes,
            result: game.result,
        },
        config,
        serverTime: Date.now(),
    }
}

function broadcastSnapshot() {
    broadcast(createSnapshot())
}

function broadcastNotice(message, tone = 'info') {
    broadcast({ type: 'notice', message, tone })
}

function resetGameState() {
    game.status = 'lobby'
    game.gameId = null
    game.activePlayerIds = []
    game.turnPlayerId = null
    game.currentShot = null
    game.paused = false
    game.pausedByPlayerId = null
    game.pauseReason = ''
    game.shotsPerPlayer = config.stonesPerPlayer
    game.shotsTaken = {}
    game.settleReports = {}
    game.restartVotes = []
    game.result = null
}

function startGame() {
    const activePlayers = getActivePlayers()

    game.status = 'running'
    game.gameId = nextGameId++
    game.activePlayerIds = activePlayers.map((player) => player.playerId)
    game.turnPlayerId = game.activePlayerIds[0] ?? null
    game.currentShot = null
    game.paused = false
    game.pausedByPlayerId = null
    game.pauseReason = ''
    game.shotsPerPlayer = config.stonesPerPlayer
    game.shotsTaken = Object.fromEntries(game.activePlayerIds.map((playerId) => [playerId, 0]))
    game.settleReports = {}
    game.restartVotes = []
    game.result = null
}

function finishGame(result) {
    game.status = 'finished'
    game.currentShot = null
    game.paused = false
    game.pausedByPlayerId = null
    game.pauseReason = ''
    game.restartVotes = []
    game.settleReports = {}
    game.result = result
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
            ? `Vyhráva ${winner.nickname}, jeho kameň je najbližšie k cieľu.`
            : 'Nepodarilo sa určiť víťaza.',
    }
}

function finalizeCurrentShot() {
    const shotId = game.currentShot?.shotId
    const reports = shotId ? game.settleReports[shotId] : null

    if (!shotId || !reports) {
        return
    }

    const firstReport = Object.values(reports)[0]
    const stones = firstReport?.stones ?? []
    const totalShots = Object.values(game.shotsTaken).reduce((sum, count) => sum + count, 0)
    const maxShots = game.activePlayerIds.length * game.shotsPerPlayer

    game.currentShot = null
    delete game.settleReports[shotId]

    if (totalShots >= maxShots) {
        finishGame(buildScoreResult(stones))
        broadcastSnapshot()
        return
    }

    const currentTurnIndex = game.activePlayerIds.indexOf(game.turnPlayerId)
    const nextTurnIndex = currentTurnIndex === -1 ? 0 : (currentTurnIndex + 1) % game.activePlayerIds.length
    game.turnPlayerId = game.activePlayerIds[nextTurnIndex] ?? null
    game.restartVotes = []
    broadcastSnapshot()
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

    return { x, y }
}

function validateStones(stones) {
    if (!Array.isArray(stones)) {
        return null
    }

    const normalized = []

    for (const stone of stones) {
        const x = Number(stone?.x)
        const y = Number(stone?.y)
        const radius = Number(stone?.radius)
        const ownerPlayerId = Number(stone?.ownerPlayerId)

        if (
            typeof stone?.id !== 'string' ||
            !Number.isFinite(x) ||
            !Number.isFinite(y) ||
            !Number.isFinite(radius) ||
            !Number.isFinite(ownerPlayerId)
        ) {
            return null
        }

        normalized.push({
            id: stone.id,
            x,
            y,
            radius,
            ownerPlayerId,
        })
    }

    return normalized
}

function removePlayer(player, noticeMessage) {
    const index = players.findIndex((item) => item.playerId === player.playerId)
    if (index === -1) {
        return
    }

    players.splice(index, 1)

    if (game.activePlayerIds.includes(player.playerId) && game.status !== 'lobby') {
        finishGame({
            type: 'disconnect',
            winnerPlayerId: null,
            winnerNickname: null,
            stones: [],
            message: `Hráč ${player.nickname} ukončil spojenie. Hra bola korektne ukončená.`,
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
        message: 'Spojenie so serverom bolo otvorené.',
    })

    ws.on('message', (rawMessage) => {
        let message

        try {
            message = JSON.parse(rawMessage.toString())
        } catch {
            sendError(ws, 'Správa musí byť validný JSON.')
            return
        }

        if (message.type === 'join_lobby') {
            const nickname = validateNickname(message.nickname)

            if (!nickname) {
                sendError(ws, 'Hracie meno nie je validné.')
                return
            }

            const player = {
                playerId: nextPlayerId++,
                nickname,
                joinedAt: Date.now(),
                ws,
            }

            ws.playerId = player.playerId
            players.push(player)

            send(ws, {
                type: 'session_ready',
                playerId: player.playerId,
                nickname: player.nickname,
            })
            broadcastNotice(`Hráč ${player.nickname} sa pripojil na server.`, 'success')
            broadcastSnapshot()
            return
        }

        const player = getPlayerById(ws.playerId)

        if (!player) {
            sendError(ws, 'Najprv je potrebné sa prihlásiť.')
            return
        }

        if (message.type === 'request_snapshot') {
            send(ws, createSnapshot())
            return
        }

        if (message.type === 'disconnect') {
            removePlayer(player, `Hráč ${player.nickname} sa odpojil zo servera.`)
            return
        }

        if (message.type === 'start_game') {
            if (player.playerId !== getLeaderId()) {
                sendError(ws, 'Hru môže spustiť iba lobby leader.')
                return
            }

            if (players.length < 2) {
                sendError(ws, 'Na spustenie hry musia byť pripojení práve dvaja hráči.')
                return
            }

            startGame()
            broadcastNotice(`Leader ${player.nickname} spustil hru.`, 'success')
            broadcastSnapshot()
            return
        }

        if (message.type === 'end_game') {
            if (player.playerId !== getLeaderId()) {
                sendError(ws, 'Hru môže ukončiť iba lobby leader.')
                return
            }

            resetGameState()
            broadcastNotice(`Leader ${player.nickname} ukončil hru.`, 'warning')
            broadcastSnapshot()
            return
        }

        if (message.type === 'toggle_pause') {
            if (!game.activePlayerIds.includes(player.playerId)) {
                sendError(ws, 'Pauzu môže meniť iba aktívny hráč.')
                return
            }

            if (game.status !== 'running') {
                sendError(ws, 'Pauzu je možné použiť iba počas aktívnej hry.')
                return
            }

            game.paused = !game.paused
            game.pausedByPlayerId = game.paused ? player.playerId : null
            game.pauseReason = game.paused
                ? `Hru pozastavil ${player.nickname}.`
                : `${player.nickname} obnovil hru.`

            broadcastNotice(game.pauseReason, game.paused ? 'warning' : 'success')
            broadcastSnapshot()
            return
        }

        if (message.type === 'request_restart') {
            if (!game.activePlayerIds.includes(player.playerId)) {
                sendError(ws, 'Reštart môžu potvrdiť iba aktívni hráči.')
                return
            }

            if (game.status === 'lobby') {
                sendError(ws, 'Aktuálne nie je spustená žiadna hra na reštart.')
                return
            }

            if (!game.restartVotes.includes(player.playerId)) {
                game.restartVotes.push(player.playerId)
            }

            if (game.activePlayerIds.every((playerId) => game.restartVotes.includes(playerId))) {
                startGame()
                broadcastNotice('Spúšťa sa nová hra.', 'success')
            } else {
                broadcastNotice(`Hráč ${player.nickname} navrhol reštart hry.`, 'info')
            }

            broadcastSnapshot()
            return
        }

        if (message.type === 'shoot') {
            if (game.status !== 'running') {
                sendError(ws, 'Kameň je možné hodiť iba počas aktívnej hry.')
                return
            }

            if (game.paused) {
                sendError(ws, 'Hra je pozastavená.')
                return
            }

            if (game.currentShot) {
                sendError(ws, 'Čaká sa, kým sa všetky kamene úplne zastavia.')
                return
            }

            if (player.playerId !== game.turnPlayerId) {
                sendError(ws, 'Teraz nie si na ťahu.')
                return
            }

            const vector = validateVector(message.vector)
            if (!vector) {
                sendError(ws, 'Vektor výstrelu nie je validný.')
                return
            }

            const shotNumber = (game.shotsTaken[player.playerId] ?? 0) + 1
            if (shotNumber > game.shotsPerPlayer) {
                sendError(ws, 'Pre tohto hráča už nie sú k dispozícii ďalšie kamene.')
                return
            }

            game.currentShot = {
                shotId: `shot-${Date.now()}-${player.playerId}-${shotNumber}`,
                playerId: player.playerId,
                nickname: player.nickname,
                stoneId: `${player.playerId}-${shotNumber}`,
                shotNumber,
                vector,
                createdAt: Date.now(),
            }

            game.shotsTaken[player.playerId] = shotNumber
            game.settleReports[game.currentShot.shotId] = {}
            game.restartVotes = []

            broadcast({ type: 'shot_fired', shot: game.currentShot })
            broadcastSnapshot()
            return
        }

        if (message.type === 'shot_settled') {
            if (!game.currentShot || game.currentShot.shotId !== String(message.shotId || '')) {
                sendError(ws, 'Server nečaká na report pre tento hod.')
                return
            }

            if (!game.activePlayerIds.includes(player.playerId)) {
                sendError(ws, 'Report môžu poslať iba aktívni hráči.')
                return
            }

            const stones = validateStones(message.stones)
            if (!stones) {
                sendError(ws, 'Report kameňov nie je validný.')
                return
            }

            game.settleReports[game.currentShot.shotId][player.playerId] = {
                playerId: player.playerId,
                stones,
            }

            if (
                game.activePlayerIds.every(
                    (playerId) => Boolean(game.settleReports[game.currentShot.shotId][playerId]),
                )
            ) {
                finalizeCurrentShot()
            } else {
                broadcastSnapshot()
            }

            return
        }

        sendError(ws, 'Neznámy typ správy.')
    })

    ws.on('close', () => {
        const player = getPlayerById(ws.playerId)

        if (player) {
            removePlayer(player, `Hráč ${player.nickname} sa odpojil zo servera.`)
        }
    })
})

console.log(`WS server beží na porte ${PORT}`)
