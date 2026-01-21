'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Star, Trash2, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface Watchlist {
  id: string
  name: string
  tickers: string[]
  created_at: string
}

interface TickerQuote {
  ticker: string
  price: number
  change: number
  changePercent: number
}

interface WatchlistSidebarProps {
  onTickerClick?: (ticker: string) => void
}

export function WatchlistSidebar({ onTickerClick }: WatchlistSidebarProps) {
  const [watchlists, setWatchlists] = useState<Watchlist[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [newTickers, setNewTickers] = useState('')
  const [expandedList, setExpandedList] = useState<string | null>(null)
  const [quotes, setQuotes] = useState<Record<string, TickerQuote>>({})

  const fetchWatchlists = useCallback(async () => {
    try {
      const response = await fetch('/api/watchlists')
      if (response.ok) {
        const data = await response.json()
        setWatchlists(data)
        if (data.length > 0 && !expandedList) {
          setExpandedList(data[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to fetch watchlists:', error)
    } finally {
      setIsLoading(false)
    }
  }, [expandedList])

  useEffect(() => {
    fetchWatchlists()
  }, [fetchWatchlists])

  const createWatchlist = async () => {
    if (!newListName.trim()) return

    const tickers = newTickers
      .split(',')
      .map(t => t.trim().toUpperCase())
      .filter(Boolean)

    try {
      const response = await fetch('/api/watchlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newListName, tickers }),
      })

      if (response.ok) {
        setNewListName('')
        setNewTickers('')
        setIsDialogOpen(false)
        fetchWatchlists()
      }
    } catch (error) {
      console.error('Failed to create watchlist:', error)
    }
  }

  const deleteWatchlist = async (id: string) => {
    try {
      const response = await fetch('/api/watchlists/' + id, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchWatchlists()
      }
    } catch (error) {
      console.error('Failed to delete watchlist:', error)
    }
  }

  const addTickerToList = async (listId: string, ticker: string) => {
    const list = watchlists.find(w => w.id === listId)
    if (!list || list.tickers.includes(ticker.toUpperCase())) return

    try {
      const response = await fetch('/api/watchlists/' + listId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tickers: [...list.tickers, ticker.toUpperCase()],
        }),
      })

      if (response.ok) {
        fetchWatchlists()
      }
    } catch (error) {
      console.error('Failed to add ticker:', error)
    }
  }

  const removeTickerFromList = async (listId: string, ticker: string) => {
    const list = watchlists.find(w => w.id === listId)
    if (!list) return

    try {
      const response = await fetch('/api/watchlists/' + listId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tickers: list.tickers.filter(t => t !== ticker),
        }),
      })

      if (response.ok) {
        fetchWatchlists()
      }
    } catch (error) {
      console.error('Failed to remove ticker:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="h-full p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-background rounded" />
          <div className="h-20 bg-background rounded" />
          <div className="h-20 bg-background rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-accent" />
          <span className="font-medium text-text-primary">Watchlists</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setIsDialogOpen(true)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Watchlists */}
      <div className="flex-1 overflow-auto p-2">
        {watchlists.length === 0 ? (
          <div className="text-center py-8 text-text-tertiary text-sm">
            <Star className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No watchlists yet</p>
            <p className="mt-1">Create one to track stocks</p>
          </div>
        ) : (
          <div className="space-y-1">
            {watchlists.map(list => (
              <div key={list.id} className="rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedList(expandedList === list.id ? null : list.id)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 text-sm',
                    'hover:bg-background transition-colors rounded-lg',
                    expandedList === list.id && 'bg-background'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <ChevronRight
                      className={cn(
                        'h-4 w-4 text-text-tertiary transition-transform',
                        expandedList === list.id && 'rotate-90'
                      )}
                    />
                    <span className="font-medium text-text-primary">{list.name}</span>
                    <span className="text-text-tertiary">({list.tickers.length})</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteWatchlist(list.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 hover:text-error p-1"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </button>

                {expandedList === list.id && list.tickers.length > 0 && (
                  <div className="ml-6 mt-1 space-y-1">
                    {list.tickers.map(ticker => {
                      const quote = quotes[ticker]
                      return (
                        <button
                          key={ticker}
                          onClick={() => onTickerClick?.(ticker)}
                          className={cn(
                            'w-full flex items-center justify-between px-3 py-2 text-sm',
                            'hover:bg-accent-subtle rounded-lg transition-colors'
                          )}
                        >
                          <span className="font-mono text-text-primary">{ticker}</span>
                          {quote && (
                            <span className={cn(
                              'text-xs flex items-center gap-1',
                              quote.change >= 0 ? 'text-success' : 'text-error'
                            )}>
                              {quote.change >= 0 ? (
                                <TrendingUp className="h-3 w-3" />
                              ) : (
                                <TrendingDown className="h-3 w-3" />
                              )}
                              {quote.changePercent.toFixed(2)}%
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Watchlist Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Watchlist</DialogTitle>
            <DialogDescription>
              Create a new watchlist to track your favorite stocks
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-primary">
                Name
              </label>
              <input
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="My Watchlist"
                className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-primary">
                Tickers (optional)
              </label>
              <input
                value={newTickers}
                onChange={(e) => setNewTickers(e.target.value)}
                placeholder="AAPL, MSFT, GOOGL"
                className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              />
              <p className="text-xs text-text-tertiary">
                Separate multiple tickers with commas
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createWatchlist} disabled={!newListName.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
