import { useState } from 'react'
import { formatNaira } from '../lib/format'
import { loadInventory, loadStockDeltas, currentStock, saveInventory } from '../lib/store'
import type { Product } from '../lib/types'

export default function Inventory() {
  const [products, setProducts] = useState<Product[]>(() => loadInventory())
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: '', cost: '', price: '', stock: '', emoji: '📦' })

  const persist = (next: Product[]) => {
    setProducts(next)
    saveInventory(next)
  }

  const restock = (id: string, n: number) => {
    const deltas = loadStockDeltas()
    deltas[id] = (deltas[id] ?? 0) + n
    localStorage.setItem('mr-pos-stock', JSON.stringify(deltas))
    setProducts([...products])
  }

  const remove = (id: string) => persist(products.filter((p) => p.id !== id))

  const submit = () => {
    const cost = Number(form.cost)
    const price = Number(form.price)
    const stock = Number(form.stock)
    if (!form.name || !Number.isFinite(cost) || !Number.isFinite(price) || price < cost) return
    persist([
      ...products,
      { id: 'p' + Date.now().toString(36), name: form.name, cost, price, stock: stock || 0, emoji: form.emoji || '📦' },
    ])
    setForm({ name: '', cost: '', price: '', stock: '', emoji: '📦' })
    setAdding(false)
  }

  return (
    <div className="pb-16">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Stock</h1>
        <button onClick={() => setAdding((a) => !a)} className="rounded-full bg-emerald-500 px-4 py-1.5 text-sm font-semibold text-stone-950">
          {adding ? 'Close' : '+ Add'}
        </button>
      </div>

      {adding && (
        <div className="mb-4 space-y-2 rounded-2xl border border-stone-800 bg-stone-900 p-3">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" className="w-full rounded-xl border border-stone-700 bg-stone-950 px-3 py-2" />
          <div className="flex gap-2">
            <input value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} inputMode="numeric" placeholder="Cost ₦" className="w-full rounded-xl border border-stone-700 bg-stone-950 px-3 py-2" />
            <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} inputMode="numeric" placeholder="Price ₦" className="w-full rounded-xl border border-stone-700 bg-stone-950 px-3 py-2" />
            <input value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} inputMode="numeric" placeholder="Qty" className="w-full rounded-xl border border-stone-700 bg-stone-950 px-3 py-2" />
          </div>
          <button onClick={submit} className="w-full rounded-xl bg-emerald-500 py-2.5 font-semibold text-stone-950" data-testid="save-product">
            Save product
          </button>
        </div>
      )}

      {products.map((p) => {
        const stock = currentStock(products, loadStockDeltas(), p.id)
        return (
          <div key={p.id} className="mb-2 flex items-center gap-3 rounded-2xl border border-stone-800 bg-stone-900 p-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-stone-800 text-xl">{p.emoji}</div>
            <div className="flex-1 min-w-0">
              <div className="truncate text-sm font-medium">{p.name}</div>
              <div className="text-xs text-stone-500">
                {formatNaira(p.price)} · margin {formatNaira(p.price - p.cost)} · <span className={stock <= 5 ? 'text-yellow-400' : ''}>{stock} left</span>
              </div>
            </div>
            <button onClick={() => restock(p.id, 10)} className="rounded-lg bg-stone-800 px-2 py-1 text-xs" data-testid={`restock-${p.id}`}>+10</button>
            <button onClick={() => remove(p.id)} className="text-xs text-red-400">del</button>
          </div>
        )
      })}
      {products.length === 0 && <p className="py-10 text-center text-stone-500">No products yet</p>}
    </div>
  )
}
