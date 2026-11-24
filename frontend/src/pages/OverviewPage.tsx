import { useMemo, useState } from 'react'
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  Download,
  FileUp,
  Flame,
  Gauge,
  RefreshCw,
  ShieldCheck,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react'
import type { Overview } from '../types'
import { api } from '../lib/api'
import { cx, dateDot, pct } from '../lib/format'
import { navigate, useApi } from '../lib/hooks'
import { AnalystLeaderboard } from '../components/AnalystLeaderboard'
import { IntentDonut, MarketGauge, MonthlyBars, PerformanceChart } from '../components/Charts'
import { LatestReports } from '../components/ReportTable'
import { Sparkline } from '../components/Sparkline'
import { EmptyWorkspace, ErrorState, KpiCard, PageHeader, PanelHeader, SkeletonPage } from '../components/UI'
import { useToast } from '../components/Toast'

const RANGES = [
  { key: '30d', label: '近30日', count: 30 },
  { key: '60d', label: '近60日', count: 60 },
  { key: 'all', label: '全部', count: 0 },
]

export function OverviewPage({ onOpenReport }: { onOpenReport: (id: string) => void }) {
  const [range, setRange] = useState('all')
  const [reload, setReload] = useState(0)
  const { data, loading, error } = useApi<Overview>(() => api.overview(), [reload])
  const notify = useToast()

  const chartData = useMemo(() => {
    if (!data) return []
    const count = RANGES.find((item) => item.key === range)?.count ?? 0
    return count ? data.equity.slice(-count) : data.equity
  }, [data, range])

  if (loading && !data) return <SkeletonPage />
  if (error) return <ErrorState message={error} />
  if (!data) return null

  if (!data.has_data) {
    return (
      <div className="page overview-page">
        <PageHeader
          eyebrow="RESEARCH ALPHA DESK / 研究工作台"
          title="市场研究跟踪"
          description="当前为空库。模拟行情与分析数据已全部清空，等待导入真实研报与行情。"
          actions={<span className="empty-status"><span /> 0 篇研报 · 空库</span>}
        />
        <EmptyWorkspace
          icon={FileUp}
          eyebrow="WORKSPACE READY / 等待真实数据"
          title="等待导入跟踪研究报告"
          description="这里将用于验证分析师观点发布后的真实超额。导入研报与对应行情后，市场总览、分析师专题和研报流会自动生成。"
          steps={[
            { title: '上传研报原始文件', text: '将 PDF / Word / Excel 研报放入工作区，或提供可访问的数据源。' },
            { title: '补齐结构化字段', text: '分析师、机构、评级、目标价、发布日期、核心观点与风险提示。' },
            { title: '对齐行情基准', text: '导入覆盖标的日行情与沪深300等基准，统一以发布日收盘价为入场。' },
            { title: '生成跟踪视图', text: '自动计算推荐收益、超额、胜率、推票意图分与分析师 Alpha 评分。' },
          ]}
          note="系统不会自动写入任何模拟数据；导入后本页会自动恢复。"
          action={
            <button className="button ghost" onClick={() => navigate('/methodology')}>
              查看指标口径
            </button>
          }
        />
      </div>
    )
  }

  if (!data.has_performance) {
    const firstReport = data.recent_reports[0]
    const firstAnalyst = data.top_analysts[0]
    const relatedCount = Object.values(firstReport?.related_stocks ?? {}).reduce(
      (sum, group) => sum + group.length,
      0,
    )
    return (
      <div className="page overview-page">
        <PageHeader
          eyebrow="RESEARCH ALPHA DESK / 研究工作台"
          title="市场研究跟踪"
          description="研报已入库，行情尚未接入。完成标的映射与行情导入后，自动生成收益、超额、胜率与组合曲线。"
          actions={<span className="empty-status is-ready"><span /> 研报已入库</span>}
        />
        <div className="pending-summary">
          <div>
            <span>已入库研报</span>
            <b>{data.metrics.report_count}<small> 篇</small></b>
          </div>
          <div>
            <span>分析师</span>
            <b>{data.metrics.analyst_count}<small> 位</small></b>
          </div>
          <div>
            <span>关联标的</span>
            <b>{relatedCount}<small> 个</small></b>
          </div>
          <div>
            <span>表现跟踪</span>
            <b className="pending-text">等待行情</b>
          </div>
        </div>

        <section className="panel ingest-progress">
          <div className="ingest-steps">
            <div className="is-done">
              <span className="ingest-icon"><CheckCircle2 size={18} /></span>
              <div><b>研报已入库</b><small>结构化字段与原文已保存</small></div>
              <em>完成</em>
            </div>
            <span className="ingest-connector" />
            <div className="is-pending">
              <span className="ingest-icon"><CircleDashed size={18} /></span>
              <div><b>行情待接入</b><small>需要覆盖标的日行情与沪深300</small></div>
              <em>待处理</em>
            </div>
            <span className="ingest-connector" />
            <div className="is-pending">
              <span className="ingest-icon"><Activity size={18} /></span>
              <div><b>表现待计算</b><small>收益、超额与组合曲线</small></div>
              <em>待处理</em>
            </div>
          </div>
          <p>
            当前报告为行业研究，未给出个股评级与目标价。导入行情后，可按关联标的等权组合或指定跟踪标的计算表现。
          </p>
        </section>

        <div className="content-grid pending-content">
          <LatestReports
            reports={data.recent_reports}
            onOpen={onOpenReport}
            asOf={data.as_of}
            onViewAll={() => navigate('/reports')}
          />
          <section className="panel pending-analyst-panel">
            <PanelHeader title="已入库分析师" subtitle="研报中的观点归属已建立" compact />
            {firstAnalyst && (
              <button className="pending-analyst" onClick={() => navigate(`/analysts/${firstAnalyst.id}`)}>
                <span className="analyst-avatar-big" style={{ background: `${firstAnalyst.color}1c`, color: firstAnalyst.color }}>
                  {firstAnalyst.avatar}
                </span>
                <span className="pending-analyst-copy">
                  <b>{firstAnalyst.name}</b>
                  <small>{firstAnalyst.firm} · {firstAnalyst.title}</small>
                  <em>{firstAnalyst.industries.join(' / ')}</em>
                </span>
                <ArrowRight size={15} />
              </button>
            )}
            <div className="pending-next">
              <span>下一步</span>
              <p>提供覆盖标的的日行情（代码、日期、收盘价）与沪深300，即可开始计算推荐后表现。</p>
              <button className="button ghost" onClick={() => firstReport && onOpenReport(firstReport.id)}>
                查看已入库研报 <ArrowRight size={14} />
              </button>
            </div>
          </section>
        </div>
      </div>
    )
  }

  const { metrics, market, rating_changes } = data
  const strong = data.intent.find((item) => item.label === '强看多')?.count ?? 0
  const strongPct = (strong / Math.max(metrics.report_count, 1)) * 100
  const lastPoint = chartData[chartData.length - 1]
  const wins = Math.round((metrics.win_rate / 100) * metrics.report_count)

  const exportCsv = async () => {
    try {
      const { items } = await api.reports()
      const header = ['股票', '代码', '分析师', '机构', '评级', '发布日期', '发布以来', '基准', '超额', '推票意图', '标题']
      const rows = items.map((report) => [
        report.stock_name,
        report.stock_code,
        report.analyst.name,
        report.analyst.firm,
        report.rating,
        report.publish_date,
        report.ret,
        report.benchmark_ret,
        report.excess,
        report.intention_label,
        report.title,
      ])
      const csv = [header, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','))
        .join('\n')
      const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `研值-推荐跟踪-${data.as_of}.csv`
      link.click()
      URL.revokeObjectURL(link.href)
      notify('跟踪明细已导出')
    } catch {
      notify('导出失败，请稍后重试')
    }
  }

  return (
    <div className="page overview-page">
      <PageHeader
        eyebrow="RESEARCH ALPHA DESK / 研究工作台"
        title="市场研究跟踪"
        description={
          <>
            追踪分析师观点，验证研报发布后的真实超额。
            <span className="header-meta"> 数据截至 {dateDot(data.as_of)} · 本地数据</span>
          </>
        }
        actions={
          <>
            <button className="button ghost" onClick={() => { setReload((value) => value + 1); notify('数据已刷新') }}>
              <RefreshCw size={15} /> 刷新
            </button>
            <button className="button primary" onClick={exportCsv}>
              <Download size={15} /> 导出跟踪表
            </button>
          </>
        }
      />

      <div className="index-strip">
        <div className="index-strip-lead">
          <span className="eyebrow-line" />
          <div>
            <b>MARKET SNAPSHOT</b>
            <small>主要指数 · 收盘</small>
          </div>
        </div>
        {data.indices.map((index) => (
          <div className="index-quote" key={index.code}>
            <span className="index-name">{index.name}</span>
            <div className="index-value-row">
              <b>{index.value.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</b>
              <span className={cx('index-change', index.change_pct >= 0 ? 'up' : 'down')}>
                {pct(index.change_pct)}
              </span>
            </div>
            <Sparkline
              values={index.spark}
              width={76}
              height={22}
              fill={false}
              strokeWidth={1.2}
              color={index.change_pct >= 0 ? 'var(--up)' : 'var(--down)'}
            />
          </div>
        ))}
        <div className="index-breadth">
          <span>覆盖标的站上20日线</span>
          <b>{market.breadth.toFixed(0)}<small>%</small></b>
        </div>
      </div>

      <section className="kpi-grid">
        <KpiCard
          index="01"
          label="覆盖研报"
          value={String(metrics.report_count)}
          unit="篇"
          note={<><Users size={13} /> {metrics.analyst_count} 位分析师 · {metrics.coverage_count} 只标的</>}
          icon={Activity}
          tone="gold"
        />
        <KpiCard
          index="02"
          label="推荐胜率"
          value={metrics.win_rate.toFixed(1)}
          unit="%"
          note={<><Target size={13} /> {wins} / {metrics.report_count} 条跑赢沪深300</>}
          icon={Target}
          tone="red"
        />
        <KpiCard
          index="03"
          label="平均超额收益"
          value={pct(metrics.avg_excess)}
          note={<><TrendingUp size={13} /> 等权 · 相对基准</>}
          icon={TrendingUp}
          tone={metrics.avg_excess >= 0 ? 'red' : 'green'}
          spark={data.equity.map((point) => point.alpha)}
        />
        <KpiCard
          index="04"
          label="平均最大浮盈"
          value={pct(metrics.avg_max_gain)}
          note={<><ShieldCheck size={13} /> 平均持有 {metrics.avg_holding_days.toFixed(0)} 个交易日</>}
          icon={Gauge}
          tone="blue"
        />
        <KpiCard
          index="05"
          label="强看多占比"
          value={strongPct.toFixed(1)}
          unit="%"
          note={<><Flame size={13} /> {strong} 篇强意图研报</>}
          icon={Flame}
          tone="gold"
        />
      </section>

      <div className="hero-grid">
        <section className="panel equity-panel">
          <PanelHeader
            title="等权推荐组合 vs 沪深300"
            subtitle="按研报发布日入场，以各自持仓天数等权平均，单位：累计收益"
            action={
              <div className="segmented">
                {RANGES.map((item) => (
                  <button
                    key={item.key}
                    className={cx(range === item.key && 'is-active')}
                    onClick={() => setRange(item.key)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            }
          />
          <div className="chart-legend">
            <span><i className="legend-line gold" /> 推荐组合</span>
            <span><i className="legend-line dashed" /> 沪深300</span>
            <span className="legend-hint">累计收益 · 起点归零</span>
          </div>
          <PerformanceChart data={chartData} height={368} />
          <div className="chart-footer">
            <div>
              <span>组合收益</span>
              <b className={cx(lastPoint?.portfolio >= 0 ? 'up' : 'down')}>{pct(lastPoint?.portfolio ?? 0)}</b>
            </div>
            <div>
              <span>基准收益</span>
              <b>{pct(lastPoint?.benchmark ?? 0)}</b>
            </div>
            <div className="highlight">
              <span>区间超额</span>
              <b>{pct(lastPoint?.alpha ?? 0)}</b>
            </div>
            <div className="chart-footer-note">
              <Activity size={14} />
              当前样本 {chartData.length} 个交易日
            </div>
          </div>
        </section>

        <aside className="hero-side">
          <section className="panel market-panel">
            <PanelHeader
              title="市场温度"
              subtitle="指数趋势 × 覆盖标的广度"
              action={<span className={cx('regime-badge', `regime-${market.regime}`)}>{market.regime}</span>}
              compact
            />
            <div className="market-gauge-row">
              <MarketGauge value={market.temperature} regime={market.regime} />
              <div className="market-facts">
                <div>
                  <span>沪深300 · 20日</span>
                  <b className={market.bench_ret_20d >= 0 ? 'up' : 'down'}>{pct(market.bench_ret_20d)}</b>
                </div>
                <div>
                  <span>沪深300 · 60日</span>
                  <b className={market.bench_ret_60d >= 0 ? 'up' : 'down'}>{pct(market.bench_ret_60d)}</b>
                </div>
                <div>
                  <span>均线状态</span>
                  <b>{market.above_ma20 ? '站上20日线' : '跌破20日线'}</b>
                </div>
              </div>
            </div>
            <p className="market-note">{market.note}</p>
            <div className="market-structure">
              <span>结构主线</span>
              <b>{market.top_industry ?? '暂无'}</b>
              <span className="market-structure-arrow">
                覆盖标的20日平均 {pct(market.avg_stock_20d)}
                <ArrowRight size={13} />
              </span>
            </div>
          </section>

          <section className="panel intent-panel">
            <PanelHeader title="推票意图分布" subtitle="基于评级 / 空间 / 催化 / 一致性" compact />
            <IntentDonut data={data.intent} />
            <div className="rating-changes">
              <div><b>{rating_changes.upgrades}</b><span>评级上调</span></div>
              <div><b>{rating_changes.maintained}</b><span>维持评级</span></div>
              <div><b className="down">{rating_changes.downgrades}</b><span>评级下调</span></div>
            </div>
          </section>
        </aside>
      </div>

      <div className="content-grid">
        <LatestReports
          reports={data.recent_reports}
          onOpen={onOpenReport}
          asOf={data.as_of}
          onViewAll={() => navigate('/reports')}
        />
        <AnalystLeaderboard
          analysts={data.top_analysts}
          onOpen={(id) => navigate(`/analysts/${id}`)}
          onViewAll={() => navigate('/analysts')}
        />
      </div>

      <div className="analytics-grid">
        <section className="panel">
          <PanelHeader title="月度推荐超额" subtitle="按研报发布月份 · 平均相对收益" compact />
          <MonthlyBars data={data.monthly} height={188} />
          <div className="panel-footnote">
            <span><i className="dot-red" /> 正超额</span>
            <span><i className="dot-green" /> 负超额</span>
            <span>样本随发布月份累积</span>
          </div>
        </section>

        <section className="panel industry-panel">
          <PanelHeader title="行业超额分布" subtitle="推荐后相对沪深300的平均表现" compact />
          <div className="industry-list">
            {data.industries.slice(0, 6).map((industry) => {
              const maxAbs = Math.max(...data.industries.map((item) => Math.abs(item.avg_excess)), 1)
              const width = Math.min((Math.abs(industry.avg_excess) / maxAbs) * 48, 48)
              return (
                <div className="industry-row" key={industry.name}>
                  <div className="industry-row-head">
                    <span>
                      {industry.name}
                      <small>{industry.count} 篇</small>
                    </span>
                    <b className={industry.avg_excess >= 0 ? 'up' : 'down'}>{pct(industry.avg_excess)}</b>
                  </div>
                  <div className="industry-track">
                    <i className="industry-center" />
                    <i
                      className={cx('industry-bar', industry.avg_excess >= 0 ? 'is-up' : 'is-down')}
                      style={{
                        left: industry.avg_excess >= 0 ? '50%' : `${50 - width}%`,
                        width: `${width}%`,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
