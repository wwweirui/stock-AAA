import { ArrowUpRight } from 'lucide-react'
import type { Report } from '../types'
import { cx, dateShort, pct, relativeDays, signedClass } from '../lib/format'
import { Avatar, IntentBadge, RatingBadge } from './Badges'

interface ReportTableProps {
  reports: Report[]
  onOpen: (id: string) => void
  compact?: boolean
  asOf?: string | null
  hideAnalyst?: boolean
}

export function ReportTable({ reports, onOpen, compact = false, asOf, hideAnalyst = false }: ReportTableProps) {
  if (!reports.length) {
    return <div className="table-empty">没有符合条件的研报</div>
  }
  return (
    <div className={cx('report-table-wrap', compact && 'is-compact', hideAnalyst && 'no-analyst')}>
      <table className="report-table">
        <thead>
          <tr>
            <th>标的</th>
            <th>研报观点</th>
            {!hideAnalyst && <th>分析师</th>}
            <th>评级</th>
            <th className="num">发布以来</th>
            <th>推票意图</th>
            <th className="num">发布日期</th>
            <th aria-label="查看" />
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => {
            const pending = report.performance_status === 'pending'
            return (
            <tr
              key={report.id}
              onClick={() => onOpen(report.id)}
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onOpen(report.id)
                }
              }}
            >
              <td>
                <div className="stock-cell">
                  <span className="stock-name">{report.stock_name}</span>
                  <span className="stock-meta">
                    {report.scope === 'industry' ? `行业研究 · ${report.industry}` : `${report.stock_code} · ${report.industry}`}
                  </span>
                </div>
              </td>
              <td className="title-cell">
                <div className="report-title">{report.title}</div>
                <div className="tag-row">
                  {report.tags.slice(0, compact ? 1 : 2).map((tag) => (
                    <span className="tag" key={tag}>
                      {tag}
                    </span>
                  ))}
                  {!compact && report.prev_rating && report.prev_rating !== report.rating && (
                    <span className="tag tag-change">
                      {report.prev_rating} → {report.rating}
                    </span>
                  )}
                </div>
              </td>
              {!hideAnalyst && (
                <td>
                  <div className="analyst-cell">
                    <Avatar analyst={report.analyst} size="xs" />
                    <div>
                      <b>{report.analyst.name}</b>
                      <span>{report.analyst.firm}</span>
                    </div>
                  </div>
                </td>
              )}
              <td>
                <RatingBadge rating={report.rating} />
              </td>
              <td className="num">
                {pending ? (
                  <div className="pending-cell">
                    <span className="pending-dot" />
                    <div><b>待行情</b><span>接入后计算</span></div>
                  </div>
                ) : (
                  <div className={cx('return-cell', signedClass(report.ret ?? 0))}>
                    <b>{pct(report.ret ?? 0)}</b>
                    <span>超额 {pct(report.excess ?? 0)}</span>
                  </div>
                )}
              </td>
              <td>
                <div className="intent-cell">
                  <div className="intent-mini-bar">
                    <i style={{ width: `${report.intention_score}%` }} />
                  </div>
                  <span>{report.intention_score.toFixed(0)}</span>
                </div>
              </td>
              <td className="num">
                <div className="date-cell">
                  <span>{dateShort(report.publish_date)}</span>
                  <small>{relativeDays(report.publish_date, pending ? null : asOf)}</small>
                </div>
              </td>
              <td className="row-arrow">
                <ArrowUpRight size={15} />
              </td>
            </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export function LatestReports({
  reports,
  onOpen,
  asOf,
  onViewAll,
}: {
  reports: Report[]
  onOpen: (id: string) => void
  asOf?: string | null
  onViewAll: () => void
}) {
  return (
    <section className="panel reports-panel">
      <div className="panel-header">
        <div>
          <h2>最新研报</h2>
          <p>观点、评级与发布后的市场反馈</p>
        </div>
        <button className="text-button" onClick={onViewAll}>
          查看全部
          <ArrowUpRight size={14} />
        </button>
      </div>
      <ReportTable reports={reports} onOpen={onOpen} compact asOf={asOf} />
    </section>
  )
}
