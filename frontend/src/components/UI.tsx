import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { AlertTriangle, LoaderCircle } from 'lucide-react'
import { cx } from '../lib/format'
import { Sparkline } from './Sparkline'

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string
  title: string
  description: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="page-header">
      <div>
        <div className="eyebrow">
          <span className="eyebrow-line" />
          {eyebrow}
        </div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  )
}

export function PanelHeader({
  title,
  subtitle,
  action,
  compact,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
  compact?: boolean
}) {
  return (
    <div className={cx('panel-header', compact && 'is-compact')}>
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function KpiCard({
  label,
  value,
  unit,
  note,
  icon: Icon,
  spark,
  tone = 'gold',
  index,
}: {
  label: string
  value: string
  unit?: string
  note: ReactNode
  icon: LucideIcon
  spark?: number[]
  tone?: 'gold' | 'red' | 'green' | 'blue'
  index: string
}) {
  return (
    <article className={cx('kpi-card', `tone-${tone}`)}>
      <div className="kpi-top">
        <span className="kpi-icon">
          <Icon size={16} strokeWidth={1.9} />
        </span>
        <span className="kpi-index">{index}</span>
      </div>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value-row">
        <strong className="kpi-value">{value}</strong>
        {unit && <span className="kpi-unit">{unit}</span>}
      </div>
      <div className="kpi-bottom">
        <span className="kpi-note">{note}</span>
        {spark && <Sparkline values={spark} width={86} height={26} strokeWidth={1.4} />}
      </div>
    </article>
  )
}

export function ScoreRing({
  score,
  size = 64,
  label = 'ALPHA',
}: {
  score: number
  size?: number
  label?: string
}) {
  const radius = 26
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - Math.min(score, 100) / 100)
  return (
    <div className="score-ring" style={{ width: size, height: size }}>
      <svg viewBox="0 0 64 64" width={size} height={size}>
        <circle cx="32" cy="32" r={radius} className="score-track" />
        <circle
          cx="32"
          cy="32"
          r={radius}
          className="score-progress"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 32 32)"
        />
      </svg>
      <div className="score-ring-copy">
        <b>{score.toFixed(0)}</b>
        <small>{label}</small>
      </div>
    </div>
  )
}

export function LoadingState({ label = '正在读取研究数据' }: { label?: string }) {
  return (
    <div className="loading-state">
      <LoaderCircle size={20} className="spin" />
      <span>{label}</span>
    </div>
  )
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="error-state">
      <AlertTriangle size={20} />
      <div>
        <b>数据加载失败</b>
        <p>{message}</p>
      </div>
    </div>
  )
}

export function SkeletonPage() {
  return (
    <div className="skeleton-page">
      <div className="skeleton skeleton-title" />
      <div className="skeleton-grid">
        {[0, 1, 2, 3].map((item) => (
          <div className="skeleton skeleton-card" key={item} />
        ))}
      </div>
      <div className="skeleton skeleton-chart" />
      <div className="skeleton skeleton-chart short" />
    </div>
  )
}


export function EmptyWorkspace({
  icon: Icon,
  eyebrow = 'WORKSPACE READY / 空库',
  title,
  description,
  steps,
  note,
  action,
}: {
  icon: LucideIcon
  eyebrow?: string
  title: string
  description: string
  steps?: { title: string; text: string }[]
  note?: string
  action?: ReactNode
}) {
  return (
    <section className="panel empty-workspace">
      <div className="empty-visual" aria-hidden="true">
        <span className="empty-orbit orbit-one" />
        <span className="empty-orbit orbit-two" />
        <span className="empty-icon"><Icon size={28} strokeWidth={1.5} /></span>
        <span className="empty-visual-label">NO DATA / STANDBY</span>
      </div>
      <div className="empty-copy">
        <span className="empty-eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
        <p className="empty-description">{description}</p>
        {steps && steps.length > 0 && (
          <div className="empty-steps">
            {steps.map((step, index) => (
              <div className="empty-step" key={step.title}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <b>{step.title}</b>
                  <p>{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        {note && <div className="empty-note"><span className="live-dot" /> {note}</div>}
        {action && <div className="empty-actions">{action}</div>}
      </div>
    </section>
  )
}
