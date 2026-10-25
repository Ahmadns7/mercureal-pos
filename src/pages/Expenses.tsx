import { useState } from 'react'
import { formatNaira } from '../lib/format'
import { addExpense, expensesOn, loadExpenses, removeExpense, saveExpenses, type Expense } from '../lib/expenses'

const QUICK = ['Fuel', 'Transport', 'Restock', 'Data', 'Rent']

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>(() => loadExpenses())
  const [form, setForm] = useState({ label: '', amount: '' })
  const today = new Date().toISOString().slice(0, 10)

  const submit = (label = form.label) => {
    const next = addExpense(expenses, label, Number(form.amount))
    saveExpenses(next)
    setExpenses(next)
    setForm({ label: '', amount: '' })
  }

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold">Expenses</h1>
      <p className="mb-4 text-sm text-stone-500">Today: <span className="font-bold text-red-400" data-testid="today-expenses">{formatNaira(expensesOn(expenses, today))}</span></p>

      <div className="mb-3 flex flex-wrap gap-2">
        {QUICK.map((q) => (
          <button key={q} onClick={() => setForm((f) => ({ ...f, label: q }))} className="rounded-full bg-stone-800 px-3 py-1 text-xs text-stone-300">
            {q}
          </button>
        ))}
      </div>
      <div className="mb-4 flex gap-2">
        <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="What" className="w-full rounded-xl border border-stone-700 bg-stone-950 px-3 py-2" data-testid="expense-label" />
        <input value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} inputMode="numeric" placeholder="₦" className="w-28 rounded-xl border border-stone-700 bg-stone-950 px-3 py-2" data-testid="expense-amount" />
        <button onClick={() => submit()} className="rounded-xl bg-emerald-500 px-4 font-semibold text-stone-950" data-testid="add-expense">Add</button>
      </div>

      {expenses.map((e) => (
        <div key={e.id} className="mb-2 flex items-center justify-between rounded-2xl border border-stone-800 bg-stone-900 p-3">
          <div>
            <div className="text-sm font-medium">{e.label}</div>
            <div className="text-xs text-stone-500">{new Date(e.at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}</div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-red-400">−{formatNaira(e.amount)}</span>
            <button onClick={() => { const n = removeExpense(expenses, e.id); saveExpenses(n); setExpenses(n) }} className="text-xs text-stone-500">del</button>
          </div>
        </div>
      ))}
      {expenses.length === 0 && <p className="py-10 text-center text-sm text-stone-500">No expenses logged</p>}
    </div>
  )
}
