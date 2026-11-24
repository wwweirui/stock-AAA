import { useEffect, useRef } from 'react'
import { Bell, Moon, Search, SlidersHorizontal, Sun } from 'lucide-react'
import { dateDot } from '../lib/format'
import { navigate } from '../lib/hooks'
import { useToast } from './Toast'

interface TopbarProps {
  current: string
  asOf: string
  search: string
  onSearch: (value: string) => void
  theme: 'dark' | 'light'
  onToggleTheme: () => void
  hasData: boolean
}

function crumb(current: string): string {
  if (current === '/overview') return '研究工作台 / 市场总览'
  if (current === '/reports') return '研究工作台 / 研报流'
  if (current === '/methodology') return '研究工作台 / 方法论'
  if (current.startsWith('/analysts/')) return '研究工作台 / 分析师 / 详情'
  if (current.startsWith('/analysts')) return '研究工作台 / 分析师 Alpha'
  return '研究工作台'
}

export function Topbar({ current, asOf, search, onSearch, theme, onToggleTheme, hasData }: TopbarProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const notify = useToast()

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        inputRef.current?.focus()
      }
      if (event.key === 'Escape' && document.activeElement === inputRef.current) {
        inputRef.current?.blur()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <header className="topbar">
      <span className="mobile-brand">研值</span>
      <div className="topbar-crumb">
        <span className="live-dot" />
        <span>{crumb(current)}</span>
      </div>

      <form
        className="global-search"
        onSubmit={(event) => {
          event.preventDefault()
          navigate('/reports')
        }}
        role="search"
      >
        <Search size={16} strokeWidth={1.9} />
        <input
          ref={inputRef}
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="搜索股票、分析师或标签"
          aria-label="全局搜索"
        />
        {search ? (
          <button type="button" className="search-clear" onClick={() => onSearch('')} aria-label="清空搜索">
            清空
          </button>
        ) : (
          <kbd>⌘ K</kbd>
        )}
      </form>

      <div className="topbar-right">
        <span className={`data-badge ${hasData ? '' : 'is-empty'}`}>
          <span className="data-badge-dot" />
          {hasData ? '本地数据' : '空库待导入'}
        </span>
        {hasData && <span className="asof">截至 {dateDot(asOf)}</span>}
        <button
          className="theme-toggle"
          onClick={onToggleTheme}
          aria-pressed={theme === 'light'}
          aria-label={theme === 'dark' ? '切换到日间模式' : '切换到夜间模式'}
          title={theme === 'dark' ? '切换到日间模式' : '切换到夜间模式'}
        >
          {theme === 'dark' ? <Sun size={15} strokeWidth={1.9} /> : <Moon size={15} strokeWidth={1.9} />}
          <span>{theme === 'dark' ? '日间' : '夜间'}</span>
        </button>
        <button className="icon-button" onClick={() => notify('暂无新的跟踪提醒')} aria-label="提醒">
          <Bell size={17} strokeWidth={1.8} />
          <i className="notify-dot" />
        </button>
        <button className="icon-button" onClick={() => notify('筛选器已同步至研报流')} aria-label="筛选">
          <SlidersHorizontal size={17} strokeWidth={1.8} />
        </button>
      </div>
    </header>
  )
}
