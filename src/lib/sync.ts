import { loadInventory, loadSales, loadStockDeltas, saveInventory, saveSales, saveStockDeltas } from './store'
import { loadDebts, saveDebts } from './debts'
import { loadExpenses, saveExpenses } from './expenses'

export type SyncSnapshot = {
  inventory: unknown
  sales: unknown
  stock: unknown
  debts: unknown
  expenses: unknown
  saved_at: string
}

export const SUPABASE_URL = 'https://fapupzahogvondmwscoq.supabase.co'
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhcHVwemFob2d2b25kbXdzY29xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4ODA5NTQsImV4cCI6MjEwODQ1Njk1NH0.usIm2CPqy3gqqEUIa6B8loU2GOHWOSZl-bFvWEjYJS0'

const SETTINGS_KEY = 'mr-pos-sync'
export type SyncSettings = { shopId: string; pin: string }
export function loadSyncSettings(): SyncSettings | null {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    const p = raw ? JSON.parse(raw) : null
    return p?.shopId && p?.pin ? p : null
  } catch {
    return null
  }
}
export function saveSyncSettings(s: SyncSettings | null) {
  if (s) localStorage.setItem(SETTINGS_KEY, JSON.stringify(s))
  else localStorage.removeItem(SETTINGS_KEY)
}

function localSnapshot(): Omit<SyncSnapshot, 'saved_at'> {
  return {
    inventory: loadInventory(),
    sales: loadSales(),
    stock: loadStockDeltas(),
    debts: loadDebts(),
    expenses: loadExpenses(),
  }
}

function applySnapshot(s: SyncSnapshot) {
  if (Array.isArray(s.inventory)) saveInventory(s.inventory)
  if (Array.isArray(s.sales)) saveSales(s.sales)
  if (typeof s.stock === 'object' && s.stock !== null) saveStockDeltas(s.stock as Record<string, number>)
  if (Array.isArray(s.debts)) saveDebts(s.debts)
  if (Array.isArray(s.expenses)) saveExpenses(s.expenses)
}

async function sb(path: string, init: RequestInit = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
      ...(init.headers || {}),
    },
  })
  if (!res.ok) throw new Error(`supabase ${res.status}: ${await res.text()}`)
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

export async function pushSnapshot(shopId: string, pin: string): Promise<void> {
  await sb('pos_sync', {
    method: 'POST',
    body: JSON.stringify([{ shop_id: shopId, pin, data: localSnapshot(), saved_at: new Date().toISOString() }]),
  })
}

export async function pullSnapshot(shopId: string, pin: string): Promise<SyncSnapshot> {
  const rows = await sb(`pos_sync?shop_id=eq.${encodeURIComponent(shopId)}&pin=eq.${encodeURIComponent(pin)}&select=data,saved_at&limit=1`)
  if (!rows || !rows[0]) throw new Error('no backup found for that shop id and pin')
  applySnapshot(rows[0].data)
  return rows[0].data
}
