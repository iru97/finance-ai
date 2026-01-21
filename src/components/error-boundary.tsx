'use client'

import React from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <ErrorFallback
          error={this.state.error}
          onRetry={this.handleRetry}
        />
      )
    }

    return this.props.children
  }
}

interface ErrorFallbackProps {
  error: Error | null
  onRetry?: () => void
  title?: string
  description?: string
}

export function ErrorFallback({
  error,
  onRetry,
  title = 'Something went wrong',
  description,
}: ErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
        <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
      </div>
      <h2 className="mb-2 text-lg font-semibold text-text-primary">{title}</h2>
      <p className="mb-4 max-w-md text-sm text-text-secondary">
        {description || error?.message || 'An unexpected error occurred. Please try again.'}
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="secondary">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try again
        </Button>
      )}
    </div>
  )
}

interface ApiErrorProps {
  error: string | null
  onRetry?: () => void
  className?: string
}

export function ApiError({ error, onRetry, className }: ApiErrorProps) {
  if (!error) return null

  return (
    <div
      className={`flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950 ${className || ''}`}
    >
      <div className="flex items-center gap-3">
        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
        <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
      </div>
      {onRetry && (
        <Button variant="ghost" size="sm" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

// Hook for async error handling with retry
export function useAsyncError() {
  const [error, setError] = React.useState<string | null>(null)
  const [isRetrying, setIsRetrying] = React.useState(false)

  const handleError = React.useCallback((err: unknown) => {
    if (err instanceof Error) {
      setError(err.message)
    } else if (typeof err === 'string') {
      setError(err)
    } else {
      setError('An unexpected error occurred')
    }
  }, [])

  const clearError = React.useCallback(() => {
    setError(null)
  }, [])

  const withRetry = React.useCallback(
    async <T,>(
      fn: () => Promise<T>,
      maxRetries = 3,
      delay = 1000
    ): Promise<T | null> => {
      setIsRetrying(true)
      setError(null)

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const result = await fn()
          setIsRetrying(false)
          return result
        } catch (err) {
          if (attempt === maxRetries) {
            handleError(err)
            setIsRetrying(false)
            return null
          }
          await new Promise((resolve) => setTimeout(resolve, delay * (attempt + 1)))
        }
      }

      setIsRetrying(false)
      return null
    },
    [handleError]
  )

  return {
    error,
    isRetrying,
    handleError,
    clearError,
    withRetry,
  }
}
