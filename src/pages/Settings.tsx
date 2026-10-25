import { useRef, useState } from 'react'
import { downloadFile, makeBackup, restoreBackup, salesCsv } from '../lib/backup'
import { loadSales } from '../lib/store'
import { loadSyncSettings, pullSnapshot, pushSnapshot, saveSyncSettings } from '../lib/sync'

export default function Settings() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')

  const exportCsv = () => {
    const csv = salesCsv(loadSales())
    downloadFile(`mercureal-pos-sales-${new Date().toISOString().slice(0, 10)}.csv`, csv, 'text/csv')
    setMsg('sales csv downloaded')
  }

  const backup = () => {
    downloadFile(`mercureal-pos-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(makeBackup()), 'application/json')
    setMsg('backup downloaded')
  }

  const restore = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const ok = restoreBackup(String(reader.result))
      setMsg(ok ? 'restored ✅ reload to see it' : 'that file is not a mercureal-pos backup ❌')
    }
    reader.readAsText(file)
  }

  const syncCfg = loadSyncSettings()
  const [shopId, setShopId] = useState(syncCfg?.shopId ?? '')
  const [pin, setPin] = useState(syncCfg?.pin ?? '')
  const [syncMsg, setSyncMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const connect = () => {
    if (!shopId.trim() || pin.length < 4) {
      setSyncMsg('shop id + a 4+ digit pin required')
      return
    }
    saveSyncSettings({ shopId: shopId.trim(), pin })
    setSyncMsg('sync connected ✅')
  }

  const run = async (fn: () => Promise<string>, label: string) => {
    setBusy(true)
    try {
      setSyncMsg(await fn())
    } catch (e) {
      setSyncMsg(`${label} failed: ${e instanceof Error ? e.message : 'error'}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">Backup</h1>
      <p className="mb-4 text-sm text-stone-500">Data lives only on this device. Download a backup regularly, especially before clearing browser data.</p>
      <div className="space-y-2">
        <button onClick={exportCsv} className="w-full rounded-xl bg-stone-900 border border-stone-800 py-3 font-semibold" data-testid="export-csv">
          Export sales as CSV
        </button>
        <button onClick={backup} className="w-full rounded-xl bg-emerald-500 py-3 font-semibold text-stone-950" data-testid="backup">
          Download full backup
        </button>
        <button onClick={() => fileRef.current?.click()} className="w-full rounded-xl border border-stone-700 py-3 font-semibold" data-testid="restore">
          Restore from backup file
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) restore(f)
            e.target.value = ''
          }}
        />
      </div>
      {msg && <p className="mt-3 text-center text-sm text-emerald-400" data-testid="msg">{msg}</p>}

      <h1 className="mb-2 mt-8 text-xl font-bold">Cloud sync</h1>
      <p className="mb-3 text-sm text-stone-500">One shop id + pin per shop. Use the same pair on any device to push/pull everything. Pin is checked on pull.</p>
      <div className="space-y-2 rounded-2xl border border-stone-800 bg-stone-900 p-3">
        <div className="flex gap-2">
          <input value={shopId} onChange={(e) => setShopId(e.target.value)} placeholder="Shop id (e.g. ada-shop)" className="w-full rounded-xl border border-stone-700 bg-stone-950 px-3 py-2" data-testid="shop-id" />
          <input value={pin} onChange={(e) => setPin(e.target.value)} inputMode="numeric" type="password" placeholder="Pin" className="w-28 rounded-xl border border-stone-700 bg-stone-950 px-3 py-2" data-testid="sync-pin" />
        </div>
        <button onClick={connect} className="w-full rounded-xl bg-stone-800 py-2.5 text-sm font-semibold" data-testid="connect">Save pair</button>
        <button onClick={() => run(async () => { await pushSnapshot(shopId.trim(), pin); return 'pushed to cloud ☁️ ✅' }, 'push')} disabled={busy} className="w-full rounded-xl bg-emerald-500 py-2.5 font-semibold text-stone-950 disabled:opacity-40" data-testid="push">
          {busy ? 'Working…' : 'Push to cloud'}
        </button>
        <button onClick={() => run(async () => { await pullSnapshot(shopId.trim(), pin); return 'pulled ✅ reload the page to see it' }, 'pull')} disabled={busy} className="w-full rounded-xl border border-emerald-500 py-2.5 font-semibold text-emerald-400 disabled:opacity-40" data-testid="pull">
          Pull from cloud
        </button>
        {syncMsg && <p className="text-center text-xs text-emerald-400" data-testid="sync-msg">{syncMsg}</p>}
      </div>
    </div>
  )
}
