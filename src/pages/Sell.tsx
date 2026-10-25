import { useState } from 'react'
import { formatNaira } from '../lib/format'
import {
  currentStock, loadInventory, loadSales, loadStockDeltas, newSale,
  saveSales, saveStockDeltas, saleTotal,
} from '../lib/store'
import type { CartLine, Product, Sale } from '../lib/types'

export default function Sell() {
  const products = loadInventory()
  const deltas = loadStockDeltas()
  const available = (p: Product) => currentStock(products, deltas, p.id)

  const [cart, setCart] = useState<CartLine[]>([])
  const [done, setDone] = useState<Sale | null>(null)

  const add = (p: Product) => {
    setDone(null)
    setCart((c) => {
      const line = c.find((l) => l.product.id === p.id)
      if (line && line.qty >= available(p)) return c
      return line ? c.map((l) => (l.product.id === p.id ? { ...l, qty: l.qty + 1 } : l)) : [...c, { product: p, qty: 1 }]
    })
  }

  const dec = (id: string) =>
    setCart((c) =>
      c.flatMap((l) => (l.product.id === id ? (l.qty > 1 ? [{ ...l, qty: l.qty - 1 }] : []) : [l])),
    )

  const checkout = (method: 'cash' | 'transfer') => {
    if (cart.length === 0) return
    // record stock deltas so future loads see the sale
    const d = { ...loadStockDeltas() }
    for (const l of cart) d[l.product.id] = (d[l.product.id] ?? 0) - l.qty
    saveStockDeltas(d)
    const sale = newSale(
      cart.map((l) => ({ name: l.product.name, qty: l.qty, price: l.product.price, cost: l.product.cost })),
      method,
    )
    saveSales([sale, ...loadSales()])
    setCart([])
    setDone(sale)
  }

  if (done)
    return (
      <div className="text-center">
        <div className="py-6 text-5xl">✅</div>
        <h1 className="text-xl font-bold">Sale complete</h1>
        <p className="mt-1 text-lg">{formatNaira(saleTotal(done))} · {done.method}</p>
        <p className="mt-1 text-xs text-stone-500">{done.id}</p>
        <button onClick={() => setDone(null)} className="mt-6 w-full rounded-xl bg-emerald-500 py-3 font-semibold text-stone-950" data-testid="next-sale">
          Next sale
        </button>
      </div>
    )

  const total = cart.reduce((s, l) => s + l.qty * l.product.price, 0)

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">Sell</h1>
      <div className="grid grid-cols-3 gap-2">
        {products.map((p) => (
          <button
            key={p.id}
            onClick={() => add(p)}
            disabled={available(p) <= 0}
            className="rounded-2xl border border-stone-800 bg-stone-900 p-2 text-left active:scale-[0.97] disabled:opacity-30"
          >
            <div className="text-2xl">{p.emoji}</div>
            <div className="truncate text-xs">{p.name}</div>
            <div className="text-xs text-emerald-400">{formatNaira(p.price)}</div>
            <div className="text-[10px] text-stone-500">{available(p)} left</div>
          </button>
        ))}
      </div>
      {cart.length > 0 && (
        <div className="fixed bottom-16 left-0 right-0 px-4">
          <div className="mx-auto max-w-md rounded-2xl border border-stone-700 bg-stone-900 p-3 shadow-xl">
            {cart.map((l) => (
              <div key={l.product.id} className="flex items-center justify-between py-0.5 text-sm">
                <span>{l.product.emoji} {l.product.name} × {l.qty}</span>
                <span className="flex items-center gap-2">
                  {formatNaira(l.qty * l.product.price)}
                  <button onClick={() => dec(l.product.id)} className="h-6 w-6 rounded bg-stone-800" data-testid={`dec-${l.product.id}`}>−</button>
                </span>
              </div>
            ))}
            <div className="mt-2 flex gap-2">
              <button onClick={() => checkout('cash')} className="flex-1 rounded-xl bg-emerald-500 py-2.5 font-semibold text-stone-950" data-testid="pay-cash">
                Cash {formatNaira(total)}
              </button>
              <button onClick={() => checkout('transfer')} className="flex-1 rounded-xl border border-emerald-500 py-2.5 font-semibold text-emerald-400" data-testid="pay-transfer">
                Transfer {formatNaira(total)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
