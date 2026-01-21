'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Search,
  Clock,
  TrendingUp,
  MessageSquare,
  BarChart3,
  Trash2,
  ArrowLeft,
  Filter,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { cn } from '@/lib/utils'

interface HistoryViewProps {
  userId: string
  userEmail: string
}

interface QueryEntry {
  id: string
  query: string
  queryType: string
  tickers: string[]
  timestamp: string
}

interface UserStats {
  totalQueries: number
  queriesLast24h: number
  queriesLast7d: number
  totalTokens: number
  averageResponseTime: number
  topTickers: Array<{ ticker: string; count: number }>
}

type QueryTypeFilter = 'all' | 'simple' | 'research' | 'complex'

export function HistoryView({ userId, userEmail }: HistoryViewProps) {
  const [queries, setQueries] = useState<QueryEntry[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<QueryTypeFilter>('all')

  const fetchHistory = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/query-log?stats=true&limit=100')
      if (response.ok) {
        const data = await response.json()
        setQueries(data.queries)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch history:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  const filteredQueries = queries.filter((q) => {
    const matchesSearch =
      searchTerm === '' ||
      q.query.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.tickers.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesType =
      typeFilter === 'all' || q.queryType.toLowerCase() === typeFilter

    return matchesSearch && matchesType
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const getQueryTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'simple':
        return <MessageSquare className="h-4 w-4" />
      case 'research':
        return <Search className="h-4 w-4" />
      case 'complex':
        return <BarChart3 className="h-4 w-4" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  const getQueryTypeBadgeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'simple':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      case 'research':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      case 'complex':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
    }
  }

  if (isLoading) {
    return <HistorySkeleton />
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-surface">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/chat" className="text-text-secondary hover:text-text-primary">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Query History</h1>
              <p className="text-sm text-text-secondary">Your past research queries</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/chat">
              <Button>
                <MessageSquare className="h-4 w-4 mr-2" />
                New Query
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-secondary">Total Queries</p>
                    <p className="text-2xl font-bold text-text-primary">{stats.totalQueries}</p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-accent" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-secondary">Last 24h</p>
                    <p className="text-2xl font-bold text-text-primary">{stats.queriesLast24h}</p>
                  </div>
                  <Clock className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-secondary">Avg Response</p>
                    <p className="text-2xl font-bold text-text-primary">
                      {stats.averageResponseTime > 0
                        ? `${(stats.averageResponseTime / 1000).toFixed(1)}s`
                        : 'N/A'}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-secondary">Tokens Used</p>
                    <p className="text-2xl font-bold text-text-primary">
                      {stats.totalTokens.toLocaleString()}
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Top Tickers */}
        {stats && stats.topTickers.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Most Researched Stocks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {stats.topTickers.map(({ ticker, count }) => (
                  <Link
                    key={ticker}
                    href={`/research/${ticker}`}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-subtle hover:bg-accent/20 transition-colors"
                  >
                    <span className="font-mono text-sm font-medium text-accent">{ticker}</span>
                    <span className="text-xs text-text-tertiary">{count}</span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search queries or tickers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-lg border border-border bg-background text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'simple', 'research', 'complex'] as QueryTypeFilter[]).map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  typeFilter === type
                    ? 'bg-accent text-white'
                    : 'bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                )}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Query List */}
        {filteredQueries.length === 0 ? (
          <Card className="p-8 text-center">
            <Clock className="h-12 w-12 mx-auto mb-4 text-text-tertiary" />
            <h3 className="text-lg font-medium text-text-primary mb-2">
              {queries.length === 0 ? 'No queries yet' : 'No matching queries'}
            </h3>
            <p className="text-text-secondary mb-4">
              {queries.length === 0
                ? 'Start asking questions to see your history here'
                : 'Try adjusting your search or filter'}
            </p>
            <Link href="/chat">
              <Button>Start Researching</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredQueries.map((entry) => (
              <Card key={entry.id} className="hover:border-accent/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={cn(
                            'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                            getQueryTypeBadgeColor(entry.queryType)
                          )}
                        >
                          {getQueryTypeIcon(entry.queryType)}
                          {entry.queryType}
                        </span>
                        <span className="text-xs text-text-tertiary">
                          {formatDate(entry.timestamp)}
                        </span>
                      </div>
                      <p className="text-text-primary truncate">{entry.query}</p>
                      {entry.tickers.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {entry.tickers.map((ticker) => (
                            <Link
                              key={ticker}
                              href={`/research/${ticker}`}
                              className="px-2 py-0.5 rounded bg-surface-hover text-xs font-mono text-accent hover:bg-accent/20"
                            >
                              {ticker}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function HistorySkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-40 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} variant="rectangular" className="h-24" />
          ))}
        </div>
        <Skeleton className="h-10 w-full mb-6" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} variant="rectangular" className="h-20" />
          ))}
        </div>
      </main>
    </div>
  )
}
