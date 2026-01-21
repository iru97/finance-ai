'use client'

import { useRef, useEffect, useState, FormEvent, useCallback } from 'react'
import { Send, User, Bot, LogOut, Sparkles, TrendingUp, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useToaster } from '@/components/ui/toaster'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface ChatInterfaceProps {
  userId: string
  userEmail: string
  messages?: Message[]
  onMessagesChange?: (messages: Message[]) => void
}

const EXAMPLE_QUERIES = [
  { icon: TrendingUp, text: "What's Apple's current P/E ratio?" },
  { icon: BarChart3, text: "Analyze Tesla's recent earnings" },
  { icon: Sparkles, text: "Compare MSFT and GOOGL revenue" },
]

export function ChatInterface({
  userId,
  userEmail,
  messages: externalMessages,
  onMessagesChange,
}: ChatInterfaceProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [input, setInput] = useState('')
  const [internalMessages, setInternalMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const toaster = useToaster()

  // Use external messages if provided, otherwise use internal state
  const messages = externalMessages ?? internalMessages
  const setMessages = useCallback((updater: Message[] | ((prev: Message[]) => Message[])) => {
    const newMessages = typeof updater === 'function' ? updater(messages) : updater
    if (onMessagesChange) {
      onMessagesChange(newMessages)
    } else {
      setInternalMessages(newMessages)
    }
  }, [messages, onMessagesChange])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      if (!response.ok) throw new Error('Failed to send message')

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantContent = ''
      const assistantId = (Date.now() + 1).toString()
      const assistantMessage: Message = { id: assistantId, role: 'assistant', content: '' }

      setMessages([...updatedMessages, assistantMessage])

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break

        assistantContent += decoder.decode(value, { stream: true })
        setMessages([
          ...updatedMessages,
          { ...assistantMessage, content: assistantContent }
        ])
      }
    } catch (error) {
      console.error('Chat error:', error)
      toaster.error('Failed to send message. Please try again.')
      setMessages([
        ...updatedMessages,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Sorry, there was an error processing your request. Please try again.',
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, messages, setMessages, toaster])

  const handleExampleClick = (query: string) => {
    setInput(query)
    inputRef.current?.focus()
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-text-primary">Finance AI</h1>
            <p className="text-xs text-text-tertiary">Research Assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-secondary hidden sm:block">{userEmail}</span>
          <ThemeToggle />
          <form action="/api/auth/signout" method="POST">
            <Button variant="ghost" size="icon" type="submit">
              <LogOut className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <ScrollArea className="flex-1" ref={scrollRef}>
          <div className="mx-auto max-w-3xl px-4 py-6">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-subtle">
                  <Bot className="h-8 w-8 text-accent" />
                </div>
                <h2 className="text-2xl font-semibold text-text-primary">
                  How can I help you today?
                </h2>
                <p className="mt-2 max-w-md text-text-secondary">
                  Ask me anything about stocks, financial metrics, or market analysis.
                </p>

                {/* Example Queries */}
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  {EXAMPLE_QUERIES.map((query, i) => (
                    <button
                      key={i}
                      onClick={() => handleExampleClick(query.text)}
                      className={cn(
                        'flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5',
                        'text-sm text-text-secondary hover:text-text-primary',
                        'hover:border-accent/50 hover:bg-accent-subtle/50',
                        'transition-all duration-150'
                      )}
                    >
                      <query.icon className="h-4 w-4" />
                      {query.text}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      'flex gap-4 animate-slide-up',
                      message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                    )}
                  >
                    <Avatar size="sm" className="mt-1 shrink-0">
                      <AvatarFallback>
                        {message.role === 'user' ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Bot className="h-4 w-4" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={cn(
                        'max-w-[85%] rounded-2xl px-4 py-3',
                        message.role === 'user'
                          ? 'bg-accent text-white'
                          : 'bg-surface border border-border'
                      )}
                    >
                      <p className={cn(
                        'whitespace-pre-wrap text-sm leading-relaxed',
                        message.role === 'assistant' && 'text-text-primary'
                      )}>
                        {message.content}
                      </p>
                    </div>
                  </div>
                ))}

                {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                  <div className="flex gap-4 animate-slide-up">
                    <Avatar size="sm" className="mt-1 shrink-0">
                      <AvatarFallback>
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex items-center gap-1.5 rounded-2xl bg-surface border border-border px-4 py-3">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-accent [animation-delay:-0.3s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-accent [animation-delay:-0.15s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-accent" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-border bg-surface p-4">
          <form onSubmit={handleSubmit} className="mx-auto flex max-w-3xl gap-3">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about any stock or financial topic..."
                disabled={isLoading}
                className={cn(
                  'w-full h-12 rounded-xl border border-border bg-background px-4 pr-12',
                  'text-sm text-text-primary placeholder:text-text-tertiary',
                  'focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'transition-all duration-150'
                )}
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              size="lg"
              className="h-12 w-12 rounded-xl"
            >
              <Send className="h-5 w-5" />
            </Button>
          </form>
          <p className="mt-2 text-center text-xs text-text-tertiary">
            Finance AI can make mistakes. Verify important information.
          </p>
        </div>
      </div>
    </div>
  )
}
