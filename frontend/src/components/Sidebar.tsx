import { Database, FileText, FlaskConical, LayoutDashboard, Users } from 'lucide-react'
import { cx } from '../lib/format'
import { navigate } from '../lib/hooks'

const NAV = [
  { path: '/overview', label: '总览', en: 'OVERVIEW', icon: LayoutDashboard },
  { path: '/analysts', label: '分析师', en: 'ANALYSTS', icon: Users },
  { path: '/reports', label: '研报流', en: 'REPORTS', icon: FileText },
  { path: '/methodology', label: '方法论', en: 'METHOD', icon: FlaskConical },
]

function isActive(current: string, path: string) {
  return current === path || (path !== '/overview' && current.startsWith(path))
}

export function Sidebar({ current }: { current: string }) {
  return (
    <aside className="sidebar">
      <button className="brand" onClick={() => navigate('/overview')} aria-label="返回总览">
        <span className="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 32 32" fill="none">
            <path d="M7 23V13M13 26V8M19 21V11M25 24V6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
            <path d="M4 27H28" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity=".45" />
            <circle cx="25" cy="6" r="2.5" fill="currentColor" />
          </svg>
        </span>
        <span className="brand-copy">
          <strong>研值</strong>
          <small>ALPHA TRACK</small>
        </span>
      </button>

      <div className="sidebar-section-label">研究工作台</div>
      <nav className="side-nav" aria-label="主导航">
        {NAV.map(({ path, label, en, icon: Icon }) => (
          <button
            key={path}
            className={cx('nav-item', isActive(current, path) && 'is-active')}
            onClick={() => navigate(path)}
            title={label}
          >
            <Icon size={18} strokeWidth={1.8} />
            <span className="nav-copy">
              {label}
              <small>{en}</small>
            </span>
            {isActive(current, path) && <i className="nav-indicator" />}
          </button>
        ))}
      </nav>

      <div className="sidebar-spacer" />

      <div className="sidebar-db">
        <span className="db-icon">
          <Database size={15} />
        </span>
        <div>
          <b>SQLite 数据底座</b>
          <p>研报 · 行情 · 推荐表现持久化</p>
        </div>
        <span className="db-status" title="本地数据库已连接" />
      </div>

      <div className="sidebar-foot">
        <p>本地研究工作台 · 数据来自你的研报</p>
        <span>v0.1.0 / 2026</span>
      </div>
    </aside>
  )
}
