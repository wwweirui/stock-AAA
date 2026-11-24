import { useMemo, useState } from 'react'
import { ArrowUpRight, FileUp, Search, SlidersHorizontal, X } from 'lucide-react'
import type { Report } from '../types'
import { api } from '../lib/api'
import { cx, dateShort, pct, relativeDays, signedClass } from '../lib/format'
import { useApi } from '../lib/hooks'
import { Avatar, IntentBadge, RatingBadge } from '../components/Badges'
import { EmptyWorkspace, ErrorState, LoadingState, PageHeader } from '../components/UI'
import { useToast } from '../components/Toast'

const RATINGS = [
  { key: '全部', label: '全部' },
  { key: '买入', label: '买入' },
  { key: '增持', label: '增持' },
  { key: '中性', label: '中性' },
  { key: '行业周报', label: '行业' },
]
const SORTS = [
  { key: 'date', label: '最新发布' },
  { key: 'excess', label: '超额最高' },
  { key: 'intent', label: '意图最强' },
]

export function ReportsPage({
  search,
  onSearch,
  onOpenReport,
  asOf,
}: {
  search: string
  onSearch: (value: string) => void
  onOpenReport: (id: string) => void
  asOf: string
}) {
  const [rating, setRating] = useState('全部')
  const [sort, setSort] = useState('date')
  const { data, loading, error } = useApi(() => api.reports(), [])
  const notify = useToast()

  const reports = useMemo(() => {
    let items = data?.items ?? []
    if (rating !== '全部') items = items.filter((item) => item.rating === rating)
    const query = search.trim().toLowerCase()
    if (query) {
      items = items.filter(
        (item) =>
          item.stock_name.toLowerCase().includes(query) ||
          item.stock_code.includes(query) ||
          item.title.toLowerCase().includes(query) ||
          item.analyst.name.toLowerCase().includes(query) ||
          item.tags.some((tag) => tag.toLowerCase().includes(query)),
      )
    }
    return [...items].sort((a, b) => {
      if (sort === 'excess') return (b.excess ?? -999) - (a.excess ?? -999)
      if (sort === 'intent') return b.intention_score - a.intention_score
      return b.publish_date.localeCompare(a.publish_date)
    })
  }, [data, rating, search, sort])

  const pendingOnly = Boolean(data?.items.length) && data!.items.every((item) => item.performance_status === 'pending')

  if (!loading && !error && data && data.total === 0) {
    return (
      <div className="page reports-page">
        <PageHeader
          eyebrow="RESEARCH FEED / 观点流水"
          title="研报流"
          description="当前为空库。导入第一份跟踪研报后，这里会自动形成可检索、可筛选的观点流。"
          actions={<span className="empty-status"><span /> 0 篇研报</span>}
        />
        <EmptyWorkspace
          icon={FileUp}
          eyebrow="NO REPORTS / 等待研报"
          title="等待导入第一份研报"
          description="研报是整套跟踪链路的起点。研报入库后，系统会解析分析师、评级、目标价与核心观点，再与行情对齐计算后续表现。"
          steps={[
            { title: '研报文件', text: 'PDF / Word / Excel 或结构化表格均可，先放入工作区。' },
            { title: '字段校验', text: '确认分析师、机构、股票代码、评级、目标价和发布日期完整。' },
            { title: '行情对齐', text: '没有行情也能先入库，但推荐表现要等行情接入后计算。' },
          ]}
          note="模拟研报已全部清空；导入后本页会自动显示研报卡片。"
          action={<button className="button ghost" onClick={() => notify('请把研报文件放入工作区，或提供文件路径 / 数据源')}>如何导入？</button>}
        />
      </div>
    )
  }

  return (
    <div className="page reports-page">
      <PageHeader
        eyebrow="RESEARCH FEED / 观点流水"
        title="研报流"
        description={
          <>
            从观点到价格，逐条核验每份研报的推票意图与后续表现。
            <span className="header-meta">
              {pendingOnly ? '研报已入库 · 行情待接入' : `数据截至 ${asOf === '—' ? '—' : asOf.replaceAll('-', '.')}`} · 共 {data?.total ?? 0} 篇
            </span>
          </>
        }
        actions={
          <button className="button primary" onClick={() => notify('请提供研报文件与行情源，接入后此处会显示导入状态')}>
            <SlidersHorizontal size={15} /> 数据接入
          </button>
        }
      />

      <div className="filter-bar panel">
        <div className="filter-search">
          <Search size={16} />
          <input
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="搜索股票、分析师、观点或标签"
            aria-label="搜索研报"
          />
          {search && (
            <button onClick={() => onSearch('')} aria-label="清空搜索">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="filter-divider" />
        <div className="filter-chips">
          {RATINGS.map((item) => (
            <button
              key={item.key}
              className={cx('filter-chip', rating === item.key && 'is-active')}
              onClick={() => setRating(item.key)}
            >
              {item.label}
              {item.key !== '全部' && (
                <span>{(data?.items ?? []).filter((report) => report.rating === item.key).length}</span>
              )}
            </button>
          ))}
        </div>
        <div className="sort-select">
          <span>排序</span>
          <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="排序方式">
            {SORTS.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="results-head">
        <span>
          共 <b>{reports.length}</b> 篇研报
          {search && <>，匹配 “{search}”</>}
        </span>
        <span className="results-hint">
          <i className="live-dot" /> 价格跟踪已更新至最新交易日
        </span>
      </div>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {!loading && !error && reports.length === 0 && (
        <div className="empty-panel">
          <Search size={24} />
          <b>没有找到匹配的研报</b>
          <p>尝试更换关键词，或切换到“全部”评级。</p>
          <button className="button ghost" onClick={() => { onSearch(''); setRating('全部') }}>
            重置筛选
          </button>
        </div>
      )}

      <div className="report-grid">
        {reports.map((report) => (
          <ReportCard key={report.id} report={report} onOpen={onOpenReport} asOf={asOf} />
        ))}
      </div>
    </div>
  )
}

function ReportCard({
  report,
  onOpen,
  asOf,
}: {
  report: Report
  onOpen: (id: string) => void
  asOf: string
}) {
  const pending = report.performance_status === 'pending'
  const relatedCount = Object.values(report.related_stocks ?? {}).reduce((sum, group) => sum + group.length, 0)
  return (
    <article
      className="report-card"
      onClick={() => onOpen(report.id)}
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onOpen(report.id)
        }
      }}
    >
      <div className="report-card-top">
        <div className="stock-lockup">
          <span className="stock-symbol" style={{ borderColor: `${report.analyst.color}55` }}>
            {report.stock_name.slice(0, 1)}
          </span>
          <div>
            <b>{report.stock_name}</b>
            <span>
              {report.scope === 'industry'
                ? `行业研究 · ${report.industry}`
                : `${report.stock_code} · ${report.industry}`}
            </span>
          </div>
        </div>
        <div className="report-card-date">
          <span>{dateShort(report.publish_date)}</span>
          <small>{relativeDays(report.publish_date, pending ? null : asOf)}</small>
        </div>
      </div>

      <h3 className="report-card-title">{report.title}</h3>

      <div className="report-card-meta">
        <div className="analyst-inline">
          <Avatar analyst={report.analyst} size="xs" />
          <span>{report.analyst.name}</span>
          <small>{report.analyst.firm}</small>
        </div>
        <RatingBadge rating={report.rating} />
      </div>

      <div className="report-card-tags">
        {report.tags.slice(0, 3).map((tag) => (
          <span className="tag" key={tag}>{tag}</span>
        ))}
      </div>

      {pending ? (
        <>
          <div className="report-card-performance is-pending">
            <div>
              <span>行情状态</span>
              <b className="pending-text">待接入</b>
            </div>
            <div>
              <span>关联标的</span>
              <b>{relatedCount}<small> 个</small></b>
            </div>
            <div>
              <span>目标空间</span>
              <b>未给出</b>
            </div>
            <div>
              <span>观点强度</span>
              <b>{report.intention_score.toFixed(0)}</b>
            </div>
          </div>
          <div className="report-pending-note">
            <span className="pending-dot" />
            {report.pending_reason ?? '行情接入后计算收益与超额'}
          </div>
        </>
      ) : (
        <div className="report-card-performance">
          <div>
            <span>发布以来</span>
            <b className={signedClass(report.ret ?? 0)}>{pct(report.ret ?? 0)}</b>
          </div>
          <div>
            <span>相对基准</span>
            <b className={signedClass(report.excess ?? 0)}>{pct(report.excess ?? 0)}</b>
          </div>
          <div>
            <span>目标空间</span>
            <b>{report.target_upside === null ? '未给出' : pct(report.target_upside * 100, false, 1)}</b>
          </div>
          <div>
            <span>持有</span>
            <b>{report.holding_days}<small> 日</small></b>
          </div>
        </div>
      )}

      <div className="report-card-foot">
        <IntentBadge label={report.intention_label} score={report.intention_score} />
        <span className="card-link">
          查看逻辑 <ArrowUpRight size={14} />
        </span>
      </div>
    </article>
  )
}
