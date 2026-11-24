export function cx(...values: (string | false | null | undefined)[]): string {
  return values.filter(Boolean).join(' ')
}

export function pct(value: number, signed = true, digits = 2): string {
  const sign = signed && value > 0 ? '+' : ''
  return `${sign}${value.toFixed(digits)}%`
}

export function number(value: number, digits = 2): string {
  return value.toLocaleString('zh-CN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

export function compactNumber(value: number): string {
  if (Math.abs(value) >= 100000000) return `${(value / 100000000).toFixed(2)}亿`
  if (Math.abs(value) >= 10000) return `${(value / 10000).toFixed(1)}万`
  return value.toLocaleString('zh-CN', { maximumFractionDigits: 2 })
}

export function dateShort(value: string): string {
  if (!value) return '—'
  const [, month, day] = value.split('-')
  return `${Number(month)}月${Number(day)}日`
}

export function dateDot(value: string | null | undefined): string {
  if (!value) return '—'
  return value.replaceAll('-', '.')
}

export function dateTick(value: string): string {
  if (!value) return ''
  const [, month, day] = value.split('-')
  return `${Number(month)}/${Number(day)}`
}

export function signedClass(value: number): 'up' | 'down' | 'flat' {
  if (value > 0.0001) return 'up'
  if (value < -0.0001) return 'down'
  return 'flat'
}

export function relativeDays(value: string, asOf?: string | null): string {
  if (!value) return '—'
  const end = asOf && asOf !== '—' ? new Date(`${asOf}T00:00:00`) : new Date()
  const start = new Date(`${value}T00:00:00`)
  const diff = Math.round((end.getTime() - start.getTime()) / 86400000)
  if (Number.isNaN(diff)) return '—'
  if (diff <= 0) return '今日'
  if (diff === 1) return '昨日'
  return `${diff}天前`
}

export const intentTone: Record<string, string> = {
  强看多: 'strong',
  产业看多: 'positive',
  积极看多: 'positive',
  审慎看多: 'cautious',
  中性观察: 'neutral',
}
