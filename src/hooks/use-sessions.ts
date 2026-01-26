'use client'

import { useState, useEffect, useCallback } from 'react'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export interface Session {
  id: string
  created_at: string
  updated_at: string
  preview: string
  messageCount: number
}

export interface SessionDetail {
  id: string
  user_id: string
  messages: Message[]
  context: Record<string, unknown>
  created_at: string
  updated_at: string
}

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [currentSession, setCurrentSession] = useState<SessionDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchSessions = useCallback(async () => {
    try {
      const response = await fetch('/api/sessions')
      if (response.ok) {
        const data = await response.json()
        setSessions(data)
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadSession = useCallback(async (sessionId: string) => {
    try {
      const response = await fetch('/api/sessions/' + sessionId)
      if (response.ok) {
        const data = await response.json()
        setCurrentSession(data)
        return data
      }
    } catch (error) {
      console.error('Failed to load session:', error)
    }
    return null
  }, [])

  const createSession = useCallback(async (messages: Message[] = []) => {
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      })
      if (response.ok) {
        const data = await response.json()
        setCurrentSession(data)
        fetchSessions()
        return data
      }
    } catch (error) {
      console.error('Failed to create session:', error)
    }
    return null
  }, [fetchSessions])

  const updateSession = useCallback(async (sessionId: string, messages: Message[]) => {
    try {
      const response = await fetch('/api/sessions/' + sessionId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      })
      if (response.ok) {
        const data = await response.json()
        setCurrentSession(data)
        fetchSessions()
        return data
      }
    } catch (error) {
      console.error('Failed to update session:', error)
    }
    return null
  }, [fetchSessions])

  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      const response = await fetch('/api/sessions/' + sessionId, {
        method: 'DELETE',
      })
      if (response.ok) {
        if (currentSession?.id === sessionId) {
          setCurrentSession(null)
        }
        fetchSessions()
        return true
      }
    } catch (error) {
      console.error('Failed to delete session:', error)
    }
    return false
  }, [currentSession, fetchSessions])

  const startNewSession = useCallback(() => {
    setCurrentSession(null)
  }, [])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  return {
    sessions,
    currentSession,
    isLoading,
    loadSession,
    createSession,
    updateSession,
    deleteSession,
    startNewSession,
    refreshSessions: fetchSessions,
  }
}
