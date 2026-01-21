/**
 * Rate Limiter System
 * Tracks and enforces API rate limits per user and per data source
 */

interface RateLimitConfig {
  maxRequests: number
  windowMs: number // Time window in milliseconds
}

interface RateLimitEntry {
  count: number
  resetAt: number
}

// In-memory rate limit storage (in production, use Redis or Supabase)
const rateLimits = new Map<string, RateLimitEntry>()

// Rate limit configurations by source
const SOURCE_LIMITS: Record<string, RateLimitConfig> = {
  finnhub: { maxRequests: 60, windowMs: 60000 }, // 60 req/min
  yahoo: { maxRequests: 100, windowMs: 60000 }, // 100 req/min (self-imposed)
  sec: { maxRequests: 10, windowMs: 1000 }, // 10 req/sec
  openai: { maxRequests: 60, windowMs: 60000 }, // 60 req/min
  gemini: { maxRequests: 60, windowMs: 60000 }, // 60 req/min
}

// User rate limits
const USER_LIMITS: RateLimitConfig = {
  maxRequests: 100,
  windowMs: 3600000, // 100 req/hour
}

const DAILY_USER_LIMITS: RateLimitConfig = {
  maxRequests: 1000,
  windowMs: 86400000, // 1000 req/day
}

export interface RateLimitStatus {
  allowed: boolean
  remaining: number
  resetAt: number
  retryAfter?: number
}

function getKey(identifier: string, type: 'source' | 'user' | 'user_daily'): string {
  return `${type}:${identifier}`
}

function checkLimit(key: string, config: RateLimitConfig): RateLimitStatus {
  const now = Date.now()
  const entry = rateLimits.get(key)

  // No existing entry or window expired
  if (!entry || now >= entry.resetAt) {
    rateLimits.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    })
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: now + config.windowMs,
    }
  }

  // Window still active
  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    }
  }

  // Increment count
  entry.count++
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  }
}

/**
 * Check if a request to a data source is allowed
 */
export function checkSourceLimit(source: string): RateLimitStatus {
  const config = SOURCE_LIMITS[source]
  if (!config) {
    return { allowed: true, remaining: Infinity, resetAt: 0 }
  }
  return checkLimit(getKey(source, 'source'), config)
}

/**
 * Check if a user request is allowed (hourly limit)
 */
export function checkUserLimit(userId: string): RateLimitStatus {
  return checkLimit(getKey(userId, 'user'), USER_LIMITS)
}

/**
 * Check if a user request is allowed (daily limit)
 */
export function checkUserDailyLimit(userId: string): RateLimitStatus {
  return checkLimit(getKey(userId, 'user_daily'), DAILY_USER_LIMITS)
}

/**
 * Check both hourly and daily user limits
 */
export function checkUserLimits(userId: string): RateLimitStatus {
  const hourly = checkUserLimit(userId)
  if (!hourly.allowed) return hourly

  const daily = checkUserDailyLimit(userId)
  if (!daily.allowed) return daily

  // Return the more restrictive remaining count
  return hourly.remaining < daily.remaining ? hourly : daily
}

/**
 * Get remaining requests for a user
 */
export function getUserRemainingRequests(userId: string): {
  hourly: { remaining: number; resetAt: number }
  daily: { remaining: number; resetAt: number }
} {
  const hourlyKey = getKey(userId, 'user')
  const dailyKey = getKey(userId, 'user_daily')
  const now = Date.now()

  const hourlyEntry = rateLimits.get(hourlyKey)
  const dailyEntry = rateLimits.get(dailyKey)

  return {
    hourly: {
      remaining: hourlyEntry && now < hourlyEntry.resetAt
        ? USER_LIMITS.maxRequests - hourlyEntry.count
        : USER_LIMITS.maxRequests,
      resetAt: hourlyEntry?.resetAt || now + USER_LIMITS.windowMs,
    },
    daily: {
      remaining: dailyEntry && now < dailyEntry.resetAt
        ? DAILY_USER_LIMITS.maxRequests - dailyEntry.count
        : DAILY_USER_LIMITS.maxRequests,
      resetAt: dailyEntry?.resetAt || now + DAILY_USER_LIMITS.windowMs,
    },
  }
}

/**
 * Get remaining requests for a data source
 */
export function getSourceRemainingRequests(source: string): {
  remaining: number
  resetAt: number
  limit: number
} {
  const config = SOURCE_LIMITS[source]
  if (!config) {
    return { remaining: Infinity, resetAt: 0, limit: Infinity }
  }

  const key = getKey(source, 'source')
  const entry = rateLimits.get(key)
  const now = Date.now()

  return {
    remaining: entry && now < entry.resetAt
      ? config.maxRequests - entry.count
      : config.maxRequests,
    resetAt: entry?.resetAt || now + config.windowMs,
    limit: config.maxRequests,
  }
}

/**
 * Wait until a slot is available for a source
 */
export async function waitForSourceSlot(source: string): Promise<void> {
  const status = checkSourceLimit(source)
  if (status.allowed) return

  if (status.retryAfter) {
    await new Promise(resolve => setTimeout(resolve, status.retryAfter! * 1000))
  }
}

/**
 * Decorator to rate limit a function
 */
export function withRateLimit<T>(
  source: string,
  fn: () => Promise<T>
): Promise<T> {
  const status = checkSourceLimit(source)
  if (!status.allowed) {
    throw new RateLimitError(source, status.retryAfter || 60)
  }
  return fn()
}

/**
 * Rate limit error class
 */
export class RateLimitError extends Error {
  constructor(
    public source: string,
    public retryAfter: number
  ) {
    super(`Rate limit exceeded for ${source}. Retry after ${retryAfter} seconds.`)
    this.name = 'RateLimitError'
  }
}

/**
 * Clean up expired entries (call periodically)
 */
export function cleanupExpiredEntries(): void {
  const now = Date.now()
  for (const [key, entry] of rateLimits.entries()) {
    if (now >= entry.resetAt) {
      rateLimits.delete(key)
    }
  }
}

// Auto cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredEntries, 300000)
}
