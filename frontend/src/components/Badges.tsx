import type { CSSProperties, ReactNode } from 'react'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import type { AnalystLite } from '../types'
import { cx, intentTone, pct, signedClass } from '../lib/format'

export function Avatar({
  analyst,
  size = 'md',
}: {
  analyst: Pick<AnalystLite, 'name' | 'avatar' | 'color'>
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}) {
  return (
    <span
      className={cx('avatar', `avatar-${size}`)}
      style={{ '--avatar-color': analyst.color } as CSSProperties}
      title={analyst.name}
    >
      {analyst.avatar}
    </span>
  )
}

export function RatingBadge({ rating }: { rating: string }) {
  const tone = rating === '买入' ? 'buy' : rating === '增持' ? 'add' : 'neutral'
  return <span className={cx('badge', 'rating-badge', tone)}>{rating}</span>
}

export function IntentBadge({ label, score }: { label: string; score?: number }) {
  return (
    <span className={cx('badge', 'intent-badge', intentTone[label] ?? 'neutral')}>
      <span className="intent-dot" />
      {label}
      {score !== undefined && <b>{score.toFixed(0)}</b>}
    </span>
  )
}

export function Delta({
  value,
  suffix = '%',
  arrow = true,
  className,
}: {
  value: number
  suffix?: string
  arrow?: boolean
  className?: string
}) {
  const tone = signedClass(value)
  const Icon = tone === 'up' ? ArrowUpRight : tone === 'down' ? ArrowDownRight : Minus
  return (
    <span className={cx('delta', tone, className)}>
      {arrow && <Icon size={13} strokeWidth={2} />}
      {pct(value, true)}
      {suffix !== '%' ? suffix : ''}
    </span>
  )
}

export function Tag({ children, tone }: { children: ReactNode; tone?: 'gold' | 'muted' | 'blue' }) {
  return <span className={cx('tag', tone && `tag-${tone}`)}>{children}</span>
}
