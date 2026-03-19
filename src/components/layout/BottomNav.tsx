import { BarChart3, Home, ReceiptText, WalletCards } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const items = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/expenses', label: 'Expenses', icon: ReceiptText },
  { to: '/trips', label: 'Trips', icon: WalletCards },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
]

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/95 backdrop-blur dark:border-stone-800 dark:bg-stone-950/90">
      <div className="mx-auto grid max-w-xl grid-cols-4 px-2 pb-safe">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl text-xs ${
                isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-stone-500'
              }`
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
