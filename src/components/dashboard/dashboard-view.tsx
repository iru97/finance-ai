'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Plus,
  MessageSquare,
  Star,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Sparkline } from '@/components/charts/sparkline'
import { Skeleton } from '@/components/ui/skeleton'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useToaster } from '@/components/ui/toaster'
import { cn } from '@/lib/utils'

interface DashboardViewProps {
  userId: string
  userEmail: string
}

interface Watchlist {
  id: string
  name: string
  tickers: string[]
}

interface StockQuote {
  ticker: string
  name: string
  price: number
  change: number
  changePercent: number
  sparklineData: number[]
}

export function DashboardView({ userId, userEmail }: DashboardViewProps) {
  const [watchlists, setWatchlists] = useState<Watchlist[]>([])
  const [quotes, setQuotes] = useState<Record<string, StockQuote>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const toaster = useToaster()

  const fetchWatchlists = useCallback(async () => {
    try {
      const response = await fetch('/api/watchlists')
      if (response.ok) {
        const data = await response.json()
        setWatchlists(data)
        return data
      }
    } catch (error) {
      console.error('Failed to fetch watchlists:', error)
    }
    return []
  }, [])

  const fetchQuotes = useCallback(async (tickers: string[]) => {
    const uniqueTickers = [...new Set(tickers)]
    const newQuotes: Record<string, StockQuote> = {}

    await Promise.all(
      uniqueTickers.map(async (ticker) => {
        try {
          const response = await fetch(`/api/stocks/${ticker}?range=1W`)
          if (response.ok) {
            const data = await response.json()
            newQuotes[ticker] = {
              ticker,
              name: data.profile.name,
              price: data.quote.price,
              change: data.quote.change,
              changePercent: data.quote.changePercent,
              sparklineData: data.historicalPrices.map((p: { value: number }) => p.value),
            }
          }
        } catch (error) {
          console.error(`Failed to fetch quote for ${ticker}:`, error)
        }
      })
    )

    setQuotes((prev) => ({ ...prev, ...newQuotes }))
  }, [])

  const loadDashboard = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true)
    else setIsLoading(true)

    try {
      const lists = await fetchWatchlists()
      const allTickers = lists.flatMap((list: Watchlist) => list.tickers)
      if (allTickers.length > 0) {
        await fetchQuotes(allTickers)
      }
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [fetchWatchlists, fetchQuotes])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const handleRefresh = () => {
    loadDashboard(true)
    toaster.info('Refreshing quotes...')
  }

  if (isLoading) {
    return <DashboardSkeleton />
  }

  const allTickers = watchlists.flatMap((list) => list.tickers)
  const topGainers = Object.values(quotes)
    .filter((q) => q.changePercent > 0)
    .sort((a, b) => b.changePercent - a.changePercent)
    .slice(0, 5)
  const topLosers = Object.values(quotes)
    .filter((q) => q.changePercent < 0)
    .sort((a, b) => a.changePercent - b.changePercent)
    .slice(0, 5)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-surface">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
            <p className="text-sm text-text-secondary">Welcome back, {userEmail}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={cn('h-4 w-4 mr-2', isRefreshing && 'animate-spin')} />
              Refresh
            </Button>
            <ThemeToggle />
            <Link href="/chat">
              <Button>
                <MessageSquare className="h-4 w-4 mr-2" />
                Chat
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">Watchlists</p>
                  <p className="text-3xl font-bold text-text-primary">{watchlists.length}</p>
                </div>
                <Star className="h-8 w-8 text-accent" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">Tracked Stocks</p>
                  <p className="text-3xl font-bold text-text-primary">{allTickers.length}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">Avg Change</p>
                  <p className={cn(
                    'text-3xl font-bold',
                    Object.values(quotes).reduce((sum, q) => sum + q.changePercent, 0) >= 0
                      ? 'text-green-500'
                      : 'text-red-500'
                  )}>
                    {Object.values(quotes).length > 0
                      ? (Object.values(quotes).reduce((sum, q) => sum + q.changePercent, 0) / Object.values(quotes).length).toFixed(2)
                      : '0.00'}%
                  </p>
                </div>
                {Object.values(quotes).reduce((sum, q) => sum + q.changePercent, 0) >= 0 ? (
                  <TrendingUp className="h-8 w-8 text-green-500" />
                ) : (
                  <TrendingDown className="h-8 w-8 text-red-500" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Movers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Top Gainers
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topGainers.length === 0 ? (
                <p className="text-text-tertiary text-sm">No gainers today</p>
              ) : (
                <div className="space-y-3">
                  {topGainers.map((stock) => (
                    <Link
                      key={stock.ticker}
                      href={`/research/${stock.ticker}`}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-hover transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium text-text-primary">{stock.ticker}</p>
                          <p className="text-xs text-text-tertiary truncate max-w-[120px]">{stock.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Sparkline data={stock.sparklineData} width={60} height={24} color="success" />
                        <div className="text-right">
                          <p className="font-medium text-text-primary">${stock.price.toFixed(2)}</p>
                          <p className="text-xs text-green-500">+{stock.changePercent.toFixed(2)}%</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-500" />
                Top Losers
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topLosers.length === 0 ? (
                <p className="text-text-tertiary text-sm">No losers today</p>
              ) : (
                <div className="space-y-3">
                  {topLosers.map((stock) => (
                    <Link
                      key={stock.ticker}
                      href={`/research/${stock.ticker}`}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-hover transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium text-text-primary">{stock.ticker}</p>
                          <p className="text-xs text-text-tertiary truncate max-w-[120px]">{stock.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Sparkline data={stock.sparklineData} width={60} height={24} color="error" />
                        <div className="text-right">
                          <p className="font-medium text-text-primary">${stock.price.toFixed(2)}</p>
                          <p className="text-xs text-red-500">{stock.changePercent.toFixed(2)}%</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Watchlists */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-text-primary">Your Watchlists</h2>
          <Link href="/chat">
            <Button variant="secondary" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Create Watchlist
            </Button>
          </Link>
        </div>

        {watchlists.length === 0 ? (
          <Card className="p-8 text-center">
            <Star className="h-12 w-12 mx-auto mb-4 text-text-tertiary" />
            <h3 className="text-lg font-medium text-text-primary mb-2">No watchlists yet</h3>
            <p className="text-text-secondary mb-4">Create a watchlist to start tracking stocks</p>
            <Link href="/chat">
              <Button>Create Your First Watchlist</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {watchlists.map((list) => (
              <Card key={list.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between">
                    <span>{list.name}</span>
                    <span className="text-sm font-normal text-text-tertiary">
                      {list.tickers.length} stocks
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {list.tickers.length === 0 ? (
                    <p className="text-text-tertiary text-sm py-4">No stocks in this watchlist</p>
                  ) : (
                    <div className="space-y-2">
                      {list.tickers.slice(0, 5).map((ticker) => {
                        const quote = quotes[ticker]
                        return (
                          <Link
                            key={ticker}
                            href={`/research/${ticker}`}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-hover transition-colors"
                          >
                            <span className="font-mono text-sm text-text-primary">{ticker}</span>
                            {quote ? (
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-text-primary">${quote.price.toFixed(2)}</span>
                                <span className={cn(
                                  'text-xs',
                                  quote.changePercent >= 0 ? 'text-green-500' : 'text-red-500'
                                )}>
                                  {quote.changePercent >= 0 && '+'}
                                  {quote.changePercent.toFixed(2)}%
                                </span>
                              </div>
                            ) : (
                              <Skeleton className="h-4 w-16" />
                            )}
                          </Link>
                        )
                      })}
                      {list.tickers.length > 5 && (
                        <p className="text-xs text-text-tertiary text-center pt-2">
                          +{list.tickers.length - 5} more stocks
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} variant="rectangular" className="h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} variant="rectangular" className="h-64" />
          ))}
        </div>
      </main>
    </div>
  )
}
