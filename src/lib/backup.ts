const KEYS = ['mr-pos-inventory', 'mr-pos-sales', 'mr-pos-stock', 'mr-pos-debts'] as const

export type Backup = { app: 'mercureal-pos'; version: 1; exportedAt: string; data: Record<string, unknown> }

export function makeBackup(): Backup {
  const data: Record<string, unknown> = {}
  for (const k of KEYS) {
    const raw = localStorage.getItem(k)
    data[k] = raw ? JSON.parse(raw) : null
  }
  return { app: 'mercureal-pos', version: 1, exportedAt: new Date().toISOString(), data }
}

export function restoreBackup(json: string): boolean {
  let parsed: Backup
  try {
    parsed = JSON.parse(json)
  } catch {
    return false
  }
  if (parsed?.app !== 'mercureal-pos' || typeof parsed.data !== 'object' || parsed.data === null) return false
  for (const k of KEYS) {
    const v = parsed.data[k]
    if (v === null || v === undefined) localStorage.removeItem(k)
    else localStorage.setItem(k, JSON.stringify(v))
  }
  return true
}

export function downloadFile(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function salesCsv(sales: { id: string; at: string; method: string; items: { name: string; qty: number; price: number; cost: number }[] }[]): string {
  const rows = [['sale_id', 'datetime', 'method', 'item', 'qty', 'unit_price', 'unit_cost', 'line_total']]
  for (const s of sales)
    for (const i of s.items)
      rows.push([s.id, s.at, s.method, i.name, String(i.qty), String(i.price), String(i.cost), String(i.qty * i.price)])
  return rows.map((r) => r.map((c) => (c.includes(',') || c.includes('"') ? '"' + c.replaceAll('"', '""') + '"' : c)).join(',')).join('\n')
}
