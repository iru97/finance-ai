'use client'

import { ToasterProvider } from '@/components/ui/toaster'
import { ErrorBoundary } from '@/components/error-boundary'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ErrorBoundary>
      <ToasterProvider>
        {children}
      </ToasterProvider>
    </ErrorBoundary>
  )
}
