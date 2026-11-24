import type { Analyst, Overview, Report } from '../types'

const BASE = '/api'

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE}${path}`)
  if (!response.ok) {
    const detail = await response.json().catch(() => null)
    throw new Error(detail?.detail ?? `请求失败（${response.status}）`)
  }
  return response.json() as Promise<T>
}

export const api = {
  meta: () => request<{ as_of: string | null; report_count: number; analyst_count: number; has_data: boolean; demo: boolean; source: string }>('/meta'),
  overview: () => request<Overview>('/overview'),
  analysts: () => request<Analyst[]>('/analysts'),
  analyst: (id: string) => request<Analyst>(`/analysts/${id}`),
  reports: (params?: { analyst?: string; rating?: string; q?: string }) => {
    const query = new URLSearchParams()
    if (params?.analyst) query.set('analyst', params.analyst)
    if (params?.rating && params.rating !== '全部') query.set('rating', params.rating)
    if (params?.q) query.set('q', params.q)
    const suffix = query.size ? `?${query.toString()}` : ''
    return request<{ items: Report[]; total: number }>(`/reports${suffix}`)
  },
  report: (id: string) => request<Report>(`/reports/${id}`),
}
