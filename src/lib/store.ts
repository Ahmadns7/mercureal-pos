import type { Product, Sale, SaleItem } from './types'

const INV_KEY = 'mr-pos-inventory'
const SALES_KEY = 'mr-pos-sales'
const STOCK_KEY = 'mr-pos-stock'

const defaultProducts: Product[] = [
  { id: 'd1', name: 'Coca-Cola 50cl', cost: 180, price: 300, stock: 48, emoji: '🥤' },
  { id: 'd2', name: 'Indomie 70g', cost: 130, price: 200, stock: 60, emoji: '🍜' },
  { id: 'd3', name: 'Bread (large)', cost: 900, price: 1500, stock: 10, emoji: '🍞' },
  { id: 'd4', name: 'Milk sachet', cost: 220, price: 350, stock: 40, emoji: '🥛' },
  { id: 'd5', name: 'Egg (crate)', cost: 4800, price: 5500, stock: 5, emoji: '🥚' },
  { id: 'd6', name: 'Water 75cl', cost: 80, price: 150, stock: 100, emoji: '💧' },
  { id: 'd7', name: 'Biscuits', cost: 100, price: 200, stock: 30, emoji: '🍪' },
  { id: 'd8', name: 'Detergent sachet', cost: 150, price: 250, stock: 25, emoji: '🧼' },
]

export function loadInventory(): Product[] {
  try {
    const raw = localStorage.getItem(INV_KEY)
    if (!raw) return [...defaultProducts]
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : [...defaultProducts]
  } catch {
    return [...defaultProducts]
  }
}

export function saveInventory(products: Product[]) {
  localStorage.setItem(INV_KEY, JSON.stringify(products))
}

export function loadSales(): Sale[] {
  try {
    const raw = localStorage.getItem(SALES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveSales(sales: Sale[]) {
  localStorage.setItem(SALES_KEY, JSON.stringify(sales))
}

// stock adjustments are stored as deltas so inventory edits and sales don't fight
export function loadStockDeltas(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STOCK_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    return typeof parsed === 'object' && parsed !== null ? parsed : {}
  } catch {
    return {}
  }
}

export function saveStockDeltas(deltas: Record<string, number>) {
  localStorage.setItem(STOCK_KEY, JSON.stringify(deltas))
}

export function newSale(items: SaleItem[], method: 'cash' | 'transfer'): Sale {
  return {
    id: 'S' + Date.now().toString(36).toUpperCase(),
    at: new Date().toISOString(),
    method,
    items,
  }
}

export function saleTotal(sale: Sale): number {
  return sale.items.reduce((s, i) => s + i.qty * i.price, 0)
}

export function saleCost(sale: Sale): number {
  return sale.items.reduce((s, i) => s + i.qty * i.cost, 0)
}

export function saleProfit(sale: Sale): number {
  return saleTotal(sale) - saleCost(sale)
}

export function dayKey(iso: string): string {
  return iso.slice(0, 10)
}

export function summarizeDay(sales: Sale[], day: string) {
  const forDay = sales.filter((s) => dayKey(s.at) === day)
  return {
    count: forDay.length,
    revenue: forDay.reduce((s, x) => s + saleTotal(x), 0),
    profit: forDay.reduce((s, x) => s + saleProfit(x), 0),
    items: forDay.reduce((s, x) => s + x.items.reduce((n, i) => n + i.qty, 0), 0),
  }
}

export function todayKey(): string {
  return dayKey(new Date().toISOString())
}

export function currentStock(products: Product[], deltas: Record<string, number>, productId: string): number {
  const p = products.find((x) => x.id === productId)
  return p ? p.stock + (deltas[productId] ?? 0) : 0
}

export function lowStock(products: Product[], deltas: Record<string, number>, threshold = 5): Product[] {
  return products.filter((p) => currentStock(products, deltas, p.id) <= threshold)
}
