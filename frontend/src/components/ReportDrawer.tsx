import { useEffect } from 'react'
import {
  AlertTriangle,
  ArrowUpRight,
  BookmarkPlus,
  CalendarDays,
  ChevronRight,
  CircleDashed,
  ExternalLink,
  FileText,
  Sparkles,
  Target,
  TrendingUp,
  X,
} from 'lucide-react'
import type { Report } from '../types'
import { api } from '../lib/api'
import { cx, dateShort, pct, signedClass } from '../lib/format'
import { useApi, useBodyLock } from '../lib/hooks'
import { Avatar, IntentBadge, RatingBadge } from './Badges'
import { ReportPathChart } from './Charts'
import { ErrorState, LoadingState } from './UI'
import { useToast } from './Toast'

export function ReportDrawer({
  reportId,
  onClose,
  onOpenAnalyst,
  onOpenReport,
}: {
  reportId: string
  onClose: () => void
  onOpenAnalyst: (id: string) => void
  onOpenReport: (id: string) => void
}) {
  const { data, loading, error } = useApi<Report>(() => api.report(reportId), [reportId])
  const notify = useToast()
  useBodyLock(true)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="drawer-layer" onClick={onClose} role="presentation">
      <aside
        className="report-drawer"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="研报详情"
      >
        <div className="drawer-top">
          <span className="drawer-eyebrow">
            {data?.scope === 'industry' ? 'INDUSTRY RESEARCH' : 'REPORT INTELLIGENCE'}
          </span>
          <button className="drawer-close" onClick={onClose} aria-label="关闭详情">
            <X size={18} />
          </button>
        </div>

        {loading && <div className="drawer-state"><LoadingState label="正在读取研报" /></div>}
        {error && <div className="drawer-state"><ErrorState message={error} /></div>}
        {data && <ReportBody data={data} onClose={onClose} onOpenAnalyst={onOpenAnalyst} onOpenReport={onOpenReport} notify={notify} />}
      </aside>
    </div>
  )
}

