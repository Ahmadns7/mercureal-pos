export type Debt = {
  id: string
  name: string
  amount: number
  note: string
  at: string
  paid: number
}

const KEY = 'mr-pos-debts'

export function loadDebts(): Debt[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveDebts(debts: Debt[]) {
  localStorage.setItem(KEY, JSON.stringify(debts))
}

export function addDebt(debts: Debt[], name: string, amount: number, note = ''): Debt[] {
  if (!name.trim() || !Number.isFinite(amount) || amount <= 0) return debts
  const d: Debt = {
    id: 'D' + Date.now().toString(36).toUpperCase(),
    name: name.trim(),
    amount,
    note,
    at: new Date().toISOString(),
    paid: 0,
  }
  return [d, ...debts]
}

export function payDebt(debts: Debt[], id: string, amount: number): Debt[] {
  return debts.map((d) =>
    d.id === id ? { ...d, paid: Math.min(d.amount, Math.max(0, d.paid + amount)) } : d,
  )
}

export function outstanding(debts: Debt[]): number {
  return debts.reduce((s, d) => s + (d.amount - d.paid), 0)
}

export function owes(debt: Debt): number {
  return debt.amount - debt.paid
}
