import { useState } from 'react'
import { formatNaira } from '../lib/format'
import { loadInventory, loadStockDeltas, currentStock, saveInventory } from '../lib/store'
import { askAi, isAiReady } from '../lib/ai'
import type { Product } from '../lib/types'

function emojiFor(category: string): string {
  const map: Record<string, string> = { fashion: '👕', electronics: '🔌', home: '🏠', beauty: '🧴', food: '🍽️' }
  return map[category.toLowerCase()] ?? '📦'
}

export default function Inventory() {
  const [products, setProducts] = useState<Product[]>(() => loadInventory())
  const [adding, setAdding] = useState(false)
  const [aiBusy, setAiBusy] = useState(false)
  const [bulk, setBulk] = useState('')
  const [bulkMsg, setBulkMsg] = useState('')
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

  const aiPolish = async () => {
    if (!form.name) return
    setAiBusy(true)
    try {
      const resp = await askAi([
        { role: 'system', content: 'For a Nigerian shop inventory, given a product name reply with ONE line: <category>: <description max 10 words>. Category from: Fashion, Electronics, Home, Beauty, Food, Other.' },
        { role: 'user', content: form.name },
      ])
      const [cat, desc] = (resp || '').split(':')
      if (cat && desc) {
        setForm((f) => ({ ...f, name: f.name, emoji: emojiFor(cat.trim()) }))
        setBulkMsg(`${cat.trim()} — ${desc.trim()}`)
      }
    } catch { setBulkMsg('ai unavailable') } finally { setAiBusy(false) }
  }

  const runBulk = async () => {
    if (!bulk.trim()) return
    setAiBusy(true)
    try {
      const resp = await askAi([
        { role: 'system', content: 'Convert a messy product list into JSON array of {name,cost,price,stock}. Numbers as plain digits (naira). Missing fields: guess typical Nigerian prices. Reply with ONLY the JSON.' },
        { role: 'user', content: bulk },
      ])
      const items = JSON.parse(resp.slice(resp.indexOf('['), resp.lastIndexOf(']') + 1))
      const next = [...products, ...items.map((x: { name: string; cost?: number; price?: number; stock?: number }, n: number) => ({
        id: 'b' + Date.now().toString(36) + n, name: x.name, cost: x.cost ?? 0, price: x.price ?? 0, stock: x.stock ?? 0, emoji: '📦',
      }))]
      persist(next)
      setBulk('')
      setBulkMsg(`imported ${items.length} products ✅`)
    } catch { setBulkMsg('could not parse that list, try clearer formatting') } finally { setAiBusy(false) }
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
          {isAiReady() && (
            <button onClick={aiPolish} disabled={aiBusy} className="w-full rounded-xl border border-emerald-500 py-2 text-xs font-semibold text-emerald-400" data-testid="ai-polish">
              {aiBusy ? 'thinking…' : '✨ AI: guess category + emoji'}
            </button>
          )}
          <button onClick={submit} className="w-full rounded-xl bg-emerald-500 py-2.5 font-semibold text-stone-950" data-testid="save-product">
            Save product
          </button>
        </div>
      )}

      <div className="mb-4 space-y-2 rounded-2xl border border-stone-800 bg-stone-900 p-3">
        <div className="text-xs font-semibold text-stone-400">📋 Bulk import (paste any messy list, AI structures it)</div>
        <textarea value={bulk} onChange={(e) => setBulk(e.target.value)} rows={3} placeholder="e.g. 5 crates of eggs at 4800 sell 5500, 20 bread 900/1500..." className="w-full rounded-xl border border-stone-700 bg-stone-950 px-3 py-2 text-sm" data-testid="bulk-input" />
        <button onClick={runBulk} disabled={aiBusy} className="w-full rounded-xl bg-stone-800 py-2 text-xs font-semibold disabled:opacity-40" data-testid="bulk-import">
          {aiBusy ? 'thinking…' : 'Import with AI'}
        </button>
        {bulkMsg && <p className="text-xs text-emerald-400">{bulkMsg}</p>}
      </div>

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
