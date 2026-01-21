'use client'

import { useState } from 'react'
import { MessageSquare, Plus, Trash2, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Session } from '@/hooks/use-sessions'

interface SessionSidebarProps {
  sessions: Session[]
  currentSessionId?: string
  isLoading: boolean
  onSelectSession: (sessionId: string) => void
  onNewSession: () => void
  onDeleteSession: (sessionId: string) => void
}

export function SessionSidebar({
  sessions,
  currentSessionId,
  isLoading,
  onSelectSession,
  onNewSession,
  onDeleteSession,
}: SessionSidebarProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return diffMins + 'm ago'
    if (diffHours < 24) return diffHours + 'h ago'
    if (diffDays < 7) return diffDays + 'd ago'
    return date.toLocaleDateString()
  }

  if (isLoading) {
    return (
      <div className="w-64 border-r border-border bg-surface p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-10 bg-background rounded-lg" />
          <div className="h-16 bg-background rounded-lg" />
          <div className="h-16 bg-background rounded-lg" />
          <div className="h-16 bg-background rounded-lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="w-64 border-r border-border bg-surface flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-border">
        <Button
          onClick={onNewSession}
          className="w-full justify-start gap-2"
          variant="secondary"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-auto p-2">
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-text-tertiary text-sm">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No conversations yet</p>
            <p className="mt-1">Start a new chat</p>
          </div>
        ) : (
          <div className="space-y-1">
            {sessions.map(session => (
              <div
                key={session.id}
                className="relative group"
                onMouseEnter={() => setHoveredId(session.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <button
                  onClick={() => onSelectSession(session.id)}
                  className={cn(
                    'w-full text-left px-3 py-2.5 rounded-lg transition-colors',
                    'hover:bg-background',
                    currentSessionId === session.id && 'bg-accent-subtle border border-accent/20'
                  )}
                >
                  <div className="flex items-start gap-2">
                    <MessageSquare className="h-4 w-4 mt-0.5 text-text-tertiary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-sm truncate',
                        currentSessionId === session.id ? 'text-accent font-medium' : 'text-text-primary'
                      )}>
                        {session.preview}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-3 w-3 text-text-tertiary" />
                        <span className="text-xs text-text-tertiary">
                          {formatDate(session.updated_at)}
                        </span>
                        <span className="text-xs text-text-tertiary">
                          {session.messageCount} msgs
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
                {hoveredId === session.id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteSession(session.id)
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-error/10 text-text-tertiary hover:text-error transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
