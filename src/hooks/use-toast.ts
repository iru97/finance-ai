'use client'

import { useState, useCallback } from 'react'
import type { ToastVariant } from '@/components/ui/toast'

export interface ToastMessage {
  id: string
  title?: string
  description: string
  variant: ToastVariant
  duration?: number
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const toast = useCallback(({
    title,
    description,
    variant = 'default',
    duration = 5000,
  }: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast: ToastMessage = { id, title, description, variant, duration }

    setToasts((prev) => [...prev, newToast])

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, duration)
    }

    return id
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const dismissAll = useCallback(() => {
    setToasts([])
  }, [])

  return {
    toasts,
    toast,
    dismiss,
    dismissAll,
    // Convenience methods
    success: (description: string, title?: string) =>
      toast({ description, title, variant: 'success' }),
    error: (description: string, title?: string) =>
      toast({ description, title, variant: 'error' }),
    warning: (description: string, title?: string) =>
      toast({ description, title, variant: 'warning' }),
    info: (description: string, title?: string) =>
      toast({ description, title, variant: 'info' }),
  }
}
