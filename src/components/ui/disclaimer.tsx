'use client'

import { AlertTriangle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DisclaimerProps {
  variant?: 'inline' | 'banner' | 'footer'
  className?: string
}

const DISCLAIMER_TEXT = {
  short: 'This is not financial advice. Data may be delayed.',
  standard: 'This is not financial advice. Past performance does not guarantee future results. Always do your own research and consult a qualified financial advisor before making investment decisions.',
  full: 'The information provided by Finance AI is for general informational purposes only. All information is provided in good faith, however we make no representation or warranty of any kind regarding the accuracy, adequacy, validity, reliability, or completeness of any information. This is not financial advice. Past performance does not guarantee future results. Always consult a qualified financial advisor before making investment decisions.',
}

export function Disclaimer({ variant = 'inline', className }: DisclaimerProps) {
  if (variant === 'footer') {
    return (
      <footer className={cn(
        'border-t border-border bg-surface px-6 py-4',
        className
      )}>
        <p className="text-xs text-text-tertiary text-center max-w-3xl mx-auto">
          {DISCLAIMER_TEXT.full}
        </p>
      </footer>
    )
  }

  if (variant === 'banner') {
    return (
      <div className={cn(
        'flex items-center gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4',
        'dark:border-yellow-800 dark:bg-yellow-950',
        className
      )}>
        <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0" />
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          {DISCLAIMER_TEXT.standard}
        </p>
      </div>
    )
  }

  // Inline variant
  return (
    <div className={cn(
      'flex items-start gap-2 text-xs text-text-tertiary',
      className
    )}>
      <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
      <p>{DISCLAIMER_TEXT.short}</p>
    </div>
  )
}

interface ResponseDisclaimerProps {
  className?: string
}

export function ResponseDisclaimer({ className }: ResponseDisclaimerProps) {
  return (
    <div className={cn(
      'mt-4 pt-4 border-t border-border/50',
      className
    )}>
      <p className="text-xs text-text-tertiary italic">
        {DISCLAIMER_TEXT.short}
      </p>
    </div>
  )
}
