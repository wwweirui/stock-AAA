import { useId } from 'react'

interface SparklineProps {
  values: number[]
  width?: number
  height?: number
  color?: string
  fill?: boolean
  strokeWidth?: number
}

export function Sparkline({
  values,
  width = 104,
  height = 30,
  color,
  fill = true,
  strokeWidth = 1.6,
}: SparklineProps) {
  const gradientId = useId().replaceAll(':', '')
  if (!values || values.length < 2) return <div style={{ width, height }} />

  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const pad = 2.5
  const points = values.map((value, index) => {
    const x = pad + (index / (values.length - 1)) * (100 - pad * 2)
    const y = pad + (1 - (value - min) / span) * (100 - pad * 2)
    return [x, y] as const
  })
  const line = points.map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ')
  const area = `${line} L${points[points.length - 1][0].toFixed(2)},100 L${points[0][0].toFixed(2)},100 Z`
  const lineColor = color ?? (values[values.length - 1] >= values[0] ? 'var(--up)' : 'var(--down)')

  return (
    <svg
      className="sparkline"
      width={width}
      height={height}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lineColor} stopOpacity="0.28" />
          <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={area} fill={`url(#${gradientId})`} />}
      <path d={line} fill="none" stroke={lineColor} strokeWidth={strokeWidth} vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
