'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'

interface BarChartData {
  label: string
  value: number
  color?: string
}

interface BarChartProps {
  data: BarChartData[]
  height?: number
  showLabels?: boolean
  showValues?: boolean
  horizontal?: boolean
  className?: string
}

export function BarChart({
  data,
  height = 200,
  showLabels = true,
  showValues = true,
  horizontal = false,
  className,
}: BarChartProps) {
  const { maxValue, bars } = useMemo(() => {
    const max = Math.max(...data.map(d => Math.abs(d.value)), 0)
    const computed = data.map((d, i) => ({
      ...d,
      percentage: max > 0 ? (Math.abs(d.value) / max) * 100 : 0,
      color: d.color || `hsl(${(i * 360) / data.length}, 70%, 55%)`,
    }))
    return { maxValue: max, bars: computed }
  }, [data])

  if (horizontal) {
    return (
      <div className={cn('space-y-3', className)}>
        {bars.map((bar, i) => (
          <div key={i} className="space-y-1">
            {showLabels && (
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">{bar.label}</span>
                {showValues && (
                  <span className="font-medium text-text-primary">
                    {bar.value.toLocaleString()}
                  </span>
                )}
              </div>
            )}
            <div className="h-6 w-full rounded-md bg-gray-100 dark:bg-gray-800 overflow-hidden">
              <div
                className="h-full rounded-md transition-all duration-500"
                style={{
                  width: `${bar.percentage}%`,
                  backgroundColor: bar.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    )
  }

  const barWidth = Math.max(20, Math.min(60, (100 / data.length) - 10))
  const gap = (100 - barWidth * data.length) / (data.length + 1)

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <div className="relative h-full flex items-end justify-around">
        {bars.map((bar, i) => (
          <div
            key={i}
            className="flex flex-col items-center"
            style={{ width: `${barWidth}%` }}
          >
            {showValues && (
              <span className="mb-1 text-xs font-medium text-text-primary">
                {bar.value.toLocaleString()}
              </span>
            )}
            <div
              className="w-full rounded-t-md transition-all duration-500"
              style={{
                height: `${bar.percentage}%`,
                backgroundColor: bar.color,
                minHeight: bar.value > 0 ? 4 : 0,
              }}
            />
            {showLabels && (
              <span className="mt-2 text-xs text-text-secondary text-center truncate w-full">
                {bar.label}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

interface ComparisonBarProps {
  label: string
  value1: number
  value2: number
  label1?: string
  label2?: string
  color1?: string
  color2?: string
}

export function ComparisonBar({
  label,
  value1,
  value2,
  label1 = 'Value 1',
  label2 = 'Value 2',
  color1 = 'rgb(var(--accent))',
  color2 = 'rgb(59 130 246)',
}: ComparisonBarProps) {
  const max = Math.max(value1, value2)
  const pct1 = max > 0 ? (value1 / max) * 100 : 0
  const pct2 = max > 0 ? (value2 / max) * 100 : 0

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-text-primary font-medium">{label}</span>
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="h-5 flex-1 rounded-md bg-gray-100 dark:bg-gray-800 overflow-hidden">
            <div
              className="h-full rounded-md transition-all duration-500"
              style={{ width: `${pct1}%`, backgroundColor: color1 }}
            />
          </div>
          <span className="text-xs text-text-secondary w-20 text-right">
            {label1}: {value1.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-5 flex-1 rounded-md bg-gray-100 dark:bg-gray-800 overflow-hidden">
            <div
              className="h-full rounded-md transition-all duration-500"
              style={{ width: `${pct2}%`, backgroundColor: color2 }}
            />
          </div>
          <span className="text-xs text-text-secondary w-20 text-right">
            {label2}: {value2.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  )
}
