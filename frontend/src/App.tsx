import { useEffect, useState } from 'react'
import { api } from './lib/api'
import { navigate, useApi, useHashRoute } from './lib/hooks'
import { Sidebar } from './components/Sidebar'
import { Topbar } from './components/Topbar'
import { ReportDrawer } from './components/ReportDrawer'
import { ToastProvider } from './components/Toast'
import { OverviewPage } from './pages/OverviewPage'
import { AnalystsPage } from './pages/AnalystsPage'
import { AnalystPage } from './pages/AnalystPage'
import { ReportsPage } from './pages/ReportsPage'
import { MethodologyPage } from './pages/MethodologyPage'
import { Compass } from 'lucide-react'

type Meta = { as_of: string | null; report_count: number; analyst_count: number; has_data: boolean; demo: boolean; source: string }
type Theme = 'dark' | 'light'

export function App() {
  const path = useHashRoute()
  const [search, setSearch] = useState('')
  const [reportId, setReportId] = useState<string | null>(null)
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.dataset.theme === 'light' ? 'light' : 'dark',
  )
  const { data: meta } = useApi<Meta>(() => api.meta(), [])
  const asOf = meta?.as_of ?? '—'

  useEffect(() => {
    if (!window.location.hash) window.location.hash = '/overview'
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      window.localStorage.setItem('yanzhi-theme', theme)
    } catch {
      // Private browsing can reject localStorage; the in-memory theme still works.
    }
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'light' ? '#f3f6fa' : '#06090f')
  }, [theme])

  useEffect(() => {
    const name = path === '/overview' || path === '/'
      ? '市场总览'
      : path.startsWith('/analysts/')
        ? '分析师专题'
        : path.startsWith('/analysts')
          ? '分析师 Alpha 榜'
          : path.startsWith('/reports')
            ? '研报流'
            : path === '/methodology'
              ? '方法论'
              : '研究工作台'
    document.title = `${name} · 研值`
  }, [path])

  const openAnalyst = (id: string) => {
    setReportId(null)
    navigate(`/analysts/${id}`)
  }

  const deepReportId = path.startsWith('/reports/') ? decodeURIComponent(path.split('/')[2] ?? '') : null
  const openReport = (id: string) => setReportId(id)
  const activeReportId = reportId ?? deepReportId

  let page = null
  if (path === '/' || path === '/overview') {
    page = <OverviewPage onOpenReport={openReport} />
  } else if (path === '/analysts') {
    page = <AnalystsPage />
  } else if (path.startsWith('/analysts/')) {
    page = <AnalystPage id={decodeURIComponent(path.split('/')[2] ?? '')} onOpenReport={openReport} />
  } else if (path === '/reports' || path.startsWith('/reports/')) {
    page = <ReportsPage search={search} onSearch={setSearch} onOpenReport={openReport} asOf={asOf} />
  } else if (path === '/methodology') {
    page = <MethodologyPage />
  } else {
    page = (
      <div className="not-found">
        <Compass size={34} />
        <h2>页面不存在</h2>
        <p>这条研究路径还没有被收录。</p>
        <button className="button primary" onClick={() => navigate('/overview')}>回到总览</button>
      </div>
    )
  }

  return (
    <ToastProvider>
      <div className="app-shell">
        <Sidebar current={path} />
        <div className="app-main">
          <Topbar
            current={path}
            asOf={asOf}
            search={search}
            onSearch={setSearch}
            theme={theme}
            onToggleTheme={() => setTheme((value) => (value === 'dark' ? 'light' : 'dark'))}
            hasData={Boolean(meta?.has_data)}
          />
          <main className="page-wrap">{page}</main>
        </div>
        {activeReportId && (
          <ReportDrawer
            reportId={activeReportId}
            onClose={() => {
              setReportId(null)
              if (deepReportId) navigate('/reports')
            }}
            onOpenAnalyst={openAnalyst}
            onOpenReport={setReportId}
          />
        )}
      </div>
    </ToastProvider>
  )
}
