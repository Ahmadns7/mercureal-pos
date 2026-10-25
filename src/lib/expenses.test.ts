import { describe, it, expect } from 'vitest'
import { addExpense, removeExpense, expensesOn } from './expenses'
import type { Expense } from './expenses'

const e = (over: Partial<Expense> = {}): Expense => ({
  id: 'e1', label: 'fuel', amount: 5000, at: '2026-10-25T09:00:00Z', ...over,
})

describe('expenses', () => {
  it('adds valid, rejects junk', () => {
    let es = addExpense([], 'fuel', 5000)
    expect(es).toHaveLength(1)
    expect(addExpense(es, '', 100)).toHaveLength(1)
    expect(addExpense(es, 'fuel', -1)).toHaveLength(1)
    expect(addExpense(es, 'fuel', NaN)).toHaveLength(1)
  })

  it('removes by id', () => {
    const es = addExpense(addExpense([], 'fuel', 5000), 'data', 1000)
    expect(removeExpense(es, es[0].id)).toHaveLength(1)
  })

  it('sums per day only', () => {
    const es = [e(), e({ id: 'e2', amount: 2000, at: '2026-10-24T09:00:00Z' })]
    expect(expensesOn(es, '2026-10-25')).toBe(5000)
  })
})
