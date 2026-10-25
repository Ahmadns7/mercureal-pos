import { useState } from 'react'
import { formatNaira } from '../lib/format'
import {
  currentStock, loadInventory, loadSales, loadStockDeltas, newSale,
  saveSales, saveStockDeltas, saleTotal,
} from '../lib/store'
import { lineTotals, loadHeld, saveHeld, type HeldSale } from '../lib/checkout'
import type { CartLine, Sale } from '../lib/types'

export default function Sell() {
  const products = loadInventory()
  const deltas = loadStockDeltas()
  const available = (id: string) => currentStock(products, deltas, id)

  const [cart, setCart] = useState<CartLine[]>([])
  const [discount, setDiscount] = useState('')
  const [done, setDone] = useState<Sale | null>(null)
  const [held, setHeld] = useState<HeldSale[]>(() => loadHeld())
  const [showHeld, setShowHeld] = useState(false)

  const disc = Math.max(0, Number(discount) || 0)
  const { total } = lineTotals(cart, disc)

  const add = (id: string) => {
    setDone(null)
    setCart((c) => {
      const line = c.find((l) => l.product.id === id)
      if (line && line.qty >= available(id)) return c
      return line ? c.map((l) => (l.product.id === id ? { ...l, qty: l.qty + 1 } : l)) : [...c, { product: products.find((p) => p.id === id)!, qty: 1 }]
    })
  }

  const dec = (id: string) =>
    setCart((c) => c.flatMap((l) => (l.product.id === id ? (l.qty > 1 ? [{ ...l, qty: l.qty - 1 }] : []) : [l])))

  const checkout = (method: 'cash' | 'transfer') => {
    if (cart.length === 0) return
    const d = { ...loadStockDeltas() }
    for (const l of cart) d[l.product.id] = (d[l.product.id] ?? 0) - l.qty
    saveStockDeltas(d)
    const sale: Sale = {
      ...newSale(
        cart.map((l) => ({ name: l.product.name, qty: l.qty, price: l.product.price, cost: l.product.cost })),
        method,
      ),
      discount: disc,
    }
    saveSales([sale, ...loadSales()])
    setCart([])
    setDiscount('')
    setDone(sale)
  }

  const hold = () => {
    if (cart.length === 0) return
    const h: HeldSale = { id: 'H' + Date.now().toString(36).toUpperCase(), at: new Date().toISOString(), lines: cart, label: `Cart ${held.length + 1}` }
    const next = [h, ...held]
    saveHeld(next)
    setHeld(next)
    setCart([])
    setDiscount('')
  }

  const resume = (h: HeldSale) => {
    setCart(h.lines)
    const next = held.filter((x) => x.id !== h.id)
    saveHeld(next)
    setHeld(next)
    setShowHeld(false)
  }

  if (done)
    return (
      <div className="text-center">
        <div className="py-6 text-5xl">✅</div>
        <h1 className="text-xl font-bold">Sale complete</h1>
        <p className="mt-1 text-lg">{formatNaira(saleTotal(done))} · {done.method}</p>
        {(done.discount ?? 0) > 0 && <p className="text-xs text-stone-500">discount −{formatNaira(done.discount ?? 0)}</p>}
        <p className="mt-1 text-xs text-stone-500">{done.id}</p>
        <div className="mt-6 flex gap-2">
          <button onClick={() => setDone(null)} className="flex-1 rounded-xl bg-emerald-500 py-3 font-semibold text-stone-950" data-testid="next-sale">Next sale</button>
          <button onClick={() => (window.location.hash = `#/receipt/${done.id}`)} className="flex-1 rounded-xl border border-stone-700 py-3 font-semibold" data-testid="open-receipt">Receipt</button>
        </div>
      </div>
    )

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Sell</h1>
        {held.length > 0 && (
          <button onClick={() => setShowHeld((s) => !s)} className="rounded-full bg-stone-800 px-3 py-1 text-xs text-yellow-400" data-testid="held-toggle">
            ⏸ {held.length} held
          </button>
        )}
      </div>

      {showHeld && (
        <div className="mb-3 space-y-1 rounded-2xl border border-stone-800 bg-stone-900 p-3">
          {held.map((h) => (
            <button key={h.id} onClick={() => resume(h)} className="flex w-full justify-between rounded-xl px-2 py-2 text-left text-sm hover:bg-stone-800" data-testid={`held-${h.id}`}>
              <span>{h.label} · {h.lines.length} items</span>
              <span className="text-emerald-400">{formatNaira(h.lines.reduce((s, l) => s + l.qty * l.product.price, 0))}</span>
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        {products.map((p) => (
          <button key={p.id} onClick={() => add(p.id)} disabled={available(p.id) <= 0} className="rounded-2xl border border-stone-800 bg-stone-900 p-2 text-left active:scale-[0.97] disabled:opacity-30">
            <div className="text-2xl">{p.emoji}</div>
            <div className="truncate text-xs">{p.name}</div>
            <div className="text-xs text-emerald-400">{formatNaira(p.price)}</div>
            <div className="text-[10px] text-stone-500">{available(p.id)} left</div>
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
            {disc > 0 && <div className="flex justify-between py-0.5 text-xs text-stone-500"><span>discount</span><span>−{formatNaira(disc)}</span></div>}
            <div className="mt-1 flex items-center gap-2">
              <input value={discount} onChange={(e) => setDiscount(e.target.value)} inputMode="numeric" placeholder="Discount ₦" className="w-24 rounded-lg border border-stone-700 bg-stone-950 px-2 py-1.5 text-xs" data-testid="discount" />
              <button onClick={hold} className="rounded-lg bg-stone-800 px-2 py-1.5 text-xs" data-testid="hold">hold</button>
              <span className="ml-auto text-sm font-bold" data-testid="sell-total">{formatNaira(total)}</span>
            </div>
            <div className="mt-2 flex gap-2">
              <button onClick={() => checkout('cash')} className="flex-1 rounded-xl bg-emerald-500 py-2.5 font-semibold text-stone-950" data-testid="pay-cash">Cash</button>
              <button onClick={() => checkout('transfer')} className="flex-1 rounded-xl border border-emerald-500 py-2.5 font-semibold text-emerald-400" data-testid="pay-transfer">Transfer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
