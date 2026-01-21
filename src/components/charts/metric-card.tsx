'use client'

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  label: string
  value: string | number
  change?: number
  changeLabel?: string
  prefix?: string
  suffix?: string
  className?: string
}

export function MetricCard({
  label,
  value,
  change,
  changeLabel,
  prefix = '',
  suffix = '',
  className,
}: MetricCardProps) {
  const trend = change !== undefined ? (change > 0 ? 'up' : change < 0 ? 'down' : 'neutral') : null

  return (
    <div className={cn(
      'rounded-xl border border-border bg-surface p-4',
      className
    )}>
      <p className="text-sm text-text-secondary">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-text-primary">
        {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
      </p>
      {change !== undefined && (
        <div className={cn(
          'mt-2 flex items-center gap-1 text-sm',
          trend === 'up' && 'text-green-600 dark:text-green-400',
          trend === 'down' && 'text-red-600 dark:text-red-400',
          trend === 'neutral' && 'text-text-tertiary'
        )}>
          {trend === 'up' && <TrendingUp className="h-4 w-4" />}
          {trend === 'down' && <TrendingDown className="h-4 w-4" />}
          {trend === 'neutral' && <Minus className="h-4 w-4" />}
          <span>
            {change > 0 && '+'}{change.toFixed(2)}%
          </span>
          {changeLabel && (
            <span className="text-text-tertiary ml-1">{changeLabel}</span>
          )}
        </div>
      )}
    </div>
  )
}

interface MetricGridProps {
  metrics: MetricCardProps[]
  columns?: 2 | 3 | 4
}

export function MetricGrid({ metrics, columns = 3 }: MetricGridProps) {
  return (
    <div className={cn(
      'grid gap-4',
      columns === 2 && 'grid-cols-1 sm:grid-cols-2',
      columns === 3 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
      columns === 4 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
    )}>
      {metrics.map((metric, i) => (
        <MetricCard key={i} {...metric} />
      ))}
    </div>
  )
}
