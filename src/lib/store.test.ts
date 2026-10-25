import { describe, it, expect } from 'vitest'
import { newSale, saleTotal, saleCost, saleProfit, summarizeDay, dayKey, currentStock, lowStock } from './store'
import type { Product } from './types'

const p = (over: Partial<Product> = {}): Product => ({
  id: 'x1', name: 'Test', cost: 100, price: 150, stock: 10, emoji: '📦', ...over,
})

describe('pos sale math', () => {
  it('totals a sale in naira', () => {
    const sale = newSale([
      { name: 'A', qty: 2, price: 300, cost: 180 },
      { name: 'B', qty: 1, price: 1500, cost: 900 },
    ], 'cash')
    expect(saleTotal(sale)).toBe(2100)
    expect(saleCost(sale)).toBe(1260)
    expect(saleProfit(sale)).toBe(840)
  })

  it('summarizes a day', () => {
    const sale = newSale([{ name: 'A', qty: 3, price: 300, cost: 180 }], 'transfer')
    const day = dayKey(sale.at)
    const s = summarizeDay([sale], day)
    expect(s).toEqual({ count: 1, revenue: 900, profit: 360, items: 3 })
  })

  it('day summary is empty for other days', () => {
    const sale = newSale([{ name: 'A', qty: 1, price: 300, cost: 180 }], 'cash')
    expect(summarizeDay([sale], '1999-01-01').count).toBe(0)
  })

  it('applies stock deltas on top of base stock', () => {
    const products = [p({ stock: 10 })]
    expect(currentStock(products, { x1: -3 }, 'x1')).toBe(7)
  })

  it('flags low stock after sales', () => {
    const products = [p({ stock: 8 }), p({ id: 'x2', stock: 2 })]
    const lows = lowStock(products, { x1: -5 })
    expect(lows.map((x) => x.id)).toEqual(['x1', 'x2'])
  })
})
