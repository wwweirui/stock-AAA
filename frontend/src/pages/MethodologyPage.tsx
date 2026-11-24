import { ArrowDown, Database, FileCheck2, Fingerprint, LineChart, Scale, ShieldAlert } from 'lucide-react'
import { PageHeader, PanelHeader } from '../components/UI'

const STEPS = [
  {
    no: '01',
    title: '研报入库',
    text: '记录分析师、机构、评级、目标价、发布时间与核心观点，保留评级变动的前后状态。',
  },
  {
    no: '02',
    title: '观点结构化',
    text: '把摘要拆为看多理由、催化剂与风险，并计算推票意图分，避免只用一个评级概括全部信息。',
  },
  {
    no: '03',
    title: '行情对齐',
    text: '以研报发布日收盘价为入场基准，逐日计算个股与沪深300的累计收益，统一可比口径。',
  },
  {
    no: '04',
    title: '效果归因',
    text: '按分析师、行业、评级与月份聚合胜率、平均超额、最大浮盈，持续更新 Alpha 排名。',
  },
]

export function MethodologyPage() {
  return (
    <div className="page methodology-page">
      <PageHeader
        eyebrow="METHODOLOGY / 口径与边界"
        title="我们如何验证一个观点"
        description="把“说了什么”与“后来怎样”放在同一条时间轴上，尽量减少叙事带来的偏差。"
      />

      <section className="method-hero panel">
        <div className="method-quote">
          <span className="quote-mark">“</span>
          <p>
            分析师的长期价值，不在于某一次判断有多笃定，而在于观点被市场验证的概率与幅度。
          </p>
          <span className="quote-source">— 研值 · 研究工作台</span>
        </div>
        <div className="method-formula">
          <span>ALPHA SCORE</span>
          <div className="formula">50 + (胜率 − 50) × 0.40 + 平均超额 × 2.2</div>
          <small>分数区间 40–96，按全部已发布研报滚动计算。</small>
        </div>
      </section>

      <div className="method-steps">
        {STEPS.map((step, index) => (
          <div className="method-step panel" key={step.no}>
            <span className="step-no">{step.no}</span>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
            {index < STEPS.length - 1 && <ArrowDown className="step-arrow" size={16} />}
          </div>
        ))}
      </div>

      <div className="method-grid">
        <section className="panel">
          <PanelHeader title="核心指标口径" subtitle="所有收益均以研报发布日收盘价为起点" />
          <div className="metric-defs">
            <div>
              <span className="def-icon"><LineChart size={16} /></span>
              <div>
                <b>推荐收益</b>
                <p>最新收盘价 / 发布日收盘价 − 1。未到目标价也持续跟踪，不做事后筛选。</p>
              </div>
            </div>
            <div>
              <span className="def-icon"><Scale size={16} /></span>
              <div>
                <b>超额收益</b>
                <p>推荐收益 − 同期沪深300收益。用相对收益剥离市场 Beta，避免“牛市里人人都是股神”。</p>
              </div>
            </div>
            <div>
              <span className="def-icon"><FileCheck2 size={16} /></span>
              <div>
                <b>推荐胜率</b>
                <p>超额收益为正的研报数 / 纳入统计的研报数。样本不足 3 篇时排名仅作展示。</p>
              </div>
            </div>
            <div>
              <span className="def-icon"><Fingerprint size={16} /></span>
              <div>
                <b>推票意图分</b>
                <p>评级强度 32 + 目标空间 30 + 催化明确度 20 + 观点一致性 18，映射为强看多 / 积极 / 审慎 / 观察。</p>
              </div>
            </div>
          </div>
        </section>

        <section className="panel db-panel">
          <PanelHeader title="数据底座：现在与以后" subtitle="为什么这个场景值得上数据库" />
          <div className="db-now">
            <div className="db-badge"><Database size={18} /> 当前 · SQLite（空库）</div>
            <p>
              研报、分析师、每日行情与推荐表现的数据表已经建好。当前为空库，导入真实研报与行情后写入；
              单机零运维，同时保留完整的关系模型，随时可迁移到生产数据库。
            </p>
            <div className="db-tables">
              <span>analysts</span>
              <span>reports</span>
              <span>prices</span>
              <span>indices</span>
            </div>
          </div>
          <div className="db-next">
            <b>当数据开始真实增长</b>
            <ul>
              <li><span>PostgreSQL</span> 存分析师、研报、评级变动等事务数据</li>
              <li><span>TimescaleDB / ClickHouse</span> 承载日频与分钟级行情</li>
              <li><span>对象存储</span> 保存 PDF 原文与解析后的段落</li>
              <li><span>任务队列</span> 每日收盘后增量计算推荐表现</li>
            </ul>
          </div>
          <div className="db-callout">
            <ShieldAlert size={16} />
            <p>结论：<b>需要数据库，但初版不必上重型数据库。</b>先用 SQLite 把数据模型和指标口径跑通，再按数据量升级。</p>
          </div>
        </section>
      </div>

      <div className="boundary panel">
        <span className="boundary-icon"><ShieldAlert size={18} /></span>
        <div>
          <b>数据边界</b>
          <p>
            当前工作区已清空模拟数据，处于空库状态，不会自动注入演示数据。接入真实数据前，应补充研报版权授权、
            行情源校验、发布时间时区与停牌处理。手动运行 seed 会写入仅供界面演示的虚构数据，请勿与真实跟踪混用。
          </p>
        </div>
      </div>
    </div>
  )
}
