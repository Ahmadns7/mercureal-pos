import { describe, it, expect } from 'vitest'
import { forecast, productTrends, slowDayAlert, marginFlags, smartSearch, bestSellers } from './insights'
import type { Product, Sale } from './types'

const sale = (at: string, items: { name: string; qty: number; price: number; cost: number }[]): Sale => ({
  id: 'S' + at, at, method: 'cash', items,
})
const p = (name: string, cost = 100, price = 150, stock = 10): Product => ({ id: name, name, cost, price, stock, emoji: '📦' })

describe('forecast', () => {
  it('flat series predicts flat week', () => {
    const sales = Array.from({ length: 5 }, (_, i) =>
      sale(`2026-10-1${i}T10:00:00Z`, [{ name: 'A', qty: 10, price: 100, cost: 50 }]))
    expect(forecast(sales).next7).toBeCloseTo(7000, -1)
    expect(forecast(sales).trendPct).toBe(0)
  })
  it('rising series has positive trend', () => {
    const sales = [
      sale('2026-10-01T10:00:00Z', [{ name: 'A', qty: 1, price: 1000, cost: 500 }]),
      sale('2026-10-02T10:00:00Z', [{ name: 'A', qty: 2, price: 1000, cost: 500 }]),
      sale('2026-10-03T10:00:00Z', [{ name: 'A', qty: 3, price: 1000, cost: 500 }]),
      sale('2026-10-04T10:00:00Z', [{ name: 'A', qty: 4, price: 1000, cost: 500 }]),
    ]
    expect(forecast(sales).trendPct).toBeGreaterThan(0)
  })
})

describe('trends and anomalies', () => {
  it('detects rising and falling products', () => {
    const sales = [
      sale('2026-10-01T10:00:00Z', [{ name: 'Bread', qty: 10, price: 100, cost: 50 }]),
      sale('2026-10-02T10:00:00Z', [{ name: 'Bread', qty: 10, price: 100, cost: 50 }]),
      sale('2026-10-03T10:00:00Z', [{ name: 'Bread', qty: 1, price: 100, cost: 50 }]),
      sale('2026-10-04T10:00:00Z', [{ name: 'Bread', qty: 1, price: 100, cost: 50 }]),
    ]
    const t = productTrends(sales)
    expect(t.falling).toContain('Bread')
    expect(t.rising).toHaveLength(0)
  })

  it('flags a slow day', () => {
    const d = (n: number) => `2026-10-${String(10 + n).padStart(2, '0')}`
    const today = new Date().toISOString().slice(0, 10)
    const day = (i: number) => (i < 3 ? d(i) : today)
    const sales = [0, 1, 2, 3].map((i) =>
      sale(`${day(i)}T10:00:00Z`, [{ name: 'A', qty: i < 3 ? 10 : 2, price: 1000, cost: 100 }]))
    expect(slowDayAlert(sales)).toContain('quiet')
  })

  it('no alert with too little data', () => {
    expect(slowDayAlert([])).toBe(null)
  })
})

describe('margins and search', () => {
  it('flags thin and wide margins', () => {
    const m = marginFlags([p('Thin', 95, 100), p('Wide', 10, 100), p('Ok', 60, 100)])
    expect(m.tooThin.map((x) => x.name)).toEqual(['Thin'])
    expect(m.tooWide.map((x) => x.name)).toEqual(['Wide'])
  })

  it('typo-tolerant search still finds product', () => {
    const products = [p('Coca-Cola'), p('Bread'), p('Plantain chips')]
    const hits = smartSearch(products, 'cocca')
    expect(hits[0].name).toBe('Coca-Cola')
    expect(smartSearch(products, '')[0].name).toBe('Coca-Cola')
  })

  it('best sellers sort by revenue', () => {
    const bs = bestSellers([
      sale('2026-10-20T10:00:00Z', [{ name: 'Cheap', qty: 10, price: 10, cost: 1 }]),
      sale('2026-10-20T11:00:00Z', [{ name: 'Pricey', qty: 1, price: 5000, cost: 100 }]),
    ])
    expect(bs[0].name).toBe('Pricey')
  })
})
