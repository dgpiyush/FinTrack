import { useMemo, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, Plus } from 'lucide-react'
import { CURRENCY_OPTIONS, getCategoryOptions } from '../types'
import { useAuth } from '../hooks/useAuth'
import { useFinTrack } from '../hooks/useFinTrack'
import { Button } from '../components/ui/Button'
import { useToast } from '../components/ui/Toast'

export function SettingsPage() {
  const { profile } = useAuth()
  const { user, syncMeta, triggerSync, exportBackup, importBackup, updateProfile, createCustomCategory, moveCategory, theme, setTheme, clearLocalData, deleteDriveData } = useFinTrack()
  const { pushToast } = useToast()
  const [currency, setCurrency] = useState(user?.currency ?? 'INR')
  const [budget, setBudget] = useState(String(user?.monthlyBudget ?? 0))
  const importRef = useRef<HTMLInputElement>(null)
  const categoryOptions = useMemo(() => getCategoryOptions(user), [user])

  return (
    <div className="space-y-5">
      <section className="rounded-[28px] bg-white p-5 shadow-sm dark:bg-stone-900">
        <h3 className="font-semibold text-stone-900 dark:text-stone-50">Profile</h3>
        <div className="mt-4 space-y-3">
          <input value={profile?.name ?? ''} readOnly className="w-full rounded-2xl bg-stone-100 px-4 py-3 dark:bg-stone-800" />
          <input value={profile?.email ?? ''} readOnly className="w-full rounded-2xl bg-stone-100 px-4 py-3 dark:bg-stone-800" />
          <select value={currency} onChange={(event) => setCurrency(event.target.value)} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 dark:border-stone-700 dark:bg-stone-800">
            {CURRENCY_OPTIONS.map(([code, symbol, label]) => (
              <option key={code} value={code}>
                {symbol} {code} — {label}
              </option>
            ))}
          </select>
          <input inputMode="decimal" value={budget} onChange={(event) => setBudget(event.target.value)} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 dark:border-stone-700 dark:bg-stone-800" />
          <Button fullWidth onClick={async () => { await updateProfile({ currency, monthlyBudget: Number(budget || 0) }); pushToast('Profile updated') }}>
            Save profile
          </Button>
        </div>
      </section>

      <section className="rounded-[28px] bg-white p-5 shadow-sm dark:bg-stone-900">
        <h3 className="font-semibold text-stone-900 dark:text-stone-50">Data & sync</h3>
        <p className="mt-2 text-sm text-stone-500">Last synced: {syncMeta.lastSyncedAt ? new Date(syncMeta.lastSyncedAt).toLocaleString() : 'Never'}</p>
        <div className="mt-4 grid gap-3">
          <Button fullWidth onClick={async () => { await triggerSync(true); pushToast('Sync requested') }}>
            Sync now
          </Button>
          <Button
            variant="secondary"
            fullWidth
            onClick={() => {
              const blob = new Blob([JSON.stringify(exportBackup(), null, 2)], { type: 'application/json' })
              const url = URL.createObjectURL(blob)
              const link = document.createElement('a')
              link.href = url
              link.download = 'fintrack-backup.json'
              link.click()
              URL.revokeObjectURL(url)
            }}
          >
            Export all data
          </Button>
          <Button variant="secondary" fullWidth onClick={() => importRef.current?.click()}>
            Import data
          </Button>
          <input
            ref={importRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={async (event) => {
              const file = event.target.files?.[0]
              if (!file) return
              try {
                const text = await file.text()
                const backup = JSON.parse(text)
                if (!backup || backup.version !== 2 || !Array.isArray(backup.expenses)) throw new Error('invalid')
                await importBackup(backup)
                pushToast('Backup imported')
              } catch {
                pushToast("This file doesn't look like a FinTrack backup.")
              }
            }}
          />
          <Button variant="ghost" fullWidth onClick={() => window.open('https://drive.google.com/drive/home', '_blank')}>
            View data in Google Drive
          </Button>
        </div>
      </section>

      <section className="rounded-[28px] bg-white p-5 shadow-sm dark:bg-stone-900">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold text-stone-900 dark:text-stone-50">Categories</h3>
          <Button
            variant="secondary"
            onClick={async () => {
              const label = window.prompt('New category name')
              if (!label) return
              const id = await createCustomCategory(label)
              if (id) pushToast('Category added')
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add
          </Button>
        </div>
        <div className="mt-4 space-y-3">
          {categoryOptions.map((category, index) => (
            <div key={category.id} className="flex items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 dark:border-stone-700 dark:bg-stone-800">
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: category.color }} />
                <span className="font-medium text-stone-900 dark:text-stone-50">{category.label}</span>
              </div>
              <div className="flex gap-2">
                <button
                  className="min-h-11 min-w-11 rounded-xl bg-white text-stone-700 disabled:opacity-40 dark:bg-stone-900 dark:text-stone-100"
                  disabled={index === 0}
                  onClick={async () => {
                    await moveCategory(category.id, 'up')
                  }}
                >
                  <ArrowUp className="mx-auto h-4 w-4" />
                </button>
                <button
                  className="min-h-11 min-w-11 rounded-xl bg-white text-stone-700 disabled:opacity-40 dark:bg-stone-900 dark:text-stone-100"
                  disabled={index === categoryOptions.length - 1}
                  onClick={async () => {
                    await moveCategory(category.id, 'down')
                  }}
                >
                  <ArrowDown className="mx-auto h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[28px] bg-white p-5 shadow-sm dark:bg-stone-900">
        <h3 className="font-semibold text-stone-900 dark:text-stone-50">Appearance</h3>
        <div className="mt-4 flex gap-2">
          {(['system', 'light', 'dark'] as const).map((option) => (
            <button key={option} onClick={() => setTheme(option)} className={`rounded-full px-4 py-2 text-sm ${theme === option ? 'bg-emerald-700 text-white' : 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-200'}`}>
              {option}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-[28px] border border-red-200 bg-red-50 p-5 shadow-sm dark:border-red-900/50 dark:bg-red-950/30">
        <h3 className="font-semibold text-red-700 dark:text-red-300">Danger zone</h3>
        <div className="mt-4 grid gap-3">
          <Button
            variant="danger"
            fullWidth
            onClick={async () => {
              const input = window.prompt('Type DELETE to clear all local data')
              if (input !== 'DELETE') return
              await clearLocalData()
            }}
          >
            Clear all local data
          </Button>
          <Button
            variant="danger"
            fullWidth
            onClick={async () => {
              const input = window.prompt('Type DELETE to remove your Drive backup')
              if (input !== 'DELETE') return
              await deleteDriveData()
              pushToast('Drive backup deleted')
            }}
          >
            Delete my account data from Drive
          </Button>
        </div>
      </section>
    </div>
  )
}
