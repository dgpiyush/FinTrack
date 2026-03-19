import { Outlet, useLocation } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { Header } from './Header'

const titles: Record<string, string> = {
  '/': 'FinTrack',
  '/expenses': 'Expenses',
  '/trips': 'Trips',
  '/analytics': 'Analytics',
  '/budgets': 'Budgets',
  '/settings': 'Settings',
}

export function Layout() {
  const location = useLocation()
  const title =
    location.pathname.startsWith('/trips/') && location.pathname !== '/trips'
      ? 'Trip details'
      : (titles[location.pathname] ?? 'FinTrack')

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,110,86,0.12),_transparent_35%),linear-gradient(180deg,#f8faf7_0%,#f5f3ef_100%)] pb-24 dark:bg-[radial-gradient(circle_at_top,_rgba(22,163,74,0.18),_transparent_35%),linear-gradient(180deg,#0f1720_0%,#111827_100%)]">
      <Header title={title} />
      <main className="mx-auto max-w-xl px-4 pb-8 pt-4">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
