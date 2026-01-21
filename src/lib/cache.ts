/**
 * Data Caching Layer
 * Caches API responses with configurable TTL per data type
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
}

// In-memory cache (in production, use Redis or Supabase)
const cache = new Map<string, CacheEntry<unknown>>()

// TTL configurations in milliseconds
export const CACHE_TTL = {
  quote: 60 * 1000, // 1 minute for real-time quotes
  profile: 30 * 24 * 60 * 60 * 1000, // 30 days for company profiles
  financials: 24 * 60 * 60 * 1000, // 24 hours for financials
  news: 15 * 60 * 1000, // 15 minutes for news
  historical: 60 * 60 * 1000, // 1 hour for historical data
  technicals: 60 * 60 * 1000, // 1 hour for technical indicators
} as const

export type CacheType = keyof typeof CACHE_TTL

interface CacheStats {
  hits: number
  misses: number
  size: number
}

const stats: CacheStats = {
  hits: 0,
  misses: 0,
  size: 0,
}

function generateKey(type: CacheType, identifier: string, extra?: string): string {
  return `${type}:${identifier}${extra ? `:${extra}` : ''}`
}

/**
 * Get cached data if available and not expired
 */
export function getCached<T>(type: CacheType, identifier: string, extra?: string): T | null {
  const key = generateKey(type, identifier, extra)
  const entry = cache.get(key) as CacheEntry<T> | undefined

  if (!entry) {
    stats.misses++
    return null
  }

  const now = Date.now()
  if (now >= entry.expiresAt) {
    cache.delete(key)
    stats.misses++
    stats.size = cache.size
    return null
  }

  stats.hits++
  return entry.data
}

/**
 * Set cached data with TTL
 */
export function setCached<T>(
  type: CacheType,
  identifier: string,
  data: T,
  extra?: string
): void {
  const key = generateKey(type, identifier, extra)
  const now = Date.now()
  const ttl = CACHE_TTL[type]

  cache.set(key, {
    data,
    timestamp: now,
    expiresAt: now + ttl,
  })

  stats.size = cache.size
}

/**
 * Invalidate cached data
 */
export function invalidateCache(type: CacheType, identifier: string, extra?: string): void {
  const key = generateKey(type, identifier, extra)
  cache.delete(key)
  stats.size = cache.size
}

/**
 * Invalidate all cache for a specific type
 */
export function invalidateCacheType(type: CacheType): void {
  const prefix = `${type}:`
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key)
    }
  }
  stats.size = cache.size
}

/**
 * Clear all cache
 */
export function clearCache(): void {
  cache.clear()
  stats.size = 0
}

/**
 * Get cache statistics
 */
export function getCacheStats(): CacheStats & { hitRate: number } {
  const total = stats.hits + stats.misses
  return {
    ...stats,
    hitRate: total > 0 ? (stats.hits / total) * 100 : 0,
  }
}

/**
 * Get or fetch data with caching
 */
export async function getOrFetch<T>(
  type: CacheType,
  identifier: string,
  fetcher: () => Promise<T>,
  extra?: string
): Promise<T> {
  // Check cache first
  const cached = getCached<T>(type, identifier, extra)
  if (cached !== null) {
    return cached
  }

  // Fetch fresh data
  const data = await fetcher()

  // Cache the result
  if (data !== null && data !== undefined) {
    setCached(type, identifier, data, extra)
  }

  return data
}

/**
 * Stale-while-revalidate pattern
 * Returns stale data immediately while revalidating in background
 */
export async function getStaleWhileRevalidate<T>(
  type: CacheType,
  identifier: string,
  fetcher: () => Promise<T>,
  extra?: string
): Promise<{ data: T | null; isStale: boolean }> {
  const key = generateKey(type, identifier, extra)
  const entry = cache.get(key) as CacheEntry<T> | undefined
  const now = Date.now()

  // If we have cached data (even if stale), return it
  if (entry) {
    const isStale = now >= entry.expiresAt

    // Revalidate in background if stale
    if (isStale) {
      fetcher()
        .then((data) => {
          if (data !== null && data !== undefined) {
            setCached(type, identifier, data, extra)
          }
        })
        .catch(console.error)
    }

    return { data: entry.data, isStale }
  }

  // No cached data, must fetch
  try {
    const data = await fetcher()
    if (data !== null && data !== undefined) {
      setCached(type, identifier, data, extra)
    }
    return { data, isStale: false }
  } catch (error) {
    return { data: null, isStale: false }
  }
}

/**
 * Cleanup expired entries (call periodically)
 */
export function cleanupExpiredEntries(): number {
  const now = Date.now()
  let cleaned = 0

  for (const [key, entry] of cache.entries()) {
    if (now >= entry.expiresAt) {
      cache.delete(key)
      cleaned++
    }
  }

  stats.size = cache.size
  return cleaned
}

// Auto cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredEntries, 300000)
}
