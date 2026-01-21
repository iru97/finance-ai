'use client'

import { useState, useCallback, useEffect } from 'react'
import { useSessions, type Message } from '@/hooks/use-sessions'
import { SessionSidebar } from './session-sidebar'
import { ChatInterface } from './chat-interface'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useToaster } from '@/components/ui/toaster'

interface ChatContainerProps {
  userId: string
  userEmail: string
}

export function ChatContainer({ userId, userEmail }: ChatContainerProps) {
  const {
    sessions,
    currentSession,
    isLoading,
    loadSession,
    createSession,
    updateSession,
    deleteSession,
    startNewSession,
  } = useSessions()
  const toaster = useToaster()

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])

  // Sync messages with current session
  useEffect(() => {
    if (currentSession) {
      setMessages(currentSession.messages || [])
    } else {
      setMessages([])
    }
  }, [currentSession])

  const handleSelectSession = useCallback(async (sessionId: string) => {
    const result = await loadSession(sessionId)
    if (!result) {
      toaster.error('Failed to load conversation')
    }
  }, [loadSession, toaster])

  const handleNewSession = useCallback(() => {
    startNewSession()
    setMessages([])
  }, [startNewSession])

  const handleDeleteSession = useCallback(async (sessionId: string) => {
    const success = await deleteSession(sessionId)
    if (success) {
      toaster.success('Conversation deleted')
    } else {
      toaster.error('Failed to delete conversation')
    }
  }, [deleteSession, toaster])

  const handleMessagesChange = useCallback(async (newMessages: Message[]) => {
    setMessages(newMessages)

    // Auto-save to session
    if (currentSession) {
      const result = await updateSession(currentSession.id, newMessages)
      if (!result) {
        toaster.warning('Failed to save conversation')
      }
    } else if (newMessages.length > 0) {
      // Create new session on first message
      const result = await createSession(newMessages)
      if (!result) {
        toaster.warning('Failed to create conversation')
      }
    }
  }, [currentSession, createSession, updateSession, toaster])

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile sidebar toggle */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'fixed top-4 left-4 z-50 md:hidden',
          sidebarOpen && 'hidden'
        )}
        onClick={() => setSidebarOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Sidebar */}
      <div className={cn(
        'fixed inset-y-0 left-0 z-40 md:relative md:flex',
        'transition-transform duration-200',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:hidden'
      )}>
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        <div className="relative z-10 flex">
          <SessionSidebar
            sessions={sessions}
            currentSessionId={currentSession?.id}
            isLoading={isLoading}
            onSelectSession={handleSelectSession}
            onNewSession={handleNewSession}
            onDeleteSession={handleDeleteSession}
          />
          
          {/* Mobile close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 md:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="flex-1 flex flex-col min-w-0">
        <ChatInterface
          userId={userId}
          userEmail={userEmail}
          messages={messages}
          onMessagesChange={handleMessagesChange}
        />
      </div>
    </div>
  )
}
