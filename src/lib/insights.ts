import type { Product, Sale } from './types'
import { dayKey, saleProfit, saleTotal } from './store'

export function salesByDay(sales: Sale[]): Map<string, number> {
  const m = new Map<string, number>()
  for (const s of sales) m.set(dayKey(s.at), (m.get(dayKey(s.at)) ?? 0) + saleTotal(s))
  return m
}

// 7-day linear-trend forecast from up to 14 recent selling days
export function forecast(sales: Sale[], days = 7): { next7: number; trendPct: number } {
  const byDay = salesByDay(sales)
  const series = [...byDay.entries()].sort().slice(-14)
  if (series.length < 2) return { next7: series[0]?.[1] ?? 0, trendPct: 0 }
  const n = series.length
  const xs = series.map((_, i) => i)
  const ys = series.map((s) => s[1])
  const meanX = xs.reduce((a, b) => a + b) / n
  const meanY = ys.reduce((a, b) => a + b) / n
  const slope = xs.reduce((acc, x, i) => acc + (x - meanX) * (ys[i] - meanY), 0) /
    (xs.reduce((acc, x) => acc + (x - meanX) ** 2, 0) || 1)
  const daily = Math.max(0, meanY + slope * (n - meanX))
  const first = ys.slice(0, Math.ceil(n / 2)).reduce((a, b) => a + b, 0) / Math.ceil(n / 2)
  const last = ys.slice(Math.floor(n / 2)).reduce((a, b) => a + b, 0) / (n - Math.floor(n / 2))
  return { next7: daily * days, trendPct: first > 0 ? Math.round(((last - first) / first) * 100) : 0 }
}

export function productTrends(sales: Sale[]): { rising: string[]; falling: string[] } {
  const byDay = new Map<string, Map<string, number>>()
  for (const s of sales) {
    const d = dayKey(s.at)
    if (!byDay.has(d)) byDay.set(d, new Map())
    for (const i of s.items) byDay.get(d)!.set(i.name, (byDay.get(d)!.get(i.name) ?? 0) + i.qty)
  }
  const days = [...byDay.keys()].sort()
  if (days.length < 4) return { rising: [], falling: [] }
  const half = Math.floor(days.length / 2)
  const firstHalf = days.slice(0, half)
  const lastHalf = days.slice(half)
  const qty = (range: string[]) => (name: string) =>
    range.reduce((sum, d) => sum + (byDay.get(d)?.get(name) ?? 0), 0) / range.length
  const names = new Set<string>()
  for (const m of byDay.values()) for (const n of m.keys()) names.add(n)
  const rising: string[] = []
  const falling: string[] = []
  for (const name of names) {
    const a = qty(firstHalf)(name)
    const b = qty(lastHalf)(name)
    if (b > a * 1.3) rising.push(name)
    else if (a > 0 && b < a * 0.7) falling.push(name)
  }
  return { rising, falling }
}

export function bestSellers(sales: Sale[], limit = 5) {
  const counts: Record<string, { name: string; qty: number; revenue: number }> = {}
  for (const s of sales)
    for (const i of s.items) {
      counts[i.name] = counts[i.name] || { name: i.name, qty: 0, revenue: 0 }
      counts[i.name].qty += i.qty
      counts[i.name].revenue += i.qty * i.price
    }
  return Object.values(counts).sort((a, b) => b.revenue - a.revenue).slice(0, limit)
}

// quiet-day anomaly: today far below the recent average
export function slowDayAlert(sales: Sale[]): string | null {
  const byDay = salesByDay(sales)
  const today = dayKey(new Date().toISOString())
  const todayVal = byDay.get(today)
  const past = [...byDay.entries()].filter(([d]) => d < today).slice(-10).map((e) => e[1])
  if (todayVal === undefined || past.length < 3) return null
  const avg = past.reduce((a, b) => a + b) / past.length
  return todayVal < avg * 0.5 ? `Today is quiet: ${Math.round((1 - todayVal / avg) * 100)}% below ur recent average` : null
}

export function marginFlags(products: Product[]): { tooThin: Product[]; tooWide: Product[] } {
  return {
    tooThin: products.filter((p) => p.price > 0 && (p.price - p.cost) / p.price < 0.1),
    tooWide: products.filter((p) => p.price > 0 && (p.price - p.cost) / p.price > 0.6),
  }
}

// fuzzy search: token overlap + subsequence, typo-tolerant
export function smartSearch(products: Product[], query: string): Product[] {
  const q = query.toLowerCase().replace(/\s/g, '')
  if (!q) return products
  const score = (p: Product) => {
    const name = p.name.toLowerCase().replace(/\s/g, '')
    if (name.includes(q)) return 3
    let i = 0
    for (const c of name) if (c === q[i]) i++
    if (i >= q.length - 1 && q.length > 2) return 2
    if (p.category?.toLowerCase().includes(q)) return 1
    return 0
  }
  return products.map((p) => ({ p, s: score(p) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s).map((x) => x.p)
}

export function salesContext(sales: Sale[], products: Product[]): string {
  const byDay = salesByDay(sales)
  const recent = [...byDay.entries()].sort().slice(-7)
  const bs = bestSellers(sales)
  return [
    `POS data (naira):`,
    recent.map(([d, v]) => `${d}: ₦${v.toLocaleString()}`).join(', '),
    `best sellers: ${bs.map((b) => `${b.name} x${b.qty} (₦${b.revenue.toLocaleString()})`).join(', ')}`,
    `inventory: ${products.map((p) => `${p.name} cost ${p.cost} price ${p.price} stock ${p.stock}`).join('; ')}`,
  ].join('\n')
}

export function totalProfit(sales: Sale[]): number {
  return sales.reduce((s, x) => s + saleProfit(x), 0)
}
