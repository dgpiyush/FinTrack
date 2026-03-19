import { CloudOff, LoaderCircle, RefreshCw, ShieldCheck } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useFinTrack } from '../../hooks/useFinTrack'

function SyncChip() {
  const { syncState } = useFinTrack()

  const config =
    syncState === 'synced'
      ? { label: 'Synced', className: 'bg-emerald-50 text-emerald-700', icon: ShieldCheck }
      : syncState === 'syncing'
        ? { label: 'Syncing...', className: 'bg-amber-50 text-amber-700', icon: LoaderCircle }
        : { label: 'Offline', className: 'bg-red-50 text-red-700', icon: CloudOff }

  const Icon = config.icon

  return (
    <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${config.className}`}>
      <Icon className={`h-3.5 w-3.5 ${syncState === 'syncing' ? 'animate-spin' : ''}`} />
      {config.label}
    </div>
  )
}

export function Header({ title = 'FinTrack', actions }: { title?: string; actions?: ReactNode }) {
  const navigate = useNavigate()
  const { profile, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/90 px-4 py-4 backdrop-blur dark:border-stone-800 dark:bg-stone-950/90">
      <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
        <div>
          <Link to="/" className="text-lg font-semibold text-stone-900 dark:text-stone-50">
            {title}
          </Link>
          <div className="mt-2">
            <SyncChip />
          </div>
        </div>
        <div className="relative flex items-center gap-2">
          {actions}
          {profile && (
            <>
              <button
                className="overflow-hidden rounded-full border border-stone-200 dark:border-stone-800"
                onClick={() => setMenuOpen((current) => !current)}
              >
                <img src={profile.picture} alt={profile.name} className="h-11 w-11 object-cover" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-14 w-44 rounded-2xl border border-stone-200 bg-white p-2 shadow-xl dark:border-stone-800 dark:bg-stone-900">
                  <button
                    className="flex min-h-11 w-full items-center rounded-xl px-3 text-left text-sm text-stone-700 hover:bg-stone-100 dark:text-stone-100 dark:hover:bg-stone-800"
                    onClick={() => {
                      navigate('/settings')
                      setMenuOpen(false)
                    }}
                  >
                    Profile
                  </button>
                  <button
                    className="flex min-h-11 w-full items-center rounded-xl px-3 text-left text-sm text-stone-700 hover:bg-stone-100 dark:text-stone-100 dark:hover:bg-stone-800"
                    onClick={() => {
                      navigate('/settings')
                      setMenuOpen(false)
                    }}
                  >
                    Settings
                  </button>
                  <button
                    className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-left text-sm text-stone-700 hover:bg-stone-100 dark:text-stone-100 dark:hover:bg-stone-800"
                    onClick={() => {
                      signOut()
                      navigate('/login')
                    }}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  )
}
