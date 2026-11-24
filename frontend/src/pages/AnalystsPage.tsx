import { ArrowUpRight, Award, Crown, FileUp, Info, Sparkles } from 'lucide-react'
import type { Analyst } from '../types'
import { api } from '../lib/api'
import { cx, dateShort, pct } from '../lib/format'
import { navigate, useApi } from '../lib/hooks'
import { Sparkline } from '../components/Sparkline'
import { EmptyWorkspace, ErrorState, LoadingState, PageHeader, ScoreRing } from '../components/UI'

export function AnalystsPage() {
  const { data, loading, error } = useApi(() => api.analysts(), [])

  if (loading) return <div className="page"><LoadingState label="正在构建分析师画像" /></div>
  if (error) return <div className="page"><ErrorState message={error} /></div>
  if (!data) return null

  if (data.length === 0) {
    return (
      <div className="page analysts-page">
        <PageHeader
          eyebrow="ANALYST ALPHA / 研究者画像"
          title="分析师 Alpha 榜"
          description="当前为空库。导入研报后，这里会按分析师聚合观点、胜率与 Alpha 排名。"
          actions={<span className="empty-status"><span /> 0 位分析师</span>}
        />
        <EmptyWorkspace
          icon={FileUp}
          eyebrow="NO ANALYSTS / 等待研报"
          title="还没有分析师画像"
          description="分析师专题由研报数据自动聚合，不需要单独录入。第一份研报入库后，这里会出现分析师卡片。"
          steps={[
            { title: '先导入研报', text: '研报中的分析师姓名与机构会自动建立关联。' },
            { title: '积累样本', text: '同一分析师的研报越多，胜率与风格画像越可靠。' },
            { title: '生成排名', text: '结合推荐超额、胜率与观点强度计算 Alpha 分。' },
          ]}
          note="样本不足 3 篇时，排名只作展示，不进入正式结论。"
          action={<button className="button ghost" onClick={() => navigate('/methodology')}>查看评分口径</button>}
        />
      </div>
    )
  }

  const totalReports = data.reduce((sum, analyst) => sum + analyst.metrics.report_count, 0)
  const performers = data.filter((analyst) => analyst.metrics.has_performance)
  const avgWin = performers.length
    ? performers.reduce((sum, analyst) => sum + analyst.metrics.win_rate, 0) / performers.length
    : null
  const best = data[0]
  const hasPerformance = performers.length > 0

  return (
    <div className="page analysts-page">
      <PageHeader
        eyebrow="ANALYST ALPHA / 研究者画像"
        title="分析师 Alpha 榜"
        description={
          hasPerformance
            ? '不只看观点有多鲜明，更看观点发布后能否转化为可持续的超额。'
            : '研报已入库，行情尚未接入。Alpha 排名会在表现数据齐备后自动生成。'
        }
        actions={
          <button className="button ghost" onClick={() => navigate('/methodology')}>
            <Info size={15} /> 评分口径
          </button>
        }
      />

      <div className="analyst-summary-strip">
        <div>
          <span>在册分析师</span>
          <b>{data.length}<small> 位</small></b>
        </div>
        <div>
          <span>累计跟踪研报</span>
          <b>{totalReports}<small> 篇</small></b>
        </div>
        <div>
          <span>平均推荐胜率</span>
          {avgWin === null ? (
            <b className="pending-text">待行情</b>
          ) : (
            <b>{avgWin.toFixed(1)}<small>%</small></b>
          )}
        </div>
        <div className="summary-lead">
          <span>{hasPerformance ? '当前领跑' : '已入库分析师'}</span>
          <b>{best.name}</b>
          <small>
            {hasPerformance
              ? `${best.firm} · Alpha ${best.metrics.score.toFixed(1)}`
              : `${best.firm} · 已入库 ${best.metrics.report_count} 篇研报`}
          </small>
          <Award size={34} />
        </div>
      </div>

      <div className={cx('analyst-grid', data.length < 3 && 'is-sparse')}>
        {data.map((analyst, index) => (
          <AnalystCard
            key={analyst.id}
            analyst={analyst}
            rank={index + 1}
            onOpen={() => navigate(`/analysts/${analyst.id}`)}
          />
        ))}
        {data.length < 3 && (
          <div className="analyst-placeholder">
            <span className="analyst-placeholder-icon"><FileUp size={22} /></span>
            <span className="empty-eyebrow">MORE REPORTS / 持续积累</span>
            <b>等待更多研报入库</b>
            <p>新增研报后，这里会自动补充分析师画像、推荐样本与 Alpha 排名。</p>
            <button className="text-button" onClick={() => navigate('/reports')}>
              查看已入库研报 <ArrowUpRight size={14} />
            </button>
          </div>
        )}
      </div>

      <div className="panel analyst-note">
        <span className="note-icon"><Sparkles size={17} /></span>
        <div>
          <b>评分如何理解</b>
          <p>
            Alpha 分 = 50 +（胜率 − 50）× 0.40 + 平均超额 × 2.2，按全部已发布研报滚动计算。
            当前暂无行情数据，Alpha 分暂不计算；分数反映“观点兑现度”，不代表未来收益，也不构成投资建议。
          </p>
        </div>
      </div>
    </div>
  )
}

