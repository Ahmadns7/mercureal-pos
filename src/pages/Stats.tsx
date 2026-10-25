import { formatNaira } from '../lib/format'
import { dayKey, loadSales, summarizeDay } from '../lib/store'
import { expensesOn, loadExpenses } from '../lib/expenses'
import { loadInventory, loadStockDeltas, currentStock } from '../lib/store'

export default function Stats() {
  const sales = loadSales()
  const expenses = loadExpenses()
  const products = loadInventory()
  const deltas = loadStockDeltas()
  const days = [...new Set(sales.map((s) => dayKey(s.at)))].sort().reverse().slice(0, 30)

  const monthDays = days.slice(0, 30)
  const monthRevenue = monthDays.reduce((s, d) => s + summarizeDay(sales, d).revenue, 0)
  const monthProfit = monthDays.reduce((s, d) => s + summarizeDay(sales, d).profit, 0)
  const monthExpenses = monthDays.reduce((s, d) => s + expensesOn(expenses, d), 0)
  const takeHome = monthProfit - monthExpenses

  // best sellers across all sales
  const counts: Record<string, { name: string; emoji: string; qty: number; revenue: number }> = {}
  for (const s of sales)
    for (const i of s.items) {
      const p = products.find((x) => x.name === i.name)
      const k = p?.id ?? i.name
      counts[k] = counts[k] || { name: i.name, emoji: p?.emoji ?? '📦', qty: 0, revenue: 0 }
      counts[k].qty += i.qty
      counts[k].revenue += i.qty * i.price
    }
  const best = Object.values(counts).sort((a, b) => b.revenue - a.revenue).slice(0, 5)
  const toBuy = products.filter((p) => currentStock(products, deltas, p.id) <= 5)

  if (sales.length === 0) return <p className="py-10 text-center text-stone-500">Make some sales first</p>

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold">Stats</h1>
      <p className="mb-4 text-xs text-stone-500">last {monthDays.length} selling day(s)</p>
      <div className="mb-4 grid grid-cols-2 gap-3">
        <Card label="Revenue" value={formatNaira(monthRevenue)} testid="month-revenue" />
        <Card label="Gross profit" value={formatNaira(monthProfit)} testid="month-profit" />
        <Card label="Expenses" value={'−' + formatNaira(monthExpenses)} testid="month-expenses" />
        <Card label="Take-home" value={formatNaira(takeHome)} highlight testid="take-home" />
      </div>

      <h2 className="mb-2 text-sm font-semibold text-stone-500">Best sellers</h2>
      {best.map((b) => (
        <div key={b.name} className="mb-1 flex justify-between rounded-xl bg-stone-900 px-3 py-2 text-sm">
          <span>{b.emoji} {b.name}</span>
          <span className="text-stone-500">{b.qty} sold · {formatNaira(b.revenue)}</span>
        </div>
      ))}

      {toBuy.length > 0 && (
        <>
          <h2 className="mb-2 mt-4 text-sm font-semibold text-stone-500">Restock list</h2>
          <div className="rounded-2xl border border-yellow-600/40 bg-yellow-900/20 p-3 text-sm text-yellow-300" data-testid="restock-list">
            {toBuy.map((p) => `${p.emoji} ${p.name} (${currentStock(products, deltas, p.id)} left)`).join(' · ')}
          </div>
        </>
      )}
    </div>
  )
}

function Card({ label, value, highlight, testid }: { label: string; value: string; highlight?: boolean; testid: string }) {
  return (
    <div className={`rounded-2xl border p-3 ${highlight ? 'border-emerald-600/50 bg-emerald-900/20' : 'border-stone-800 bg-stone-900'}`}>
      <div className="text-xs text-stone-500">{label}</div>
      <div className={`mt-1 text-lg font-bold ${highlight ? 'text-emerald-400' : ''}`} data-testid={testid}>{value}</div>
    </div>
  )
}
