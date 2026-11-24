import { ArrowUpRight, Crown } from 'lucide-react'
import type { Analyst } from '../types'
import { cx, pct } from '../lib/format'
import { Sparkline } from './Sparkline'

export function AnalystLeaderboard({
  analysts,
  onOpen,
  onViewAll,
}: {
  analysts: Analyst[]
  onOpen: (id: string) => void
  onViewAll: () => void
}) {
  return (
    <section className="panel leaderboard-panel">
      <div className="panel-header">
        <div>
          <h2>分析师 Alpha 榜</h2>
          <p>胜率 × 超额 × 观点强度</p>
        </div>
        <button className="text-button" onClick={onViewAll}>
          完整榜单
          <ArrowUpRight size={14} />
        </button>
      </div>
      <div className="leaderboard">
        {analysts.map((analyst, index) => (
          <button
            className={cx('leader-row', index === 0 && 'is-first')}
            key={analyst.id}
            onClick={() => onOpen(analyst.id)}
          >
            <span className={cx('rank-no', index === 0 && 'is-gold')}>
              {index === 0 ? <Crown size={14} /> : String(index + 1).padStart(2, '0')}
            </span>
            <span className="leader-avatar" style={{ background: `${analyst.color}1f`, color: analyst.color }}>
              {analyst.avatar}
            </span>
            <span className="leader-copy">
              <b>{analyst.name}</b>
              <small>
                {analyst.firm} · {analyst.style}
              </small>
            </span>
            <span className="leader-spark">
              <Sparkline values={analyst.spark} width={44} height={22} fill={false} strokeWidth={1.3} />
            </span>
            <span className="leader-stat">
              <b className={analyst.metrics.avg_excess >= 0 ? 'up' : 'down'}>{pct(analyst.metrics.avg_excess)}</b>
              <small>胜率 {analyst.metrics.win_rate.toFixed(0)}%</small>
            </span>
            <span className="leader-score">{analyst.metrics.score.toFixed(1)}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
