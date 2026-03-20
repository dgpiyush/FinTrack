import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { useFinTrack } from '../../hooks/useFinTrack'
import { getDaysLeft } from '../../utils/date'
import { formatCurrency } from '../../utils/currency'
import { ExpenseList } from '../expenses/ExpenseList'
import { AddExpenseSheet } from '../expenses/AddExpenseSheet'
import { EmptyState } from '../ui/EmptyState'
import { Button } from '../ui/Button'
import { useToast } from '../ui/Toast'

export function TripDetail() {
  const { id } = useParams()
  const { trips, expenses, user } = useFinTrack()
  const { pushToast } = useToast()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null)
  const trip = trips.find((item) => item.id === id)
  const tripExpenses = useMemo(() => expenses.filter((expense) => expense.tripId === id), [expenses, id])

  if (!trip) {
    return <EmptyState emoji="🧳" title="Trip not found" description="This trip is missing or has been deleted." actionLabel="Back to trips" onAction={() => window.history.back()} />
  }

  const spent = tripExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  const remaining = Math.max(trip.budget - spent, 0)
  const daysLeft = getDaysLeft(trip.endDate)
  const budgetPerDay = daysLeft > 0 ? remaining / Math.max(daysLeft, 1) : remaining
  const selectedExpense = tripExpenses.find((item) => item.id === selectedExpenseId) ?? null

  return (
    <div className="space-y-5">
      <section className="rounded-[30px] bg-white p-5 shadow-sm dark:bg-stone-900">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-4xl">{trip.coverEmoji}</div>
            <h2 className="mt-3 text-2xl font-semibold text-stone-900 dark:text-stone-50">{trip.name}</h2>
            <p className="text-sm text-stone-500">{trip.destination}</p>
            <p className="mt-1 text-sm text-stone-500">
              {trip.startDate} to {trip.endDate}
            </p>
          </div>
          <div className="h-28 w-28">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={[{ value: spent }, { value: Math.max(trip.budget - spent, 0) }]} dataKey="value" innerRadius={28} outerRadius={44}>
                  <Cell fill="#0f6e56" />
                  <Cell fill="#d6d3d1" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-stone-50 p-4 dark:bg-stone-800">
            <p className="text-sm text-stone-500">Budget remaining</p>
            <p className="mt-1 font-semibold text-stone-900 dark:text-stone-50">{formatCurrency(remaining, trip.currency)}</p>
          </div>
          <div className="rounded-2xl bg-stone-50 p-4 dark:bg-stone-800">
            <p className="text-sm text-stone-500">Daily burn rate</p>
            <p className="mt-1 font-semibold text-stone-900 dark:text-stone-50">{formatCurrency(budgetPerDay, trip.currency)}/day</p>
          </div>
        </div>
      </section>

      {tripExpenses.length ? (
        <ExpenseList
          expenses={tripExpenses}
          user={user}
          onSelect={(expense) => {
            setSelectedExpenseId(expense.id)
            setSheetOpen(true)
          }}
          onDelete={() => undefined}
        />
      ) : (
        <EmptyState emoji="🍜" title="No trip expenses yet" description="Keep this trip tidy by logging travel, stay, and meal costs here." actionLabel="Add expense" onAction={() => setSheetOpen(true)} />
      )}

      <Button
        className="fixed bottom-24 right-4 z-20 rounded-full px-5 shadow-xl"
        onClick={() => {
          setSelectedExpenseId(null)
          setSheetOpen(true)
        }}
      >
        Add expense to trip
      </Button>

      <AddExpenseSheet
        open={sheetOpen}
        expense={selectedExpense}
        initialTripId={trip.id}
        onClose={() => setSheetOpen(false)}
        onSaved={() => pushToast(selectedExpense ? 'Expense updated' : 'Expense saved')}
      />
    </div>
  )
}