function ReportBody({
  data,
  onClose,
  onOpenAnalyst,
  onOpenReport,
  notify,
}: {
  data: Report
  onClose: () => void
  onOpenAnalyst: (id: string) => void
  onOpenReport: (id: string) => void
  notify: (message: string) => void
}) {
  const hasPerformance = data.performance_status === 'tracked'
  const industry = data.scope === 'industry'
  const relatedGroups = Object.entries(data.related_stocks ?? {}).filter(([, names]) => names.length > 0)
  const relatedCount = relatedGroups.reduce((sum, [, names]) => sum + names.length, 0)

  return (
    <>
      <div className="drawer-scroll">
        <header className="drawer-header">
          <div className="stock-lockup">
            <span className="stock-symbol" style={{ borderColor: `${data.analyst.color}66` }}>
              {data.stock_name.slice(0, 1)}
            </span>
            <div>
              <b>{data.stock_name}</b>
              <span>
                {industry ? `行业研究 · ${data.industry}` : `${data.stock_code} · ${data.industry}`}
              </span>
            </div>
          </div>
          <div className="drawer-rating-row">
            <RatingBadge rating={data.rating} />
            {data.prev_rating && data.prev_rating !== data.rating && (
              <span className="tag tag-change">{data.prev_rating} → {data.rating}</span>
            )}
            {data.report_type !== data.rating && <span className="tag">{data.report_type}</span>}
            {!hasPerformance && <span className="tag tag-muted">行情待接入</span>}
          </div>
          <h2 className="drawer-title">{data.title}</h2>
          <div className="drawer-meta">
            <div className="analyst-inline">
              <Avatar analyst={data.analyst} size="sm" />
              <div>
                <b>{data.analyst.name}</b>
                <span>{data.analyst.firm} · {data.analyst.title}</span>
              </div>
            </div>
            <span className="drawer-date"><CalendarDays size={13} /> {dateShort(data.publish_date)}</span>
          </div>
          <div className="report-card-tags">
            {data.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}
          </div>
        </header>

        {hasPerformance ? (
          <div className="drawer-performance">
            <div>
              <span>发布以来</span>
              <b className={signedClass(data.ret ?? 0)}>{pct(data.ret ?? 0)}</b>
              <small>持有 {data.holding_days} 个交易日</small>
            </div>
            <div>
              <span>相对基准</span>
              <b className={signedClass(data.excess ?? 0)}>{pct(data.excess ?? 0)}</b>
              <small>沪深300 {pct(data.benchmark_ret ?? 0)}</small>
            </div>
            <div>
              <span>最大浮盈</span>
              <b className="up">{pct(data.max_gain ?? 0)}</b>
              <small>最大回撤 {pct(data.max_drawdown ?? 0)}</small>
            </div>
          </div>
        ) : (
          <div className="drawer-performance is-pending">
            <div>
              <span>行情状态</span>
              <b className="pending-text">待接入</b>
              <small>导入标的后自动计算</small>
            </div>
            <div>
              <span>关联标的</span>
              <b>{relatedCount || '—'}<small> 个</small></b>
              <small>原文线索，不构成推荐</small>
            </div>
            <div>
              <span>表现跟踪</span>
              <b>待计算</b>
              <small>收益 / 超额 / 胜率</small>
            </div>
          </div>
        )}

        <section className="drawer-section">
          <div className="drawer-section-head">
            <h3>{industry ? '表现跟踪' : '价格路径'}</h3>
            {hasPerformance ? (
              <span className="chart-summary-pill">
                <Target size={12} />
                目标空间 {data.target_upside === null ? '未给出' : pct(data.target_upside * 100, false, 1)}
              </span>
            ) : (
              <span className="chart-summary-pill"><CircleDashed size={12} /> 行情待接入</span>
            )}
          </div>

          {hasPerformance && data.series.length > 0 ? (
            <>
              <div className="drawer-chart-legend">
                <span><i className="legend-line gold" /> 个股（发布日=100）</span>
                <span><i className="legend-line dashed" /> 沪深300</span>
              </div>
              <ReportPathChart data={data.series} height={226} />
              <div className="price-strip">
                <div><span>入场价</span><b>{data.entry_price?.toFixed(2) ?? '—'}</b></div>
                <ChevronRight size={14} />
                <div><span>最新价</span><b>{data.latest_price?.toFixed(2) ?? '—'}</b></div>
                <ChevronRight size={14} />
                <div><span>目标价</span><b className="gold">{data.target_price?.toFixed(2) ?? '未给出'}</b></div>
                <div className="target-progress">
                  <span>目标进度</span>
                  <div className="progress-track">
                    <i style={{ width: `${Math.max(0, Math.min(100, (data.target_progress ?? 0) * 100))}%` }} />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="drawer-pending-chart">
              <span className="drawer-pending-icon"><FileText size={20} /></span>
              <div>
                <b>{industry ? '行业研报已入库，等待行情' : '行情数据待接入'}</b>
                <p>{data.pending_reason ?? '导入覆盖标的的日行情与沪深300后，系统会自动计算推荐后表现。'}</p>
              </div>
            </div>
          )}
        </section>

        <section className="drawer-section intent-section">
          <div className="drawer-section-head">
            <h3>{industry ? '产业观点强度' : '推票意图拆解'}</h3>
            <IntentBadge label={data.intention_label} score={data.intention_score} />
          </div>
          <div className="intent-breakdown">
            <div className="intent-score-box">
              <span>INTENT</span>
              <b>{data.intention_score.toFixed(0)}</b>
              <small>/ 100</small>
            </div>
            {(data.intent_breakdown?.length ?? 0) > 0 ? (
              <div className="intent-bars">
                {data.intent_breakdown?.map((item) => (
                  <div className="intent-bar-row" key={item.name}>
                    <div>
                      <span>{item.name}</span>
                      <b>{item.score.toFixed(1)}<small>/{item.max}</small></b>
                    </div>
                    <div className="intent-bar-track">
                      <i style={{ width: `${(item.score / item.max) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="intent-summary-tags">
                <span>产业趋势 <b>强</b></span>
                <span>催化密度 <b>高</b></span>
                <span>个股评级 <b>未给出</b></span>
                <span>目标价 <b>未给出</b></span>
              </div>
            )}
          </div>
          <p className="intent-note"><Sparkles size={14} /> {data.intention_note}</p>
        </section>

        <section className="drawer-section">
          <div className="drawer-section-head">
            <h3>核心逻辑</h3>
            <span className="muted-label">KEY THESIS</span>
          </div>
          <p className="drawer-summary">{data.summary}</p>
          <ol className="thesis-list">
            {data.key_points.map((point, index) => (
              <li key={point}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                {point}
              </li>
            ))}
          </ol>
        </section>

        {relatedGroups.length > 0 && (
          <section className="drawer-section">
            <div className="drawer-section-head">
              <h3>关联标的</h3>
              <span className="muted-label">RELATED STOCKS · {relatedCount}</span>
            </div>
            <p className="related-caption">以下为报告原文列示的研究线索，不构成个股推荐。</p>
            <div className="related-groups">
              {relatedGroups.map(([group, names]) => (
                <div className="related-group" key={group}>
                  <div className="related-group-head">
                    <b>{group}</b>
                    <span>{names.length} 个</span>
                  </div>
                  <div className="related-stock-tags">
                    {names.slice(0, 12).map((name) => <span className="tag" key={name}>{name}</span>)}
                    {names.length > 12 && <span className="tag tag-muted">+{names.length - 12}</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="drawer-section">
          <div className="drawer-section-head">
            <h3>风险提示</h3>
            <span className="muted-label">RISKS</span>
          </div>
          <div className="risk-list">
            {data.risks.map((risk) => (
              <span key={risk}><AlertTriangle size={13} /> {risk}</span>
            ))}
          </div>
        </section>

        {(data.related?.length ?? 0) > 0 && (
          <section className="drawer-section">
            <div className="drawer-section-head">
              <h3>相关观点</h3>
              <span className="muted-label">RELATED</span>
            </div>
            <div className="related-list">
              {data.related?.map((related) => (
                <button key={related.id} onClick={() => onOpenReport(related.id)}>
                  <div>
                    <b>{related.stock_name}</b>
                    <span>{related.analyst.name} · {related.rating}</span>
                  </div>
                  {related.performance_status === 'tracked' ? (
                    <span className={signedClass(related.excess ?? 0)}>{pct(related.excess ?? 0)}</span>
                  ) : (
                    <span className="pending-text">待行情</span>
                  )}
                  <ArrowUpRight size={14} />
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="drawer-section source-section">
          <div className="drawer-section-head">
            <h3>报告信息</h3>
            {data.source_url && (
              <a className="source-link" href={data.source_url} target="_blank" rel="noreferrer">
                阅读原文 <ExternalLink size={12} />
              </a>
            )}
          </div>
          <div className="source-meta">
            <span>{data.source_name || '本地导入'}</span>
            <span>发布于 {dateShort(data.publish_date)}</span>
            {data.has_content && <span>原文 {data.content?.length.toLocaleString('zh-CN')} 字</span>}
          </div>
          {data.content && (
            <details className="source-details">
              <summary>展开报告原文</summary>
              <div className="source-content">{data.content}</div>
            </details>
          )}
        </section>
      </div>

      <footer className="drawer-footer">
        <button className="button ghost" onClick={() => notify('已加入自选跟踪')}>
          <BookmarkPlus size={15} /> 加入跟踪
        </button>
        <button className="button primary" onClick={() => { onClose(); onOpenAnalyst(data.analyst.id) }}>
          <TrendingUp size={15} /> 查看分析师
        </button>
      </footer>
    </>
  )
}
