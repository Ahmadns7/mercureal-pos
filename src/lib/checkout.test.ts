import { describe, it, expect } from 'vitest'
import { lineTotals } from './checkout'
import type { CartLine } from './types'

const line = (price: number, qty: number): CartLine => ({
  product: { id: 'x', name: 'X', cost: price - 100, price, stock: 99, emoji: '📦' },
  qty,
})

describe('lineTotals with discount', () => {
  it('subtracts discount from gross', () => {
    expect(lineTotals([line(300, 2)], 100)).toEqual({ gross: 600, total: 500, discount: 100 })
  })
  it('never goes below zero', () => {
    expect(lineTotals([line(300, 1)], 9999).total).toBe(0)
  })
  it('negative discount is ignored', () => {
    expect(lineTotals([line(300, 1)], -50).total).toBe(300)
  })
})
