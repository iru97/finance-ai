'use client'

import { ToasterProvider } from '@/components/ui/toaster'
import { ErrorBoundary } from '@/components/error-boundary'
import { useThemeProvider, ThemeContext } from '@/hooks/use-theme'

interface ProvidersProps {
  children: React.ReactNode
}

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const themeValue = useThemeProvider()

  // Prevent flash of unstyled content
  if (!themeValue.mounted) {
    return <div style={{ visibility: 'hidden' }}>{children}</div>
  }

  return (
    <ThemeContext.Provider value={{
      theme: themeValue.theme,
      resolvedTheme: themeValue.resolvedTheme,
      setTheme: themeValue.setTheme,
      toggleTheme: themeValue.toggleTheme,
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToasterProvider>
          {children}
        </ToasterProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
