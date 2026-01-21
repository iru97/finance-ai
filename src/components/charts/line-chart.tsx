'use client'

import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'

interface DataPoint {
  label: string
  value: number
}

interface LineChartProps {
  data: DataPoint[]
  height?: number
  showGrid?: boolean
  showDots?: boolean
  showTooltip?: boolean
  color?: string
  areaFill?: boolean
  className?: string
}

export function LineChart({
  data,
  height = 200,
  showGrid = true,
  showDots = true,
  showTooltip = true,
  color = 'rgb(var(--accent))',
  areaFill = false,
  className,
}: LineChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const { path, areaPath, points, yLabels, min, max } = useMemo(() => {
    if (data.length < 2) return { path: '', areaPath: '', points: [], yLabels: [], min: 0, max: 0 }

    const values = data.map(d => d.value)
    const minVal = Math.min(...values)
    const maxVal = Math.max(...values)
    const range = maxVal - minVal || 1

    const padding = { top: 20, right: 10, bottom: 30, left: 50 }
    const chartWidth = 100 - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom

    // Calculate points
    const pts = data.map((d, i) => ({
      x: padding.left + (i / (data.length - 1)) * chartWidth,
      y: padding.top + (1 - (d.value - minVal) / range) * chartHeight,
      ...d,
    }))

    // Create path
    const linePath = pts
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
      .join(' ')

    // Area path
    const area = `${linePath} L ${pts[pts.length - 1].x.toFixed(2)} ${padding.top + chartHeight} L ${pts[0].x.toFixed(2)} ${padding.top + chartHeight} Z`

    // Y-axis labels
    const labelCount = 5
    const labels = Array.from({ length: labelCount }, (_, i) => {
      const val = minVal + (range * i) / (labelCount - 1)
      const y = padding.top + chartHeight - (chartHeight * i) / (labelCount - 1)
      return { value: val, y }
    })

    return { path: linePath, areaPath: area, points: pts, yLabels: labels, min: minVal, max: maxVal }
  }, [data, height])

  if (data.length < 2) {
    return (
      <div className={cn('flex items-center justify-center text-text-tertiary', className)} style={{ height }}>
        Not enough data points
      </div>
    )
  }

  return (
    <div className={cn('relative w-full', className)} style={{ height }}>
      <svg width="100%" height="100%" className="overflow-visible">
        {/* Grid lines */}
        {showGrid && yLabels.map((label, i) => (
          <g key={i}>
            <line
              x1="50"
              y1={label.y}
              x2="100%"
              y2={label.y}
              stroke="rgb(var(--border))"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            <text
              x="45"
              y={label.y + 4}
              textAnchor="end"
              className="fill-text-tertiary text-[10px]"
            >
              {label.value.toFixed(0)}
            </text>
          </g>
        ))}

        {/* X-axis labels */}
        {data.length <= 12 && data.map((d, i) => {
          const x = 50 + (i / (data.length - 1)) * 40
          return (
            <text
              key={i}
              x={`${x}%`}
              y={height - 5}
              textAnchor="middle"
              className="fill-text-tertiary text-[10px]"
            >
              {d.label}
            </text>
          )
        })}

        {/* Area fill */}
        {areaFill && (
          <path
            d={areaPath}
            fill={color}
            fillOpacity="0.1"
          />
        )}

        {/* Line */}
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dots and interaction */}
        {points.map((point, i) => (
          <g key={i}>
            {showDots && (
              <circle
                cx={`${point.x}%`}
                cy={point.y}
                r={hoveredIndex === i ? 5 : 3}
                fill={hoveredIndex === i ? color : 'white'}
                stroke={color}
                strokeWidth="2"
                className="transition-all duration-150"
              />
            )}
            {showTooltip && (
              <rect
                x={`${point.x - 5}%`}
                y={0}
                width="10%"
                height={height}
                fill="transparent"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="cursor-pointer"
              />
            )}
          </g>
        ))}

        {/* Tooltip */}
        {showTooltip && hoveredIndex !== null && (
          <g>
            <rect
              x={`${points[hoveredIndex].x - 8}%`}
              y={points[hoveredIndex].y - 35}
              width="16%"
              height="30"
              rx="4"
              fill="rgb(var(--surface))"
              stroke="rgb(var(--border))"
            />
            <text
              x={`${points[hoveredIndex].x}%`}
              y={points[hoveredIndex].y - 22}
              textAnchor="middle"
              className="fill-text-primary text-xs font-medium"
            >
              {points[hoveredIndex].value.toLocaleString()}
            </text>
            <text
              x={`${points[hoveredIndex].x}%`}
              y={points[hoveredIndex].y - 10}
              textAnchor="middle"
              className="fill-text-tertiary text-[10px]"
            >
              {points[hoveredIndex].label}
            </text>
          </g>
        )}
      </svg>
    </div>
  )
}
