'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

export interface Quote {
  ticker: string
  price: number
  change: number
  changePercent: number
  high: number
  low: number
  volume: number
  timestamp: string
}

interface UseRealTimeQuotesOptions {
  tickers: string[]
  interval?: number // Refresh interval in milliseconds
  enabled?: boolean
}

interface UseRealTimeQuotesResult {
  quotes: Record<string, Quote>
  isLoading: boolean
  error: string | null
  lastUpdated: Date | null
  refresh: () => Promise<void>
  pause: () => void
  resume: () => void
}

export function useRealTimeQuotes({
  tickers,
  interval = 60000, // Default 1 minute
  enabled = true,
}: UseRealTimeQuotesOptions): UseRealTimeQuotesResult {
  const [quotes, setQuotes] = useState<Record<string, Quote>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isVisibleRef = useRef(true)

  const fetchQuotes = useCallback(async () => {
    if (tickers.length === 0) return

    setIsLoading(true)
    setError(null)

    try {
      const results: Record<string, Quote> = {}

      await Promise.all(
        tickers.map(async (ticker) => {
          try {
            const response = await fetch(`/api/stocks/${ticker}`)
            if (response.ok) {
              const data = await response.json()
              results[ticker] = {
                ticker,
                price: data.quote.price,
                change: data.quote.change,
                changePercent: data.quote.changePercent,
                high: data.quote.high,
                low: data.quote.low,
                volume: data.quote.volume,
                timestamp: new Date().toISOString(),
              }
            }
          } catch (err) {
            console.error(`Failed to fetch quote for ${ticker}:`, err)
          }
        })
      )

      setQuotes(results)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch quotes')
    } finally {
      setIsLoading(false)
    }
  }, [tickers])

  const refresh = useCallback(async () => {
    await fetchQuotes()
  }, [fetchQuotes])

  const pause = useCallback(() => {
    setIsPaused(true)
  }, [])

  const resume = useCallback(() => {
    setIsPaused(false)
  }, [])

  // Handle visibility change (pause when tab is hidden)
  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisibleRef.current = document.visibilityState === 'visible'

      if (isVisibleRef.current && !isPaused && enabled) {
        // Refresh immediately when tab becomes visible
        fetchQuotes()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [fetchQuotes, isPaused, enabled])

  // Set up polling interval
  useEffect(() => {
    if (!enabled || isPaused || tickers.length === 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    // Initial fetch
    fetchQuotes()

    // Set up interval
    intervalRef.current = setInterval(() => {
      if (isVisibleRef.current && !isPaused) {
        fetchQuotes()
      }
    }, interval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [enabled, isPaused, tickers, interval, fetchQuotes])

  return {
    quotes,
    isLoading,
    error,
    lastUpdated,
    refresh,
    pause,
    resume,
  }
}

/**
 * Hook for single ticker real-time updates
 */
export function useRealTimeQuote(
  ticker: string,
  options?: Omit<UseRealTimeQuotesOptions, 'tickers'>
): {
  quote: Quote | null
  isLoading: boolean
  error: string | null
  lastUpdated: Date | null
  refresh: () => Promise<void>
} {
  const { quotes, isLoading, error, lastUpdated, refresh } = useRealTimeQuotes({
    tickers: ticker ? [ticker] : [],
    ...options,
  })

  return {
    quote: quotes[ticker] || null,
    isLoading,
    error,
    lastUpdated,
    refresh,
  }
}
