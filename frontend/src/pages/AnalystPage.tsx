import { ArrowLeft, BookmarkPlus, BriefcaseBusiness, CalendarDays, CircleDashed } from 'lucide-react'
import type { Analyst } from '../types'
import { api } from '../lib/api'
import { cx, dateShort, pct } from '../lib/format'
import { navigate, useApi } from '../lib/hooks'
import { PerformanceChart, StyleRadar } from '../components/Charts'
import { ReportTable } from '../components/ReportTable'
import { ErrorState, PageHeader, PanelHeader, ScoreRing, SkeletonPage } from '../components/UI'
import { useToast } from '../components/Toast'

export function AnalystPage({ id, onOpenReport }: { id: string; onOpenReport: (id: string) => void }) {
  const { data, loading, error } = useApi<Analyst>(() => api.analyst(id), [id])
  const notify = useToast()

  if (loading) return <SkeletonPage />
  if (error) return <div className="page"><ErrorState message={error} /></div>
  if (!data) return null

  const reports = data.reports ?? []

  if (!data.metrics.has_performance) {
    const firstReport = reports[0]
    return (
      <div className="page analyst-detail-page">
        <button className="back-link" onClick={() => navigate('/analysts')}>
          <ArrowLeft size={15} /> 返回分析师榜单
        </button>
        <PageHeader
          eyebrow="ANALYST DOSSIER / 分析师专题"
          title={`${data.name} · 研究档案`}
          description="研报已入库，行情尚未接入。表现曲线、胜率与 Alpha 分会在行情齐备后自动生成。"
          actions={
            <button className="button primary" onClick={() => notify(`已关注 ${data.name}，有新研报时会提醒`)}>
              <BookmarkPlus size={15} /> 关注分析师
            </button>
          }
        />

        <section className="panel analyst-hero">
          <div className="analyst-hero-main">
            <span className="analyst-avatar-xl" style={{ background: `${data.color}1c`, color: data.color }}>
              {data.avatar}
            </span>
            <div className="analyst-hero-copy">
              <div className="hero-name-row">
                <h2>{data.name}</h2>
                <span className="analyst-style">{data.style}</span>
                {data.years > 0 && <span className="tag">{data.years} 年经验</span>}
                <span className="tag tag-gold">研报已入库</span>
              </div>
              <p className="hero-firm">{data.firm} · {data.title}</p>
              <p className="hero-tagline">“{data.tagline}”</p>
              <p className="hero-bio">{data.bio}</p>
              <div className="analyst-industries">
                {data.industries.map((industry) => (
                  <span className="tag tag-muted" key={industry}>{industry}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="analyst-hero-score">
            <span className="score-pending large"><b>待行情</b><small>ALPHA</small></span>
            <span>综合 Alpha 分</span>
            <small>行情接入后计算</small>
          </div>
        </section>

        <div className="pending-summary detail-pending-summary">
          <div>
            <span>已入库研报</span>
            <b>{data.metrics.report_count}<small> 篇</small></b>
          </div>
          <div>
            <span>最新报告</span>
            <b className="pending-summary-date">{dateShort(data.latest_report_date ?? '')}</b>
          </div>
          <div>
            <span>观点强度</span>
            <b>{data.metrics.avg_intention.toFixed(0)}<small> / 100</small></b>
          </div>
          <div>
            <span>表现跟踪</span>
            <b className="pending-text">待行情</b>
          </div>
        </div>

        <section className="panel pending-analyst-banner">
          <span className="pending-banner-icon"><CircleDashed size={20} /></span>
          <div>
            <b>行情数据待接入</b>
            <p>
              {firstReport?.pending_reason ?? '导入覆盖标的的日行情与沪深300后，系统会自动计算推荐后表现。'}
              当前报告未给出个股评级与目标价，行业观点不计入个股推荐胜率。
            </p>
          </div>
        </section>

        <div className="detail-grid lower">
          <section className="panel analyst-reports-panel">
            <PanelHeader
              title="已入库研报"
              subtitle={`共 ${reports.length} 篇 · 点击查看观点、关联标的与原文`}
            />
            <ReportTable reports={reports} onOpen={onOpenReport} hideAnalyst />
          </section>

          <aside className="detail-side">
            <section className="panel">
              <PanelHeader title="研究偏好" subtitle="行业覆盖与报告类型" compact />
              <div className="preference-list">
                {(data.industry_breakdown ?? []).map((industry) => (
                  <div className="preference-row" key={industry.name}>
                    <div>
                      <span>{industry.name}</span>
                      <small>
                        {industry.count} 篇 · {industry.priced_count > 0
                          ? `胜率 ${industry.win_rate?.toFixed(0)}%`
                          : '行情待接入'}
                      </small>
                    </div>
                    {industry.avg_excess === null ? (
                      <b className="pending-text">待行情</b>
                    ) : (
                      <b className={industry.avg_excess >= 0 ? 'up' : 'down'}>{pct(industry.avg_excess)}</b>
                    )}
                  </div>
                ))}
              </div>
              <div className="rating-split">
                {(data.rating_breakdown ?? []).map((item) => (
                  <span key={item.label} className={cx('rating-slice', item.label === '买入' ? 'is-buy' : item.label === '增持' ? 'is-add' : 'is-neutral')}>
                    {item.label} <b>{item.count}</b>
                  </span>
                ))}
              </div>
            </section>

            <section className="panel">
              <PanelHeader title="观点结构" subtitle="推票意图分布" compact />
              <div className="intent-mini-list">
                {(data.intent_breakdown ?? []).map((item) => (
                  <div key={item.label}>
                    <span>{item.label}</span>
                    <div className="intent-mini-track">
                      <i style={{ width: `${(item.count / Math.max(reports.length, 1)) * 100}%` }} />
                    </div>
                    <b>{item.count}</b>
                  </div>
                ))}
              </div>
              <div className="side-note">
                <BriefcaseBusiness size={15} />
                <p>
                  平均意图强度 <b>{data.metrics.avg_intention.toFixed(1)}</b> / 100。行业研报的分数是产业观点强度，不是个股评级。
                </p>
              </div>
            </section>
          </aside>
        </div>
      </div>
    )
  }

  const equity = data.equity ?? []
  const last = equity[equity.length - 1]

  return (
    <div className="page analyst-detail-page">
      <button className="back-link" onClick={() => navigate('/analysts')}>
        <ArrowLeft size={15} /> 返回分析师榜单
      </button>
      <PageHeader
        eyebrow="ANALYST DOSSIER / 分析师专题"
        title={`${data.name} · 研究表现档案`}
        description={
          <>
            {data.firm} · {data.title}
            <span className="header-meta"> 覆盖 {data.metrics.report_count} 篇 · 最近更新 {dateShort(data.latest_report_date ?? '')}</span>
          </>
        }
        actions={
          <button className="button primary" onClick={() => notify(`已关注 ${data.name}，有新研报时会提醒`)}>
            <BookmarkPlus size={15} /> 关注分析师
          </button>
        }
      />

      <section className="panel analyst-hero">
        <div className="analyst-hero-main">
          <span className="analyst-avatar-xl" style={{ background: `${data.color}1c`, color: data.color }}>
            {data.avatar}
          </span>
          <div className="analyst-hero-copy">
            <div className="hero-name-row">
              <h2>{data.name}</h2>
              <span className="analyst-style">{data.style}</span>
              <span className="tag">{data.years} 年经验</span>
            </div>
            <p className="hero-firm">{data.firm} · {data.title}</p>
            <p className="hero-tagline">“{data.tagline}”</p>
            <p className="hero-bio">{data.bio}</p>
            <div className="analyst-industries">
              {data.industries.map((industry) => (
                <span className="tag tag-muted" key={industry}>{industry}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="analyst-hero-score">
          <ScoreRing score={data.metrics.score} size={92} />
          <span>综合 Alpha 分</span>
          <small>胜率 {data.metrics.win_rate.toFixed(1)}% · 超额 {pct(data.metrics.avg_excess)}</small>
        </div>
      </section>

      <div className="detail-kpi-grid">
        <div className="detail-kpi">
          <span>推荐胜率</span>
          <b>{data.metrics.win_rate.toFixed(1)}<small>%</small></b>
          <em>{Math.round(data.metrics.win_rate / 100 * data.metrics.report_count)} / {data.metrics.report_count} 条跑赢基准</em>
        </div>
        <div className="detail-kpi">
          <span>平均超额</span>
          <b className={data.metrics.avg_excess >= 0 ? 'up' : 'down'}>{pct(data.metrics.avg_excess)}</b>
          <em>相对沪深300 · 等权</em>
        </div>
        <div className="detail-kpi">
          <span>最佳单笔</span>
          <b className="up">{pct(data.metrics.best_excess)}</b>
          <em>最差 {pct(data.metrics.worst_excess)}</em>
        </div>
        <div className="detail-kpi">
          <span>平均持有</span>
          <b>{data.metrics.avg_holding_days.toFixed(0)}<small> 日</small></b>
          <em>跟踪中 {data.metrics.active_count} 篇</em>
        </div>
      </div>

      <div className="detail-grid">
        <section className="panel detail-chart-panel">
          <PanelHeader
            title="推荐组合表现"
            subtitle="该分析师全部推荐的等权组合 vs 沪深300"
            action={
              <div className="chart-summary-pill">
                <span>累计超额</span>
                <b>{pct(last?.alpha ?? data.metrics.avg_excess)}</b>
              </div>
            }
          />
          <PerformanceChart data={equity} height={296} />
          <div className="chart-footer">
            <div><span>组合收益</span><b className={(last?.portfolio ?? 0) >= 0 ? 'up' : 'down'}>{pct(last?.portfolio ?? 0)}</b></div>
            <div><span>基准收益</span><b>{pct(last?.benchmark ?? 0)}</b></div>
            <div className="highlight"><span>累计超额</span><b>{pct(last?.alpha ?? 0)}</b></div>
            <div className="chart-footer-note"><CalendarDays size={14} /> {equity.length} 个交易日</div>
          </div>
        </section>

        <section className="panel radar-panel">
          <PanelHeader title="研究风格" subtitle="五维能力画像 · 演示评分" compact />
          <StyleRadar scores={data.style_scores} />
        </section>
      </div>

      <div className="detail-grid lower">
        <section className="panel analyst-reports-panel">
          <PanelHeader
            title="研报与推荐明细"
            subtitle={`共 ${reports.length} 篇 · 点击查看推票逻辑与价格路径`}
          />
          <ReportTable reports={reports} onOpen={onOpenReport} hideAnalyst />
        </section>

        <aside className="detail-side">
          <section className="panel">
            <PanelHeader title="研究偏好" subtitle="行业覆盖与评级分布" compact />
            <div className="preference-list">
              {(data.industry_breakdown ?? []).map((industry) => (
                <div className="preference-row" key={industry.name}>
                  <div>
                    <span>{industry.name}</span>
                    <small>{industry.count} 篇 · 胜率 {industry.win_rate?.toFixed(0) ?? '—'}%</small>
                  </div>
                  {industry.avg_excess === null ? (
                    <b className="pending-text">待行情</b>
                  ) : (
                    <b className={industry.avg_excess >= 0 ? 'up' : 'down'}>{pct(industry.avg_excess)}</b>
                  )}
                </div>
              ))}
            </div>
            <div className="rating-split">
              {(data.rating_breakdown ?? []).map((item) => (
                <span key={item.label} className={cx('rating-slice', item.label === '买入' ? 'is-buy' : item.label === '增持' ? 'is-add' : 'is-neutral')}>
                  {item.label} <b>{item.count}</b>
                </span>
              ))}
            </div>
          </section>

          <section className="panel">
            <PanelHeader title="观点结构" subtitle="推票意图分布" compact />
            <div className="intent-mini-list">
              {(data.intent_breakdown ?? []).map((item) => (
                <div key={item.label}>
                  <span>{item.label}</span>
                  <div className="intent-mini-track">
                    <i style={{ width: `${(item.count / Math.max(reports.length, 1)) * 100}%` }} />
                  </div>
                  <b>{item.count}</b>
                </div>
              ))}
            </div>
            <div className="side-note">
              <BriefcaseBusiness size={15} />
              <p>平均意图强度 <b>{data.metrics.avg_intention.toFixed(1)}</b> / 100，评级变动与目标价空间已纳入评分。</p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}
