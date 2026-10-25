import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatNaira } from '../lib/format'
import { loadInventory, loadSales, loadStockDeltas, lowStock, summarizeDay, todayKey } from '../lib/store'
import { expensesOn, loadExpenses } from '../lib/expenses'

export default function Dashboard() {
  const [s, setS] = useState(() => summarizeDay(loadSales(), todayKey()))
  const todayExpenses = expensesOn(loadExpenses(), todayKey())
  const takeHome = s.profit - todayExpenses
  const lows = lowStock(loadInventory(), loadStockDeltas())

  useEffect(() => {
    const t = setInterval(() => setS(summarizeDay(loadSales(), todayKey())), 5000)
    return () => clearInterval(t)
  }, [])

  return (
    <div>
      <div className="mb-1 flex items-center justify-between"><h1 className="text-xl font-bold">Today</h1><span className="flex gap-3"><Link to="/insights" className="text-lg">✨</Link><Link to="/ask" className="text-lg">💬</Link><Link to="/settings" className="text-lg">⚙️</Link></span></div>
      <p className="mb-4 text-sm text-stone-500">{new Date().toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Revenue" value={formatNaira(s.revenue)} testid="revenue" />
        <Stat label="Gross profit" value={formatNaira(s.profit)} testid="profit" />
        <Stat label="Sales" value={String(s.count)} testid="sales-count" />
        <Stat label="Items sold" value={String(s.items)} testid="items-sold" />
      </div>
      <div className="mt-3 rounded-2xl border border-emerald-600/50 bg-emerald-900/20 p-3">
        <div className="text-xs text-stone-500">Take-home today (profit − expenses)</div>
        <div className="mt-1 text-lg font-bold text-emerald-400" data-testid="take-home">{formatNaira(takeHome)}</div>
      </div>
      <Link to="/sell" className="mt-5 block rounded-xl bg-emerald-500 py-3 text-center font-semibold text-stone-950 active:scale-[0.98]">
        New sale
      </Link>
      {lows.length > 0 && (
        <div className="mt-5 rounded-2xl border border-yellow-600/40 bg-yellow-900/20 p-3 text-sm text-yellow-300">
          Low stock: {lows.map((p) => `${p.emoji} ${p.name}`).join(', ')}
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, testid }: { label: string; value: string; testid: string }) {
  return (
    <div className="rounded-2xl border border-stone-800 bg-stone-900 p-3">
      <div className="text-xs text-stone-500">{label}</div>
      <div className="mt-1 text-lg font-bold" data-testid={testid}>{value}</div>
    </div>
  )
}
