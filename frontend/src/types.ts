export interface AnalystLite {
  id: string
  name: string
  firm: string
  title: string
  avatar: string
  color: string
  style: string
}

export interface SeriesPoint {
  date: string
  stock: number
  benchmark: number
}

export interface Report {
  id: string
  stock_code: string
  stock_name: string
  industry: string
  title: string
  rating: string
  prev_rating: string | null
  target_price: number | null
  target_upside: number | null
  publish_date: string
  report_type: string
  scope: 'stock' | 'industry'
  tags: string[]
  related_stocks: Record<string, string[]>
  source_url: string
  source_name: string
  has_content: boolean
  content?: string
  summary: string
  key_points: string[]
  risks: string[]
  catalyst_score: number
  conviction_score: number
  intention_score: number
  intention_label: string
  intention_note: string
  analyst: AnalystLite
  entry_price: number | null
  latest_price: number | null
  latest_date: string | null
  ret: number | null
  benchmark_ret: number | null
  excess: number | null
  max_gain: number | null
  max_drawdown: number | null
  target_progress: number | null
  holding_days: number
  status: 'tracking' | 'settled' | 'pending'
  performance_status: 'tracked' | 'pending'
  pending_reason: string | null
  spark: number[]
  series: SeriesPoint[]
  intent_breakdown?: { name: string; score: number; max: number }[]
  related?: Report[]
}

export interface AnalystMetrics {
  report_count: number
  win_rate: number
  avg_excess: number
  avg_return: number
  avg_max_gain: number
  avg_holding_days: number
  active_count: number
  priced_count: number
  unpriced_count: number
  has_performance: boolean
  score: number
  best_excess: number
  worst_excess: number
  avg_intention: number
}

export interface Analyst {
  id: string
  name: string
  firm: string
  title: string
  style: string
  industries: string[]
  years: number
  avatar: string
  color: string
  tagline: string
  bio: string
  style_scores: Record<string, number>
  metrics: AnalystMetrics
  spark: number[]
  latest_report_date: string | null
  latest_reports: Report[]
  equity?: EquityPoint[]
  reports?: Report[]
  industry_breakdown?: { name: string; count: number; priced_count: number; avg_excess: number | null; win_rate: number | null }[]
  rating_breakdown?: { label: string; count: number }[]
  intent_breakdown?: { label: string; count: number }[]
}

export interface EquityPoint {
  date: string
  portfolio: number
  benchmark: number
  alpha: number
}

export interface MarketPulse {
  temperature: number
  regime: string
  bench_ret_20d: number
  bench_ret_60d: number
  bench_ma20: number
  bench_ma60: number
  above_ma20: boolean
  breadth: number
  avg_stock_20d: number
  top_industry: string | null
  note: string
}

export interface IndexQuote {
  code: string
  name: string
  value: number
  change_pct: number
  spark: number[]
}

export interface Overview {
  as_of: string | null
  demo: boolean
  has_data: boolean
  has_performance: boolean
  metrics: AnalystMetrics & {
    analyst_count: number
    coverage_count: number
    top_score: number
  }
  indices: IndexQuote[]
  equity: EquityPoint[]
  range_dates: { start: string; end: string }
  monthly: { month: string; label: string; excess: number; count: number }[]
  intent: { label: string; count: number }[]
  ratings: { label: string; count: number }[]
  industries: { name: string; count: number; avg_excess: number; win_rate: number }[]
  top_analysts: Analyst[]
  recent_reports: Report[]
  market: MarketPulse
  rating_changes: { upgrades: number; downgrades: number; maintained: number }
  market_note: string
}
