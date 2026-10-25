import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatNaira } from '../lib/format'
import { loadInventory, loadSales, loadStockDeltas, lowStock, summarizeDay, todayKey } from '../lib/store'

export default function Dashboard() {
  const [s, setS] = useState(() => summarizeDay(loadSales(), todayKey()))
  const lows = lowStock(loadInventory(), loadStockDeltas())

  useEffect(() => {
    const t = setInterval(() => setS(summarizeDay(loadSales(), todayKey())), 5000)
    return () => clearInterval(t)
  }, [])

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold">Today</h1>
      <p className="mb-4 text-sm text-stone-500">{new Date().toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Revenue" value={formatNaira(s.revenue)} testid="revenue" />
        <Stat label="Profit" value={formatNaira(s.profit)} testid="profit" />
        <Stat label="Sales" value={String(s.count)} testid="sales-count" />
        <Stat label="Items sold" value={String(s.items)} testid="items-sold" />
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
