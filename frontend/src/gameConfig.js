function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max)
}

function requirePositiveNumber(value, label) {
    const numeric = Number(value)

    if (!Number.isFinite(numeric) || numeric <= 0) {
        throw new Error(`Konfiguracia hry nema validne ${label}.`)
    }

    return numeric
}

export function sanitizeGameConfig(config) {
    const boardWidth = requirePositiveNumber(config?.board?.width, 'board.width')
    const boardHeight = requirePositiveNumber(config?.board?.height, 'board.height')
    const targetX = requirePositiveNumber(config?.target?.x, 'target.x')
    const targetY = requirePositiveNumber(config?.target?.y, 'target.y')
    const targetRadius = requirePositiveNumber(config?.target?.radius, 'target.radius')
    const launchPosition = {
        x: clamp(
            Number(config?.launchPosition?.x) || boardWidth / 2,
            40,
            boardWidth - 40,
        ),
        y: clamp(
            Number(config?.launchPosition?.y) || boardHeight - 130,
            boardHeight / 2,
            boardHeight - 40,
        ),
    }

    return {
        board: {
            width: boardWidth,
            height: boardHeight,
        },
        target: {
            x: targetX,
            y: targetY,
            radius: targetRadius,
        },
        stonesPerPlayer: Math.max(1, requirePositiveNumber(config?.stonesPerPlayer, 'stonesPerPlayer')),
        stoneRadius: clamp(Number(config?.stoneRadius) || 26, 16, 42),
        launchPosition,
        maxPullDistance: clamp(Number(config?.maxPullDistance) || 190, 80, 280),
        shotPower: clamp(Number(config?.shotPower) || 0.00085, 0.0002, 0.003),
        frictionAir: clamp(Number(config?.physics?.frictionAir) || 0.018, 0.001, 0.08),
        restitution: clamp(Number(config?.physics?.restitution) || 0.92, 0.4, 1),
        wallRestitution: clamp(Number(config?.physics?.wallRestitution) || 0.96, 0.4, 1),
        settleSpeed: clamp(Number(config?.physics?.settleSpeed) || 0.08, 0.01, 0.3),
        settleFrames: Math.max(10, Number(config?.physics?.settleFrames) || 24),
    }
}