function AnalystCard({ analyst, rank, onOpen }: { analyst: Analyst; rank: number; onOpen: () => void }) {
  const pending = !analyst.metrics.has_performance
  return (
    <article
      className={cx('analyst-card', rank === 1 && !pending && 'is-top', pending && 'is-pending')}
      onClick={onOpen}
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onOpen()
        }
      }}
    >
      {rank === 1 && (
        pending
          ? <span className="top-ribbon is-pending">REPORT INGESTED</span>
          : <span className="top-ribbon"><Crown size={12} /> ALPHA 领跑</span>
      )}
      <div className="analyst-card-head">
        <span className="analyst-avatar-big" style={{ background: `${analyst.color}1c`, color: analyst.color }}>
          {analyst.avatar}
        </span>
        <div className="analyst-identity">
          <div>
            <h2>{analyst.name}</h2>
            <span className="rank-chip">#{String(rank).padStart(2, '0')}</span>
          </div>
          <p>{analyst.firm} · {analyst.title}</p>
          <span className="analyst-style">
            {analyst.style}{analyst.years > 0 ? ` · ${analyst.years} 年研究经验` : ''}
          </span>
        </div>
        {pending ? (
          <span className="score-pending"><b>待行情</b><small>ALPHA</small></span>
        ) : (
          <ScoreRing score={analyst.metrics.score} />
        )}
      </div>

      <p className="analyst-tagline">“{analyst.tagline}”</p>

      <div className="analyst-metrics">
        <div>
          <span>胜率</span>
          {pending ? <b className="pending-text small">待行情</b> : <b>{analyst.metrics.win_rate.toFixed(1)}<small>%</small></b>}
        </div>
        <div>
          <span>平均超额</span>
          {pending ? (
            <b className="pending-text small">待行情</b>
          ) : (
            <b className={analyst.metrics.avg_excess >= 0 ? 'up' : 'down'}>{pct(analyst.metrics.avg_excess)}</b>
          )}
        </div>
        <div>
          <span>覆盖研报</span>
          <b>{analyst.metrics.report_count}<small> 篇</small></b>
        </div>
      </div>

      {pending ? (
        <div className="analyst-spark-empty">
          <span>超额曲线</span>
          <p>行情接入后生成</p>
        </div>
      ) : (
        <div className="analyst-spark-row">
          <div>
            <span>超额曲线</span>
            <Sparkline values={analyst.spark} width={152} height={38} strokeWidth={1.6} />
          </div>
          <div className="analyst-spark-meta">
            <span>最佳单笔</span>
            <b className="up">{pct(analyst.metrics.best_excess)}</b>
          </div>
        </div>
      )}

      <div className="analyst-industries">
        {analyst.industries.map((industry) => (
          <span className="tag" key={industry}>{industry}</span>
        ))}
      </div>

      <div className="analyst-card-foot">
        <div>
          <span>最新观点</span>
          <b>{analyst.latest_reports[0]?.stock_name ?? '暂无'}</b>
          <small>
            {analyst.latest_report_date ? dateShort(analyst.latest_report_date) : '—'}
            {' · '}
            {analyst.latest_reports[0]?.rating ?? ''}
          </small>
        </div>
        <span className="card-link">分析师专题 <ArrowUpRight size={14} /></span>
      </div>
    </article>
  )
}
