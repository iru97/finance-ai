import { cn } from '@/lib/utils'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <svg
      className={cn(
        'animate-spin text-accent',
        sizeClasses[size],
        className
      )}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

interface LoadingOverlayProps {
  message?: string
  className?: string
}

export function LoadingOverlay({
  message = 'Loading...',
  className,
}: LoadingOverlayProps) {
  return (
    <div
      className={cn(
        'absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm',
        className
      )}
    >
      <Spinner size="lg" />
      <p className="mt-4 text-sm text-text-secondary">{message}</p>
    </div>
  )
}

interface LoadingButtonProps {
  isLoading: boolean
  children: React.ReactNode
  loadingText?: string
  className?: string
}

export function LoadingContent({
  isLoading,
  children,
  loadingText = 'Loading...',
}: LoadingButtonProps) {
  if (isLoading) {
    return (
      <span className="flex items-center gap-2">
        <Spinner size="sm" />
        {loadingText}
      </span>
    )
  }
  return <>{children}</>
}
