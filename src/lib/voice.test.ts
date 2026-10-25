import { describe, it, expect } from 'vitest'
import { parseSaleCommand } from './voice'
import type { Product } from './types'

const products: Product[] = [
  { id: '1', name: 'Bread (large)', cost: 900, price: 1500, stock: 10, emoji: '🍞' },
  { id: '2', name: 'Milk sachet', cost: 220, price: 350, stock: 10, emoji: '🥛' },
]

describe('parseSaleCommand', () => {
  it('parses "sold 2 bread"', () => {
    const r = parseSaleCommand('sold 2 bread', products)
    expect(r).toEqual([{ product: products[0], qty: 2 }])
  })
  it('parses multiple items', () => {
    const r = parseSaleCommand('3 bread and 1 milk', products)
    expect(r).toEqual([
      { product: products[0], qty: 3 },
      { product: products[1], qty: 1 },
    ])
  })
  it('number words work', () => {
    const r = parseSaleCommand('two milk', products)
    expect(r[0].qty).toBe(2)
  })
  it('ignores unknown items', () => {
    expect(parseSaleCommand('5 laptop', products)).toEqual([])
  })
})
