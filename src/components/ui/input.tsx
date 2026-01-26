'use client'

import * as React from 'react'
import * as LabelPrimitive from '@radix-ui/react-label'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, id, ...props }, ref) => {
    const inputId = id || React.useId()

    return (
      <div className="w-full">
        {label && (
          <LabelPrimitive.Root
            htmlFor={inputId}
            className="block text-sm font-medium text-text-primary mb-1.5"
          >
            {label}
          </LabelPrimitive.Root>
        )}
        <input
          type={type}
          id={inputId}
          className={cn(
            'flex h-10 w-full rounded-lg border bg-surface px-3 py-2 text-sm',
            'text-text-primary placeholder:text-text-tertiary',
            'transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-background',
            error ? 'border-error focus:ring-error' : 'border-border',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-error">{error}</p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input }
