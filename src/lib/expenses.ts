export type Expense = { id: string; label: string; amount: number; at: string }

const KEY = 'mr-pos-expenses'

export function loadExpenses(): Expense[] {
  try {
    const raw = localStorage.getItem(KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveExpenses(expenses: Expense[]) {
  localStorage.setItem(KEY, JSON.stringify(expenses))
}

export function addExpense(expenses: Expense[], label: string, amount: number): Expense[] {
  if (!label.trim() || !Number.isFinite(amount) || amount <= 0) return expenses
  return [{ id: 'E' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5), label: label.trim(), amount, at: new Date().toISOString() }, ...expenses]
}

export function removeExpense(expenses: Expense[], id: string): Expense[] {
  return expenses.filter((e) => e.id !== id)
}

export function expensesOn(expenses: Expense[], day: string): number {
  return expenses.filter((e) => e.at.slice(0, 10) === day).reduce((s, e) => s + e.amount, 0)
}
