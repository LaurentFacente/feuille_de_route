/**
 * Logger minimal et structuré, commun au client et aux scripts Node.
 * En production (PROD), seuls warn/error sont émis pour limiter le bruit.
 */

type Level = 'debug' | 'info' | 'warn' | 'error'

const isProd = typeof import.meta !== 'undefined' && Boolean(import.meta.env?.PROD)

function emit(level: Level, scope: string, message: string, meta?: unknown) {
  if (isProd && (level === 'debug' || level === 'info')) return
  const prefix = `[${new Date().toISOString()}] [${level.toUpperCase()}] [${scope}]`
  const args: unknown[] = meta === undefined ? [prefix, message] : [prefix, message, meta]
  // eslint-disable-next-line no-console
  console[level === 'debug' ? 'log' : level](...args)
}

export function createLogger(scope: string) {
  return {
    debug: (message: string, meta?: unknown) => emit('debug', scope, message, meta),
    info: (message: string, meta?: unknown) => emit('info', scope, message, meta),
    warn: (message: string, meta?: unknown) => emit('warn', scope, message, meta),
    error: (message: string, meta?: unknown) => emit('error', scope, message, meta),
  }
}

export type Logger = ReturnType<typeof createLogger>
