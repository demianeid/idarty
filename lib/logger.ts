import 'server-only'

type LogLevel = 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  correlationId?: string
  [key: string]: unknown
}

function formatLog(entry: LogEntry): string {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    ...entry,
  })
}

export function createLogger(context: Record<string, string> = {}) {
  const base = { ...context }

  return {
    info(message: string, extra?: Record<string, unknown>) {
      console.log(formatLog({ level: 'info', message, ...base, ...extra }))
    },
    warn(message: string, extra?: Record<string, unknown>) {
      console.warn(formatLog({ level: 'warn', message, ...base, ...extra }))
    },
    error(message: string, extra?: Record<string, unknown>) {
      console.error(formatLog({ level: 'error', message, ...base, ...extra }))
    },
  }
}

export function getCorrelationId(headers?: Headers): string {
  if (!headers) return crypto.randomUUID()
  const existing = headers.get('x-correlation-id')
  if (existing) return existing
  return crypto.randomUUID()
}
