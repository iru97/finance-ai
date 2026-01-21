'use client'

import * as React from 'react'
import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastIcon,
} from './toast'
import type { ToastMessage } from '@/hooks/use-toast'

interface ToasterContextValue {
  toast: (message: Omit<ToastMessage, 'id'>) => string
  success: (description: string, title?: string) => string
  error: (description: string, title?: string) => string
  warning: (description: string, title?: string) => string
  info: (description: string, title?: string) => string
  dismiss: (id: string) => void
}

const ToasterContext = React.createContext<ToasterContextValue | null>(null)

export function useToaster() {
  const context = React.useContext(ToasterContext)
  if (!context) {
    throw new Error('useToaster must be used within a ToasterProvider')
  }
  return context
}

export function ToasterProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([])

  const toast = React.useCallback((message: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast: ToastMessage = { id, ...message }
    setToasts((prev) => [...prev, newToast])
    return id
  }, [])

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const success = React.useCallback(
    (description: string, title?: string) =>
      toast({ description, title, variant: 'success', duration: 5000 }),
    [toast]
  )

  const error = React.useCallback(
    (description: string, title?: string) =>
      toast({ description, title, variant: 'error', duration: 7000 }),
    [toast]
  )

  const warning = React.useCallback(
    (description: string, title?: string) =>
      toast({ description, title, variant: 'warning', duration: 6000 }),
    [toast]
  )

  const info = React.useCallback(
    (description: string, title?: string) =>
      toast({ description, title, variant: 'info', duration: 5000 }),
    [toast]
  )

  const contextValue = React.useMemo(
    () => ({ toast, success, error, warning, info, dismiss }),
    [toast, success, error, warning, info, dismiss]
  )

  return (
    <ToasterContext.Provider value={contextValue}>
      <ToastProvider swipeDirection="right">
        {children}
        {toasts.map((t) => (
          <Toast
            key={t.id}
            variant={t.variant}
            duration={t.duration}
            onOpenChange={(open) => {
              if (!open) dismiss(t.id)
            }}
          >
            <div className="flex items-start gap-3">
              <ToastIcon variant={t.variant} />
              <div className="flex-1">
                {t.title && <ToastTitle>{t.title}</ToastTitle>}
                <ToastDescription>{t.description}</ToastDescription>
              </div>
            </div>
            <ToastClose />
          </Toast>
        ))}
        <ToastViewport />
      </ToastProvider>
    </ToasterContext.Provider>
  )
}
