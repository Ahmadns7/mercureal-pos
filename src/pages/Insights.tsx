import { useState } from 'react'
import { formatNaira } from '../lib/format'
import { loadInventory, loadSales, currentStock, loadStockDeltas, summarizeDay, todayKey } from '../lib/store'
import { loadDebts, owes, outstanding } from '../lib/debts'
import { loadExpenses, type Expense } from '../lib/expenses'
import { askAi, isAiReady } from '../lib/ai'
import { forecast, productTrends, slowDayAlert, marginFlags, salesContext, bestSellers } from '../lib/insights'

type Card = { title: string; body: string; testid: string }

export default function Insights() {
  const [cards, setCards] = useState<Card[]>([])
  const [busy, setBusy] = useState<string | null>(null)

  const products = loadInventory()
  const sales = loadSales()
  const deltas = loadStockDeltas()
  const debts = loadDebts()
  const expenses: Expense[] = loadExpenses()

  const ctx = () => salesContext(sales, products)
  const runLocal = (id: string, fn: () => string) => {
    const body = fn()
    setCards((c) => [{ title: id, body, testid: `card-${id}` }, ...c.filter((x) => x.title !== id)])
  }

  const runAi = async (id: string, prompt: string, fallback: () => string) => {
    setBusy(id)
    runLocal(id, fallback)
    try {
      const body = await askAi([
        { role: 'system', content: 'You are a concise business advisor for a small Nigerian shop. Use naira amounts. Max 5 short bullet lines, plain text only.' },
        { role: 'user', content: `${ctx()}\n\nTask: ${prompt}` },
      ])
      if (body) setCards((c) => [{ title: id, body, testid: `card-${id}` }, ...c.filter((x) => x.title !== id)])
    } catch (e) {
      // rule-based fallback already on the card; note the ai miss quietly
      if (e instanceof Error && e.message !== 'no groq key set') {
        setCards((c) => c.map((x) => (x.title === id ? { ...x, body: x.body + '\n(ai unavailable, showing rule-based analysis)' } : x)))
      }
    } finally {
      setBusy(null)
    }
  }

  const dailyInsights = () => runAi('daily insights', 'Summarize business health today: revenue trend, profit quality, one thing to change this week.', () => {
    const t = summarizeDay(sales, todayKey())
    const f = forecast(sales)
    return [
      `today: ${t.count} sales, ${formatNaira(t.revenue)} revenue, ${formatNaira(t.profit)} profit`,
      `7-day forecast: about ${formatNaira(f.next7)} (${f.trendPct >= 0 ? '+' : ''}${f.trendPct}% trend)`,
      slowDayAlert(sales) ?? 'pace looks normal vs recent days',
    ].join('\n')
  })

  const restockPlan = () => runAi('restock plan', 'Create a restock plan: what to buy, how many, priority order, using stock levels and sales pace.', () => {
    const low = products.filter((p) => currentStock(products, deltas, p.id) <= 10)
    return low.length
      ? low.map((p) => `${p.emoji} ${p.name}: ${currentStock(products, deltas, p.id)} left, restock soon`).join('\n')
      : 'stock levels look healthy'
  })

  const pricingAdvisor = () => runAi('pricing advisor', 'Review product prices vs cost. Flag thin margins and suggest better selling prices where obvious.', () => {
    const m = marginFlags(products)
    return [
      ...m.tooThin.map((p) => `${p.name}: margin only ${formatNaira(p.price - p.cost)} (${Math.round(((p.price - p.cost) / p.price) * 100)}%) — raise price or renegotiate cost`),
      ...m.tooWide.map((p) => `${p.name}: margin very wide (${Math.round(((p.price - p.cost) / p.price) * 100)}%) — check competitors, u may be overpriced`),
    ].join('\n') || 'margins look reasonable across the shelf'
  })

  const cashflowAdvisor = () => runAi('cashflow advisor', 'Comment on cashflow: take-home after expenses, credit outstanding, one concrete action.', () => {
    const owed = outstanding(debts)
    const todayExpenses = (expenses as Expense[]).filter((e) => e.at.slice(0, 10) === todayKey()).reduce((s, e) => s + e.amount, 0)
    const t = summarizeDay(sales, todayKey())
    return `take-home today: ${formatNaira(t.profit - todayExpenses)} (profit ${formatNaira(t.profit)} − expenses ${formatNaira(todayExpenses)})\n${owed > 0 ? `${formatNaira(owed)} is sitting in the credit book — follow up with debtors` : 'no credit outstanding'}`
  })

  const weeklyReport = () => runAi('weekly report', 'Write a short weekly business report: totals, best sellers, what to do next week.', () => {
    const bs = bestSellers(sales, 3)
    const rev = sales.reduce((s, x) => s + x.items.reduce((n, i) => n + i.qty * i.price, 0), 0)
    return `all-time revenue ${formatNaira(rev)}\ntop sellers: ${bs.map((b) => `${b.name} (${b.qty})`).join(', ')}`
  })

  const trends = () => runLocal('product trends', () => {
    const t = productTrends(sales)
    return [
      t.rising.length ? `rising: ${t.rising.join(', ')}` : 'no clear risers yet',
      t.falling.length ? `cooling: ${t.falling.join(', ')} — consider a promo` : 'nothing cooling badly',
    ].join('\n')
  })

  const creditFollowup = () => runAi('credit follow-up', 'Draft polite follow-up messages (naija flavour) for the top debtors, one message each.', () => {
    const open = debts.filter((d) => owes(d) > 0).slice(0, 3)
    return open.map((d) => `Hello ${d.name}, gentle reminder: ${formatNaira(owes(d))} is due when u're able. Thank u! 🙏`).join('\n') || 'nobody owes rn'
  })

  const tools: [string, () => void, string][] = [
    ['Daily insights', dailyInsights, '📊'],
    ['Restock plan', restockPlan, '📦'],
    ['Pricing advisor', pricingAdvisor, '🏷️'],
    ['Cashflow advisor', cashflowAdvisor, '💸'],
    ['Weekly report', weeklyReport, '🧾'],
    ['Product trends', trends, '📈'],
    ['Debt reminders', creditFollowup, '📒'],
  ]

  return (
    <div className="pb-4">
      <h1 className="mb-1 text-xl font-bold">AI insights</h1>
      <p className="mb-4 text-xs text-stone-500">
        {isAiReady() ? 'groq key set — full ai analysis' : 'no key set — rule-based analysis only, add a free groq key in Backup → AI settings'}
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        {tools.map(([label, fn, icon]) => (
          <button key={label} onClick={fn} disabled={busy !== null} className="rounded-full bg-stone-800 px-3 py-1.5 text-xs disabled:opacity-40" data-testid={`tool-${label}`}>
            {icon} {busy === label ? 'thinking…' : label}
          </button>
        ))}
      </div>

      {cards.map((c) => (
        <div key={c.title} className="mb-3 rounded-2xl border border-stone-800 bg-stone-900 p-3">
          <div className="mb-1 text-sm font-semibold text-emerald-400">{c.title}</div>
          <div className="whitespace-pre-wrap text-xs text-stone-300" data-testid={c.testid}>{c.body}</div>
        </div>
      ))}
      {cards.length === 0 && <p className="py-10 text-center text-sm text-stone-500">tap a tool above</p>}
    </div>
  )
}
