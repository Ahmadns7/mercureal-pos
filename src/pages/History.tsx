import { useState } from 'react'
import { formatNaira } from '../lib/format'
import { dayKey, loadSales, saleTotal, summarizeDay } from '../lib/store'

export default function History() {
  const sales = loadSales()
  const days = [...new Set(sales.map((s) => dayKey(s.at)))].sort().reverse().slice(0, 7)
  const [open, setOpen] = useState<string | null>(null)

  if (sales.length === 0) return <p className="py-10 text-center text-stone-500">No sales yet</p>

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">Sales log</h1>
      {days.map((d) => {
        const s = summarizeDay(sales, d)
        const daySales = sales.filter((x) => dayKey(x.at) === d)
        return (
          <div key={d} className="mb-2 rounded-2xl border border-stone-800 bg-stone-900">
            <button
              onClick={() => setOpen(open === d ? null : d)}
              className="flex w-full items-center justify-between p-3 text-left"
              data-testid={`day-${d}`}
            >
              <div>
                <div className="text-sm font-semibold">{new Date(d).toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
                <div className="text-xs text-stone-500">{s.count} sales · {s.items} items</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-emerald-400">{formatNaira(s.revenue)}</div>
                <div className="text-xs text-stone-500">profit {formatNaira(s.profit)}</div>
              </div>
            </button>
            {open === d && sales.filter((x) => dayKey(x.at) === d).map((sale) => (
              <div key={sale.id} className="px-3 pb-2 text-[11px] text-stone-600">
                <a href={`#/receipt/${sale.id}`} className="text-emerald-500">receipt</a>
              </div>
            ))}
            {false && (
              <div className="border-t border-stone-800 px-3 py-2 text-xs text-stone-400">
                {daySales.map((sale) => (
                  <div key={sale.id} className="flex justify-between py-0.5">
                    <span>{new Date(sale.at).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })} · {sale.method} · {sale.items.map((i) => `${i.name} ×${i.qty}`).join(', ')}</span>
                    <span>{formatNaira(saleTotal(sale))}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
