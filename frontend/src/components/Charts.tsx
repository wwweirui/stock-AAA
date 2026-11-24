import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { EquityPoint } from '../types'
import { dateTick, pct } from '../lib/format'

function EquityTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <div className="tooltip-date">{label}</div>
      {payload.map((item: any) => (
        <div className="tooltip-row" key={item.dataKey}>
          <span>
            <i style={{ background: item.color }} />
            {item.name}
          </span>
          <b className={item.value >= 0 ? 'up' : 'down'}>{pct(item.value)}</b>
        </div>
      ))}
    </div>
  )
}

export function PerformanceChart({ data, height = 286 }: { data: EquityPoint[]; height?: number }) {
  if (!data.length) return <div className="chart-empty">暂无足够的表现数据</div>
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="portfolioFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-gold)" stopOpacity={0.26} />
              <stop offset="78%" stopColor="var(--chart-gold)" stopOpacity={0.015} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={dateTick}
            axisLine={false}
            tickLine={false}
            minTickGap={38}
            tick={{ fill: 'var(--chart-axis)', fontSize: 11 }}
            dy={8}
          />
          <YAxis
            tickFormatter={(value) => `${value}%`}
            axisLine={false}
            tickLine={false}
            width={52}
            tick={{ fill: 'var(--chart-axis)', fontSize: 11 }}
          />
          <Tooltip content={<EquityTooltip />} cursor={{ stroke: 'var(--chart-cursor)', strokeDasharray: '3 4' }} />
          <ReferenceLine y={0} stroke="var(--chart-grid-strong)" strokeDasharray="3 4" />
          <Area
            type="monotone"
            dataKey="portfolio"
            name="推荐组合"
            stroke="var(--chart-gold-bright)"
            strokeWidth={2.1}
            fill="url(#portfolioFill)"
            activeDot={{ r: 4, fill: 'var(--chart-gold-soft)', stroke: 'var(--chart-dot-stroke)', strokeWidth: 2 }}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="benchmark"
            name="沪深300"
            stroke="var(--chart-benchmark)"
            strokeWidth={1.5}
            strokeDasharray="5 5"
            dot={false}
            activeDot={{ r: 3, fill: 'var(--chart-benchmark)', stroke: 'var(--chart-dot-stroke)', strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

const INTENT_COLORS: Record<string, string> = {
  强看多: 'var(--intent-strong)',
  积极看多: 'var(--intent-positive)',
  审慎看多: 'var(--intent-cautious)',
  中性观察: 'var(--intent-neutral)',
}

export function IntentDonut({
  data,
  height = 152,
}: {
  data: { label: string; count: number }[]
  height?: number
}) {
  const total = data.reduce((sum, item) => sum + item.count, 0)
  const formatted = data.map((item) => ({ ...item, color: INTENT_COLORS[item.label] ?? 'var(--intent-cautious)' }))
  return (
    <div className="intent-donut-wrap">
      <div className="intent-donut" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={formatted}
              dataKey="count"
              nameKey="label"
              innerRadius="66%"
              outerRadius="92%"
              paddingAngle={3}
              stroke="none"
              startAngle={90}
              endAngle={-270}
              isAnimationActive={false}
            >
              {formatted.map((item) => (
                <Cell key={item.label} fill={item.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: 'var(--chart-tooltip-bg)',
                border: '1px solid var(--chart-tooltip-border)',
                borderRadius: 10,
                fontSize: 12,
              }}
              itemStyle={{ color: 'var(--chart-tooltip-text)' }}
              formatter={(value: number) => [`${value} 篇`, '研报']}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="donut-center">
          <b>{total}</b>
          <span>跟踪研报</span>
        </div>
      </div>
      <div className="intent-legend">
        {formatted.map((item) => (
          <div className="intent-legend-row" key={item.label}>
            <span>
              <i style={{ background: item.color }} />
              {item.label}
            </span>
            <b>{item.count}</b>
          </div>
        ))}
      </div>
    </div>
  )
}

function MonthlyTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const item = payload[0].payload
  return (
    <div className="chart-tooltip">
      <div className="tooltip-date">{item.month.replace('-', ' 年 ')} 月</div>
      <div className="tooltip-row">
        <span>平均超额</span>
        <b className={item.excess >= 0 ? 'up' : 'down'}>{pct(item.excess)}</b>
      </div>
      <div className="tooltip-row">
        <span>研报数量</span>
        <b>{item.count} 篇</b>
      </div>
    </div>
  )
}

export function MonthlyBars({ data, height = 176 }: { data: { label: string; excess: number; count: number; month: string }[]; height?: number }) {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 4, left: -22, bottom: 0 }} barCategoryGap="34%">
          <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--chart-axis)', fontSize: 11 }}
            dy={6}
          />
          <YAxis
            tickFormatter={(value) => `${value}%`}
            axisLine={false}
            tickLine={false}
            width={46}
            tick={{ fill: 'var(--chart-axis)', fontSize: 10 }}
          />
          <Tooltip content={<MonthlyTooltip />} cursor={{ fill: 'var(--chart-cursor-fill)' }} />
          <ReferenceLine y={0} stroke="var(--chart-grid-strong)" />
          <Bar dataKey="excess" radius={[4, 4, 0, 0]} maxBarSize={38} isAnimationActive={false}>
            {data.map((item) => (
              <Cell key={item.label} fill={item.excess >= 0 ? 'var(--up)' : 'var(--down)'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function MarketGauge({ value, regime }: { value: number; regime: string }) {
  const angle = Math.PI * (1 - value / 100)
  const tipX = 100 + 64 * Math.cos(angle)
  const tipY = 98 - 64 * Math.sin(angle)
  return (
    <div className="market-gauge">
      <svg viewBox="0 0 200 116" role="img" aria-label={`市场温度 ${value}`}>
        <defs>
          <linearGradient id="gaugeGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--gauge-good)" />
            <stop offset="52%" stopColor="var(--chart-gold)" />
            <stop offset="100%" stopColor="var(--up)" />
          </linearGradient>
        </defs>
        <path d="M20 98 A80 80 0 0 1 180 98" pathLength="100" className="gauge-track" />
        <path
          d="M20 98 A80 80 0 0 1 180 98"
          pathLength="100"
          className="gauge-progress"
          strokeDasharray={`${value} 100`}
        />
        <line x1="100" y1="98" x2={tipX} y2={tipY} className="gauge-needle" />
        <circle cx={tipX} cy={tipY} r="4.5" className="gauge-tip" />
        <circle cx="100" cy="98" r="6" className="gauge-hub" />
        <text x="17" y="113" className="gauge-tick">0</text>
        <text x="94" y="14" className="gauge-tick">50</text>
        <text x="174" y="113" className="gauge-tick">100</text>
      </svg>
      <div className="gauge-center">
        <strong>{value.toFixed(0)}</strong>
      </div>
    </div>
  )
}

export function StyleRadar({ scores }: { scores: Record<string, number> }) {
  const data = Object.entries(scores).map(([name, value]) => ({ name, value }))
  return (
    <div className="radar-wrap">
      <ResponsiveContainer width="100%" height={236}>
        <RadarChart data={data} outerRadius="68%">
          <PolarGrid stroke="var(--chart-grid-strong)" />
          <PolarAngleAxis dataKey="name" tick={{ fill: 'var(--chart-axis)', fontSize: 11 }} />
          <Radar
            dataKey="value"
            stroke="var(--chart-gold)"
            strokeWidth={1.8}
            fill="var(--chart-gold)"
            fillOpacity={0.14}
            dot={{ r: 2.5, fill: 'var(--chart-gold-bright)' }}
            isAnimationActive={false}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--chart-tooltip-bg)',
              border: '1px solid var(--chart-tooltip-border)',
              borderRadius: 10,
              fontSize: 12,
            }}
            itemStyle={{ color: 'var(--chart-tooltip-text)' }}
            formatter={(value: number) => [`${value}`, '评分']}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function ReportPathChart({ data, height = 240 }: { data: { date: string; stock: number; benchmark: number }[]; height?: number }) {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ top: 10, right: 6, left: -22, bottom: 0 }}>
          <defs>
            <linearGradient id="reportStockFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-gold)" stopOpacity={0.2} />
              <stop offset="100%" stopColor="var(--chart-gold)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={dateTick}
            axisLine={false}
            tickLine={false}
            minTickGap={34}
            tick={{ fill: 'var(--chart-axis)', fontSize: 10 }}
            dy={6}
          />
          <YAxis
            tickFormatter={(value) => `${value}`}
            axisLine={false}
            tickLine={false}
            width={46}
            tick={{ fill: 'var(--chart-axis)', fontSize: 10 }}
            domain={['auto', 'auto']}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--chart-tooltip-bg)',
              border: '1px solid var(--chart-tooltip-border)',
              borderRadius: 10,
              fontSize: 12,
            }}
            itemStyle={{ color: 'var(--chart-tooltip-text)' }}
            labelStyle={{ color: 'var(--chart-tooltip-label)', marginBottom: 4 }}
            formatter={(value: number, name: string) => [`${Number(value).toFixed(2)}`, name === 'stock' ? '个股' : '沪深300']}
          />
          <ReferenceLine y={100} stroke="var(--chart-grid-strong)" strokeDasharray="3 4" />
          <Area type="monotone" dataKey="stock" name="stock" stroke="var(--chart-gold-bright)" strokeWidth={2} fill="url(#reportStockFill)" dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="benchmark" name="benchmark" stroke="var(--chart-benchmark)" strokeWidth={1.4} strokeDasharray="5 5" dot={false} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
