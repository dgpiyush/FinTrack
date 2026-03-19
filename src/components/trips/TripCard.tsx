import { Link } from 'react-router-dom'
import { getTripStatus } from '../../utils/date'
import { formatCurrency } from '../../utils/currency'
import type { Expense, Trip } from '../../types'

export function TripCard({ trip, expenses }: { trip: Trip; expenses: Expense[] }) {
  const spent = expenses.filter((expense) => expense.tripId === trip.id).reduce((sum, expense) => sum + expense.amount, 0)
  const progress = trip.budget ? Math.min((spent / trip.budget) * 100, 100) : 0
  const status = getTripStatus(trip.startDate, trip.endDate)

  return (
    <Link to={`/trips/${trip.id}`} className="rounded-[28px] bg-white p-4 shadow-sm dark:bg-stone-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-3xl">{trip.coverEmoji}</div>
          <h3 className="mt-3 font-semibold text-stone-900 dark:text-stone-50">{trip.name}</h3>
          <p className="text-sm text-stone-500">{trip.destination}</p>
        </div>
        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700 dark:bg-stone-800 dark:text-stone-200">
          {status}
        </span>
      </div>
      <p className="mt-4 text-sm text-stone-500">
        {trip.startDate} to {trip.endDate}
      </p>
      <p className="mt-2 text-sm font-medium text-stone-700 dark:text-stone-200">
        {formatCurrency(spent, trip.currency)} of {formatCurrency(trip.budget, trip.currency)} spent
      </p>
      <div className="mt-3 h-2 rounded-full bg-stone-200 dark:bg-stone-800">
        <div className="h-2 rounded-full bg-emerald-600" style={{ width: `${progress}%` }} />
      </div>
    </Link>
  )
}
