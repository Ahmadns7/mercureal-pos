import { useRef, useState } from 'react'
import { downloadFile, makeBackup, restoreBackup, salesCsv } from '../lib/backup'
import { loadSales } from '../lib/store'

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
    </div>
  )
}
