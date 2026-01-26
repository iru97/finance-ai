/**
 * Audit Logging System
 * Logs all queries, responses, and system events for compliance and debugging
 */

export interface AuditLogEntry {
  id: string
  timestamp: string
  userId: string
  eventType: 'query' | 'response' | 'error' | 'auth' | 'system'
  action: string
  details: {
    query?: string
    queryType?: string
    tickers?: string[]
    toolsCalled?: string[]
    responseTime?: number
    inputTokens?: number
    outputTokens?: number
    model?: string
    error?: string
    metadata?: Record<string, unknown>
  }
}

// In-memory log storage (in production, use Supabase or dedicated logging service)
const auditLogs: AuditLogEntry[] = []
const MAX_LOGS = 10000 // Keep last 10000 logs in memory

/**
 * Generate a unique ID for log entries
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Log a query event
 */
export function logQuery(
  userId: string,
  query: string,
  queryType: string,
  tickers: string[]
): string {
  const entry: AuditLogEntry = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    userId,
    eventType: 'query',
    action: 'user_query',
    details: {
      query,
      queryType,
      tickers,
    },
  }

  addLog(entry)
  return entry.id
}

/**
 * Log a response event
 */
export function logResponse(
  queryId: string,
  userId: string,
  responseTime: number,
  inputTokens: number,
  outputTokens: number,
  model: string,
  toolsCalled: string[]
): void {
  const entry: AuditLogEntry = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    userId,
    eventType: 'response',
    action: 'ai_response',
    details: {
      responseTime,
      inputTokens,
      outputTokens,
      model,
      toolsCalled,
      metadata: { queryId },
    },
  }

  addLog(entry)
}

/**
 * Log an error event
 */
export function logError(
  userId: string,
  action: string,
  error: Error | string,
  metadata?: Record<string, unknown>
): void {
  const entry: AuditLogEntry = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    userId,
    eventType: 'error',
    action,
    details: {
      error: error instanceof Error ? error.message : error,
      metadata,
    },
  }

  addLog(entry)

  // Also log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error(`[AUDIT ERROR] ${action}:`, error)
  }
}

/**
 * Log an auth event
 */
export function logAuth(
  userId: string,
  action: 'login' | 'logout' | 'signup' | 'password_reset',
  metadata?: Record<string, unknown>
): void {
  const entry: AuditLogEntry = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    userId,
    eventType: 'auth',
    action,
    details: { metadata },
  }

  addLog(entry)
}

/**
 * Log a system event
 */
export function logSystem(
  action: string,
  metadata?: Record<string, unknown>
): void {
  const entry: AuditLogEntry = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    userId: 'system',
    eventType: 'system',
    action,
    details: { metadata },
  }

  addLog(entry)
}

/**
 * Add log entry with size management
 */
function addLog(entry: AuditLogEntry): void {
  auditLogs.push(entry)

  // Trim old logs if exceeding max
  if (auditLogs.length > MAX_LOGS) {
    auditLogs.splice(0, auditLogs.length - MAX_LOGS)
  }
}

/**
 * Get logs for a specific user
 */
export function getUserLogs(
  userId: string,
  limit = 100,
  offset = 0
): AuditLogEntry[] {
  return auditLogs
    .filter((log) => log.userId === userId)
    .slice(-limit - offset, offset > 0 ? -offset : undefined)
    .reverse()
}

/**
 * Get all logs (admin only)
 */
export function getAllLogs(
  limit = 100,
  offset = 0,
  eventType?: AuditLogEntry['eventType']
): AuditLogEntry[] {
  let filtered = auditLogs

  if (eventType) {
    filtered = filtered.filter((log) => log.eventType === eventType)
  }

  return filtered
    .slice(-limit - offset, offset > 0 ? -offset : undefined)
    .reverse()
}

/**
 * Get query history for a user (for the query history page)
 */
export function getQueryHistory(
  userId: string,
  limit = 50,
  offset = 0
): Array<{
  id: string
  query: string
  queryType: string
  tickers: string[]
  timestamp: string
}> {
  return auditLogs
    .filter((log) => log.userId === userId && log.eventType === 'query')
    .slice(-limit - offset, offset > 0 ? -offset : undefined)
    .reverse()
    .map((log) => ({
      id: log.id,
      query: log.details.query || '',
      queryType: log.details.queryType || 'unknown',
      tickers: log.details.tickers || [],
      timestamp: log.timestamp,
    }))
}

/**
 * Get usage statistics for a user
 */
export function getUserStats(userId: string): {
  totalQueries: number
  queriesLast24h: number
  queriesLast7d: number
  totalTokens: number
  averageResponseTime: number
  topTickers: Array<{ ticker: string; count: number }>
} {
  const userLogs = auditLogs.filter((log) => log.userId === userId)
  const now = Date.now()
  const oneDayAgo = now - 24 * 60 * 60 * 1000
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000

  const queries = userLogs.filter((log) => log.eventType === 'query')
  const responses = userLogs.filter((log) => log.eventType === 'response')

  const tickerCounts: Record<string, number> = {}
  queries.forEach((log) => {
    log.details.tickers?.forEach((ticker) => {
      tickerCounts[ticker] = (tickerCounts[ticker] || 0) + 1
    })
  })

  const topTickers = Object.entries(tickerCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([ticker, count]) => ({ ticker, count }))

  const totalTokens = responses.reduce(
    (sum, log) => sum + (log.details.inputTokens || 0) + (log.details.outputTokens || 0),
    0
  )

  const responseTimes = responses
    .map((log) => log.details.responseTime)
    .filter((t): t is number => t !== undefined)

  return {
    totalQueries: queries.length,
    queriesLast24h: queries.filter(
      (log) => new Date(log.timestamp).getTime() > oneDayAgo
    ).length,
    queriesLast7d: queries.filter(
      (log) => new Date(log.timestamp).getTime() > sevenDaysAgo
    ).length,
    totalTokens,
    averageResponseTime:
      responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0,
    topTickers,
  }
}

/**
 * Export logs for compliance (e.g., GDPR data export)
 */
export function exportUserLogs(userId: string): string {
  const logs = auditLogs.filter((log) => log.userId === userId)
  return JSON.stringify(logs, null, 2)
}

/**
 * Delete user logs (GDPR right to erasure)
 */
export function deleteUserLogs(userId: string): number {
  const initialLength = auditLogs.length
  const filtered = auditLogs.filter((log) => log.userId !== userId)
  auditLogs.length = 0
  auditLogs.push(...filtered)
  return initialLength - auditLogs.length
}
