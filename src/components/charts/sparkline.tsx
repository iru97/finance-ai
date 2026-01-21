'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'

interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  strokeWidth?: number
  color?: 'accent' | 'success' | 'error' | 'auto'
  showArea?: boolean
  className?: string
}

export function Sparkline({
  data,
  width = 100,
  height = 32,
  strokeWidth = 1.5,
  color = 'auto',
  showArea = false,
  className,
}: SparklineProps) {
  const { path, areaPath, strokeColor, fillColor } = useMemo(() => {
    if (data.length < 2) return { path: '', areaPath: '', strokeColor: '', fillColor: '' }

    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1
    const padding = 2

    // Normalize data points
    const points = data.map((value, i) => ({
      x: padding + (i / (data.length - 1)) * (width - padding * 2),
      y: padding + (1 - (value - min) / range) * (height - padding * 2),
    }))

    // Create SVG path
    const linePath = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
      .join(' ')

    // Create area path (closed)
    const area = `${linePath} L ${points[points.length - 1].x.toFixed(2)} ${height} L ${points[0].x.toFixed(2)} ${height} Z`

    // Determine color based on trend
    const trend = data[data.length - 1] - data[0]
    let stroke = 'rgb(var(--accent))'
    let fill = 'rgb(var(--accent) / 0.1)'

    if (color === 'auto') {
      if (trend > 0) {
        stroke = 'rgb(34 197 94)'
        fill = 'rgb(34 197 94 / 0.1)'
      } else if (trend < 0) {
        stroke = 'rgb(239 68 68)'
        fill = 'rgb(239 68 68 / 0.1)'
      }
    } else if (color === 'success') {
      stroke = 'rgb(34 197 94)'
      fill = 'rgb(34 197 94 / 0.1)'
    } else if (color === 'error') {
      stroke = 'rgb(239 68 68)'
      fill = 'rgb(239 68 68 / 0.1)'
    }

    return { path: linePath, areaPath: area, strokeColor: stroke, fillColor: fill }
  }, [data, width, height, color])

  if (data.length < 2) return null

  return (
    <svg
      width={width}
      height={height}
      className={cn('overflow-visible', className)}
      viewBox={`0 0 ${width} ${height}`}
    >
      {showArea && (
        <path
          d={areaPath}
          fill={fillColor}
        />
      )}
      <path
        d={path}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

interface SparklineCardProps extends Omit<SparklineProps, 'width' | 'height'> {
  label: string
  value: string | number
  change?: number
  className?: string
}

export function SparklineCard({
  label,
  value,
  change,
  data,
  className,
  ...sparklineProps
}: SparklineCardProps) {
  return (
    <div className={cn(
      'rounded-xl border border-border bg-surface p-4',
      className
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-text-secondary">{label}</p>
          <p className="mt-1 text-xl font-semibold text-text-primary">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {change !== undefined && (
            <p className={cn(
              'text-sm mt-1',
              change > 0 && 'text-green-600 dark:text-green-400',
              change < 0 && 'text-red-600 dark:text-red-400',
              change === 0 && 'text-text-tertiary'
            )}>
              {change > 0 && '+'}{change.toFixed(2)}%
            </p>
          )}
        </div>
        <Sparkline data={data} width={80} height={40} showArea {...sparklineProps} />
      </div>
    </div>
  )
}
