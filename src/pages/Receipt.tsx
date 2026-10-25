import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { formatNaira } from '../lib/format'
import { loadSales, saleTotal } from '../lib/store'
import { askAi } from '../lib/ai'

export default function Receipt() {
  const { id } = useParams()
  const sale = loadSales().find((s) => s.id === id)
  if (!sale) return <p className="py-10 text-center text-stone-500">Receipt not found</p>

  const total = saleTotal(sale)
  const text =
    `MERCUREAL POS — RECEIPT\n${sale.id}\n${new Date(sale.at).toLocaleString('en-NG')}\n` +
    sale.items.map((i) => `${i.name} x${i.qty} — ${formatNaira(i.qty * i.price)}`).join('\n') +
    ((sale.discount ?? 0) ? `\nDiscount: -${formatNaira(sale.discount ?? 0)}` : '') +
    `\nTOTAL: ${formatNaira(total)} (${sale.method})\nThank you!`

  const share = () => {
    if (navigator.share) navigator.share({ title: 'Receipt ' + sale.id, text }).catch(() => {})
    else window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank')
  }

  const [note, setNote] = useState<string | null>(null)
  const genNote = async () => {
    setNote('…')
    try {
      const n = await askAi([
        { role: 'system', content: 'Write one warm, short thank-you line for a shop receipt. Nigerian flavour, max 12 words, no quotes.' },
        { role: 'user', content: `Items: ${sale.items.map((i) => i.name).join(', ')}. Total: ${total}` },
      ])
      setNote(n || 'thank you for ur patronage! 🙏')
    } catch {
      setNote('thank you for ur patronage! 🙏')
    }
  }

  return (
    <div>
      <div className="rounded-2xl border border-stone-800 bg-stone-900 p-4 font-mono text-xs" data-testid="receipt-body">
        <div className="mb-2 text-center font-bold">MERCUREAL POS</div>
        <div className="mb-3 text-center text-stone-500">{sale.id} · {new Date(sale.at).toLocaleString('en-NG')}</div>
        {sale.items.map((i, n) => (
          <div key={n} className="flex justify-between py-0.5">
            <span>{i.name} x{i.qty}</span>
            <span>{formatNaira(i.qty * i.price)}</span>
          </div>
        ))}
        {(sale.discount ?? 0) > 0 && <div className="flex justify-between py-0.5 text-stone-500"><span>Discount</span><span>−{formatNaira(sale.discount ?? 0)}</span></div>}
        <div className="mt-2 flex justify-between border-t border-dashed border-stone-700 pt-2 font-bold">
          <span>TOTAL</span><span>{formatNaira(total)}</span>
        </div>
        <div className="mt-1 text-center text-stone-500">paid via {sale.method}{note ? ` · ${note}` : ''}</div>
      </div>
      <div className="mt-4 flex gap-2">
        <button onClick={() => window.print()} className="flex-1 rounded-xl border border-stone-700 py-3 font-semibold">Print</button>
        <button onClick={share} className="flex-1 rounded-xl bg-emerald-500 py-3 font-semibold text-stone-950" data-testid="share">Share</button>
      </div>
      <button onClick={genNote} className="mt-3 w-full rounded-xl border border-stone-700 py-2.5 text-sm font-semibold" data-testid="ai-note">
        {note ? 'Note added ✅' : '✨ AI thank-you note'}
      </button>
    </div>
  )
}
