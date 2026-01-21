'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, TrendingUp, TrendingDown, Plus, MessageSquare, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { MetricCard, MetricGrid } from '@/components/charts'
import { Sparkline } from '@/components/charts/sparkline'
import { LineChart } from '@/components/charts/line-chart'
import { Skeleton } from '@/components/ui/skeleton'
import { Disclaimer } from '@/components/ui/disclaimer'
import { useToaster } from '@/components/ui/toaster'
import { cn } from '@/lib/utils'

interface StockDetailViewProps {
  ticker: string
  userId: string
}

interface StockData {
  quote: {
    price: number
    change: number
    changePercent: number
    high: number
    low: number
    open: number
    previousClose: number
    volume: number
  }
  profile: {
    name: string
    exchange: string
    sector: string
    industry: string
    description: string
    marketCap: number
    employees: number
    website: string
  }
  financials: {
    peRatio: number
    eps: number
    revenue: number
    revenueGrowth: number
    profitMargin: number
    debtToEquity: number
  }
  historicalPrices: { label: string; value: number }[]
}

const TIME_RANGES = ['1D', '1W', '1M', '3M', '1Y', '5Y'] as const
type TimeRange = (typeof TIME_RANGES)[number]

export function StockDetailView({ ticker, userId }: StockDetailViewProps) {
  const [data, setData] = useState<StockData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<TimeRange>('1M')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const toaster = useToaster()

  const fetchData = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true)
    else setIsLoading(true)

    try {
      const response = await fetch(`/api/stocks/${ticker}?range=${timeRange}`)
      if (!response.ok) {
        throw new Error('Failed to fetch stock data')
      }
      const result = await response.json()
      setData(result)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      if (showRefresh) toaster.error('Failed to refresh data')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [ticker, timeRange])

  const handleRefresh = () => fetchData(true)

  if (isLoading) {
    return <StockDetailSkeleton />
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <Link href="/chat" className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back to Chat
          </Link>
          <Card className="p-8 text-center">
            <h2 className="text-lg font-semibold text-text-primary mb-2">Unable to load stock data</h2>
            <p className="text-text-secondary mb-4">{error || 'Stock data not available'}</p>
            <Button onClick={() => fetchData()}>Try Again</Button>
          </Card>
        </div>
      </div>
    )
  }

  const { quote, profile, financials, historicalPrices } = data
  const isPositive = quote.change >= 0

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/chat" className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary">
            <ArrowLeft className="h-4 w-4" />
            Back to Chat
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={cn('h-4 w-4 mr-2', isRefreshing && 'animate-spin')} />
              Refresh
            </Button>
            <Button variant="secondary" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add to Watchlist
            </Button>
            <Link href={`/chat?ticker=${ticker}`}>
              <Button size="sm">
                <MessageSquare className="h-4 w-4 mr-2" />
                Ask About {ticker}
              </Button>
            </Link>
          </div>
        </div>

        {/* Stock Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-text-primary">{ticker}</h1>
                <span className="px-2 py-1 text-xs font-medium bg-surface rounded border border-border">
                  {profile.exchange}
                </span>
              </div>
              <p className="text-lg text-text-secondary mt-1">{profile.name}</p>
              <p className="text-sm text-text-tertiary">{profile.sector} • {profile.industry}</p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-text-primary">${quote.price.toFixed(2)}</p>
              <div className={cn(
                'flex items-center justify-end gap-1 text-lg font-medium mt-1',
                isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              )}>
                {isPositive ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                <span>{isPositive && '+'}{quote.change.toFixed(2)} ({quote.changePercent.toFixed(2)}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Price Chart */}
        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Price History</CardTitle>
            <div className="flex gap-1">
              {TIME_RANGES.map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={cn(
                    'px-3 py-1.5 text-sm rounded-md transition-colors',
                    timeRange === range
                      ? 'bg-accent text-white'
                      : 'text-text-secondary hover:bg-surface-hover'
                  )}
                >
                  {range}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <LineChart
              data={historicalPrices}
              height={300}
              showGrid
              showDots
              showTooltip
              areaFill
              color={isPositive ? 'rgb(34 197 94)' : 'rgb(239 68 68)'}
            />
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <h2 className="text-xl font-semibold text-text-primary mb-4">Key Metrics</h2>
        <MetricGrid
          columns={4}
          metrics={[
            { label: 'P/E Ratio', value: financials.peRatio.toFixed(2) },
            { label: 'EPS', value: financials.eps.toFixed(2), prefix: '$' },
            { label: 'Market Cap', value: formatLargeNumber(profile.marketCap) },
            { label: 'Revenue', value: formatLargeNumber(financials.revenue), change: financials.revenueGrowth },
          ]}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Trading Data */}
          <Card>
            <CardHeader>
              <CardTitle>Trading Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-text-secondary">Open</span>
                <span className="text-text-primary font-medium">${quote.open.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Previous Close</span>
                <span className="text-text-primary font-medium">${quote.previousClose.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Day High</span>
                <span className="text-text-primary font-medium">${quote.high.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Day Low</span>
                <span className="text-text-primary font-medium">${quote.low.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Volume</span>
                <span className="text-text-primary font-medium">{quote.volume.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          {/* Fundamentals */}
          <Card>
            <CardHeader>
              <CardTitle>Fundamentals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-text-secondary">Profit Margin</span>
                <span className="text-text-primary font-medium">{(financials.profitMargin * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Revenue Growth</span>
                <span className={cn(
                  'font-medium',
                  financials.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                )}>
                  {financials.revenueGrowth >= 0 && '+'}{(financials.revenueGrowth * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Debt to Equity</span>
                <span className="text-text-primary font-medium">{financials.debtToEquity.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Employees</span>
                <span className="text-text-primary font-medium">{profile.employees.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Company Description */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>About {profile.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-text-secondary leading-relaxed">{profile.description}</p>
            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-4 text-accent hover:underline"
              >
                Visit Website →
              </a>
            )}
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <div className="mt-8">
          <Disclaimer variant="banner" />
        </div>
      </div>
    </div>
  )
}

function StockDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Skeleton className="h-6 w-32 mb-6" />
        <div className="flex justify-between mb-8">
          <div>
            <Skeleton className="h-10 w-24 mb-2" />
            <Skeleton className="h-6 w-48 mb-1" />
            <Skeleton className="h-4 w-36" />
          </div>
          <div className="text-right">
            <Skeleton className="h-12 w-32 mb-2 ml-auto" />
            <Skeleton className="h-6 w-24 ml-auto" />
          </div>
        </div>
        <Skeleton variant="rectangular" className="h-[350px] w-full mb-8" />
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} variant="rectangular" className="h-24" />
          ))}
        </div>
      </div>
    </div>
  )
}

function formatLargeNumber(num: number): string {
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`
  return `$${num.toLocaleString()}`
}
