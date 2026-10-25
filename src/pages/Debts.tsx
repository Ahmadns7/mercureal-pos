import { useState } from 'react'
import { formatNaira } from '../lib/format'
import { addDebt, loadDebts, owes, outstanding, payDebt, saveDebts, type Debt } from '../lib/debts'

export default function Debts() {
  const [debts, setDebts] = useState<Debt[]>(() => loadDebts())
  const [form, setForm] = useState({ name: '', amount: '', note: '' })

  const open = debts.filter((d) => owes(d) > 0)
  const settled = debts.filter((d) => owes(d) === 0)

  const submit = () => {
    const next = addDebt(debts, form.name, Number(form.amount), form.note)
    saveDebts(next)
    setDebts(next)
    setForm({ name: '', amount: '', note: '' })
  }

  const pay = (id: string, full: boolean) => {
    const d = debts.find((x) => x.id === id)!
    const next = payDebt(debts, id, full ? owes(d) : 0)
    saveDebts(next)
    setDebts(next)
  }

  return (
    <div className="pb-4">
      <h1 className="mb-1 text-xl font-bold">Credit book</h1>
      <p className="mb-4 text-sm text-stone-500">
        Owed to you: <span className="font-bold text-yellow-400" data-testid="outstanding">{formatNaira(outstanding(debts))}</span>
      </p>

      <div className="mb-4 space-y-2 rounded-2xl border border-stone-800 bg-stone-900 p-3">
        <div className="flex gap-2">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Customer name" className="w-full rounded-xl border border-stone-700 bg-stone-950 px-3 py-2" data-testid="debt-name" />
          <input value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} inputMode="numeric" placeholder="₦" className="w-28 rounded-xl border border-stone-700 bg-stone-950 px-3 py-2" data-testid="debt-amount" />
        </div>
        <button onClick={submit} className="w-full rounded-xl bg-emerald-500 py-2.5 font-semibold text-stone-950" data-testid="add-debt">
          Record credit
        </button>
      </div>

      {open.map((d) => (
        <div key={d.id} className="mb-2 flex items-center gap-3 rounded-2xl border border-stone-800 bg-stone-900 p-3">
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium">{d.name}</div>
            <div className="text-xs text-stone-500">
              {formatNaira(d.amount)} · {owes(d) < d.amount ? `paid ${formatNaira(d.paid)}` : d.note || 'on credit'} · {new Date(d.at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
            </div>
          </div>
          <button onClick={() => pay(d.id, false)} className="rounded-lg bg-stone-800 px-2 py-1 text-xs" data-testid={`half-${d.id}`}>+₦500</button>
          <button onClick={() => pay(d.id, true)} className="rounded-lg bg-emerald-500 px-2 py-1 text-xs font-semibold text-stone-950" data-testid={`paid-${d.id}`}>Paid</button>
        </div>
      ))}
      {open.length === 0 && <p className="py-6 text-center text-sm text-stone-500">Nobody owes u rn 🎉</p>}

      {settled.length > 0 && (
        <div className="mt-4">
          <h2 className="mb-2 text-sm font-semibold text-stone-500">Settled</h2>
          {settled.map((d) => (
            <div key={d.id} className="mb-1 flex justify-between px-1 text-xs text-stone-600">
              <span>{d.name}</span><span>{formatNaira(d.amount)} ✓</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
