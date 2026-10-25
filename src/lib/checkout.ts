import type { CartLine } from './types'

export type HeldSale = { id: string; at: string; lines: CartLine[]; label: string }
const KEY = 'mr-pos-held'

export function loadHeld(): HeldSale[] {
  try {
    const raw = localStorage.getItem(KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveHeld(held: HeldSale[]) {
  localStorage.setItem(KEY, JSON.stringify(held))
}

export function lineTotals(lines: CartLine[], discount = 0) {
  const gross = lines.reduce((s, l) => s + l.qty * l.product.price, 0)
  const total = Math.max(0, gross - Math.max(0, discount))
  return { gross, total, discount }
}
