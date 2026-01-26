'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'

    return (
      <Comp
        className={cn(
          // Base styles
          'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 cursor-pointer',
          'disabled:pointer-events-none disabled:opacity-50',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
          // Variants
          variant === 'primary' && 'bg-accent text-white hover:bg-accent-hover active:scale-[0.98]',
          variant === 'secondary' && 'bg-surface border border-border text-text-primary hover:bg-background active:scale-[0.98]',
          variant === 'ghost' && 'bg-transparent text-text-secondary hover:bg-surface hover:text-text-primary',
          variant === 'danger' && 'bg-error text-white hover:opacity-90 active:scale-[0.98]',
          // Sizes
          size === 'sm' && 'h-8 px-3 text-sm rounded-md',
          size === 'md' && 'h-10 px-4 text-sm rounded-lg',
          size === 'lg' && 'h-12 px-6 text-base rounded-lg',
          size === 'icon' && 'h-10 w-10 rounded-lg',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button }
