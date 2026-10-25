import { useRef, useState } from 'react'
import { askAi, isAiReady } from '../lib/ai'
import { loadInventory, loadSales } from '../lib/store'
import { salesContext } from '../lib/insights'
import { loadDebts, owes } from '../lib/debts'
import { loadExpenses } from '../lib/expenses'

type Msg = { role: 'user' | 'assistant'; content: string }

export default function AiChat() {
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  const send = async () => {
    const text = input.trim()
    if (!text || busy) return
    setInput('')
    setMsgs((m) => [...m, { role: 'user', content: text }])
    setBusy(true)
    try {
      const reply = await askAi([
        {
          role: 'system',
          content:
            'You are MercuReal Assistant inside a POS app for a small Nigerian shop. Answer from the data below, use naira amounts, be brief and practical. If the data does not contain the answer, say so honestly.',
        },
        {
          role: 'user',
          content:
            salesContext(loadSales(), loadInventory()) +
            `\nexpenses: ${JSON.stringify(loadExpenses())}\ncredit book: ${JSON.stringify(loadDebts().map((d) => ({ name: d.name, owed: owes(d) })))}` +
            `\n\nQuestion: ${text}`,
        },
      ])
      setMsgs((m) => [...m, { role: 'assistant', content: reply || '(empty reply)' }])
    } catch (e) {
      setMsgs((m) => [...m, { role: 'assistant', content: e instanceof Error && e.message === 'no groq key set' ? 'add ur free groq key in Backup → AI settings first' : 'ai failed, try again' }])
    } finally {
      setBusy(false)
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
  }

  return (
    <div className="flex flex-col" style={{ minHeight: '70vh' }}>
      <h1 className="mb-1 text-xl font-bold">Ask my books</h1>
      <p className="mb-3 text-xs text-stone-500">{isAiReady() ? 'answers from ur actual sales, stock, credit and expenses' : 'needs a free groq key: Backup → AI settings'}</p>
      <div className="flex-1 space-y-2">
        {msgs.map((m, i) => (
          <div key={i} className={`rounded-2xl p-3 text-sm ${m.role === 'user' ? 'ml-8 bg-emerald-900/40' : 'mr-4 bg-stone-900 border border-stone-800'}`} data-testid={m.role === 'user' ? 'chat-user' : 'chat-ai'}>
            {m.content}
          </div>
        ))}
        {msgs.length === 0 && <p className="py-10 text-center text-sm text-stone-500">try "how was this week?" or "who owes me?"</p>}
        <div ref={endRef} />
      </div>
      <div className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder={busy ? 'thinking…' : 'Ask abt ur business'}
          disabled={busy}
          className="w-full rounded-xl border border-stone-700 bg-stone-950 px-3 py-2.5"
          data-testid="chat-input"
        />
        <button onClick={send} disabled={busy} className="rounded-xl bg-emerald-500 px-4 font-semibold text-stone-950 disabled:opacity-40" data-testid="chat-send">➤</button>
      </div>
    </div>
  )
}
