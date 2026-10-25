import { describe, it, expect } from 'vitest'
import { salesCsv } from './backup'

describe('sales csv', () => {
  it('builds one row per line item', () => {
    const csv = salesCsv([
      { id: 'S1', at: '2026-10-25T10:00:00Z', method: 'cash', items: [
        { name: 'Bread', qty: 2, price: 1500, cost: 900 },
        { name: 'Milk, peak', qty: 1, price: 350, cost: 220 },
      ] },
    ])
    const lines = csv.split('\n')
    expect(lines).toHaveLength(3)
    expect(lines[1]).toBe('S1,2026-10-25T10:00:00Z,cash,Bread,2,1500,900,3000')
    expect(lines[2]).toContain('"Milk, peak"')
  })
})
