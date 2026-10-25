import { describe, it, expect } from 'vitest'
import { addDebt, payDebt, outstanding, owes } from './debts'
import type { Debt } from './debts'

const debt = (over: Partial<Debt> = {}): Debt => ({
  id: 'd1', name: 'Ada', amount: 1000, note: '', at: '2026-10-25T00:00:00Z', paid: 0, ...over,
})

describe('credit book', () => {
  it('adds a debt, rejects junk', () => {
    let ds = addDebt([], 'Ada', 1000, 'bread')
    expect(ds).toHaveLength(1)
    expect(ds[0].name).toBe('Ada')
    expect(addDebt(ds, '', 500)).toHaveLength(1)
    expect(addDebt(ds, 'Ada', -5)).toHaveLength(1)
  })

  it('partial payment then full', () => {
    let ds = [debt()]
    ds = payDebt(ds, 'd1', 400)
    expect(owes(ds[0])).toBe(600)
    ds = payDebt(ds, 'd1', 9999)
    expect(owes(ds[0])).toBe(0)
  })

  it('outstanding sums only what is left', () => {
    expect(outstanding([debt(), debt({ id: 'd2', amount: 500, paid: 200 })])).toBe(1300)
  })
})
