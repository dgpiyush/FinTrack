import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { endOfMonth, isWithinInterval, parseISO, startOfMonth } from 'date-fns'
import { AddExpenseSheet } from '../components/expenses/AddExpenseSheet'
import { ExpenseList } from '../components/expenses/ExpenseList'
import { EmptyState } from '../components/ui/EmptyState'
import { useFinTrack } from '../hooks/useFinTrack'
import { formatCurrency } from '../utils/currency'
import { getCategoryMeta, type Expense } from '../types'
import { getDaysLeft, isTripActive } from '../utils/date'
import { useToast } from '../components/ui/Toast'
import { Button } from '../components/ui/Button'

export function DashboardPage() {
  const navigate = useNavigate()
  const { user, expenses, trips, budgets, deleteExpense } = useFinTrack()
  const { pushToast } = useToast()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)

  const currentMonthExpenses = useMemo(() => {
    const range = { start: startOfMonth(new Date()), end: endOfMonth(new Date()) }
    return expenses.filter((expense) => isWithinInterval(parseISO(expense.date), range))
  }, [expenses])

  const monthSpent = currentMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  const monthBudget = user?.monthlyBudget ?? 0
  const progress = monthBudget ? Math.min((monthSpent / monthBudget) * 100, 100) : 0
  const progressColor = progress >= 100 ? 'bg-red-500' : progress >= 80 ? 'bg-amber-500' : 'bg-emerald-600'
  const activeTrip = trips.find((trip) => isTripActive(trip.startDate, trip.endDate))
  const recentExpenses = expenses.slice(0, 10)
  const categoryBudgets = budgets.filter((budget) => budget.category !== 'total')

  return (
    <div className="space-y-5">
      <button onClick={() => navigate('/analytics')} className="w-full rounded-[30px] bg-white p-5 text-left shadow-sm dark:bg-stone-900">
        <p className="text-sm text-stone-500">Spent this month</p>
        <h2 className="mt-2 text-3xl font-semibold text-stone-900 dark:text-stone-50">{formatCurrency(monthSpent, user?.currency ?? 'INR')}</h2>
        <p className="mt-2 text-sm text-stone-500">of {formatCurrency(monthBudget, user?.currency ?? 'INR')} budget</p>
        <div className="mt-4 h-2 rounded-full bg-stone-200 dark:bg-stone-800">
          <div className={`h-2 rounded-full ${progressColor}`} style={{ width: `${progress}%` }} />
        </div>
      </button>

      {activeTrip ? (
        <Link to={`/trips/${activeTrip.id}`} className="block rounded-[30px] bg-emerald-700 p-5 text-white shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-emerald-100">Active trip</p>
              <h3 className="mt-1 text-xl font-semibold">
                {activeTrip.coverEmoji} {activeTrip.name}
              </h3>
              <p className="text-sm text-emerald-100">{activeTrip.destination}</p>
            </div>
            <p className="rounded-full bg-white/15 px-3 py-1 text-xs">{getDaysLeft(activeTrip.endDate)} days left</p>
          </div>
        </Link>
      ) : null}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-stone-900 dark:text-stone-50">Budget status</h3>
          <Link to="/budgets" className="text-sm text-emerald-700">
            Manage
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {categoryBudgets.length ? (
            categoryBudgets.map((budget) => {
              if (budget.category === 'total') return null
              const meta = getCategoryMeta(budget.category, user)
              const spent = currentMonthExpenses.filter((expense) => expense.category === budget.category).reduce((sum, expense) => sum + expense.amount, 0)
              return (
                <button key={budget.id} onClick={() => navigate('/analytics')} className="min-w-[180px] rounded-[24px] bg-white p-4 text-left shadow-sm dark:bg-stone-900">
                  <p className="text-sm font-semibold text-stone-900 dark:text-stone-50">{meta.label}</p>
                  <p className="mt-1 text-sm text-stone-500">
                    {formatCurrency(spent, user?.currency ?? 'INR')} / {formatCurrency(budget.amount, user?.currency ?? 'INR')}
                  </p>
                  <div className="mt-3 h-2 rounded-full" style={{ backgroundColor: meta.bgColor }}>
                    <div className="h-2 rounded-full" style={{ width: `${Math.min((spent / budget.amount) * 100, 100)}%`, backgroundColor: meta.color }} />
                  </div>
                </button>
              )
            })
          ) : (
            <button onClick={() => navigate('/budgets')} className="rounded-[24px] border border-dashed border-stone-300 px-4 py-5 text-left text-sm text-stone-600 dark:border-stone-700 dark:text-stone-300">
              Set your first category budget
            </button>
          )}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-stone-900 dark:text-stone-50">Recent transactions</h3>
          <Link to="/expenses" className="text-sm text-emerald-700">
            View all
          </Link>
        </div>
        {recentExpenses.length ? (
          <ExpenseList
            expenses={recentExpenses}
            user={user}
            onSelect={(expense) => {
              setSelectedExpense(expense)
              setSheetOpen(true)
            }}
            onDelete={async (id) => {
              if (!window.confirm('Delete this expense?')) return
              await deleteExpense(id)
              pushToast('Expense deleted')
            }}
          />
        ) : (
          <EmptyState emoji="💸" title="No expenses yet" description="Start with your first expense and FinTrack will build the month around it." actionLabel="Add your first expense" onAction={() => setSheetOpen(true)} />
        )}
      </section>

      <Button
        className="fixed bottom-24 right-4 z-20 rounded-full px-5 shadow-xl"
        onClick={() => {
          setSelectedExpense(null)
          setSheetOpen(true)
        }}
      >
        Add expense
      </Button>

      <AddExpenseSheet open={sheetOpen} expense={selectedExpense} onClose={() => setSheetOpen(false)} onSaved={() => pushToast(selectedExpense ? 'Expense updated' : 'Expense saved')} />
    </div>
  )
}
