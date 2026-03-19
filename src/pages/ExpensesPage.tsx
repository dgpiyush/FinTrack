import { useMemo, useState } from 'react'
import { endOfMonth, endOfYear, isWithinInterval, parseISO, startOfMonth, startOfYear, subMonths } from 'date-fns'
import { ExpenseList } from '../components/expenses/ExpenseList'
import { AddExpenseSheet } from '../components/expenses/AddExpenseSheet'
import { EmptyState } from '../components/ui/EmptyState'
import { useFinTrack } from '../hooks/useFinTrack'
import { CATEGORY_ORDER, CATEGORIES, type Expense } from '../types'
import { formatCurrency } from '../utils/currency'
import { useToast } from '../components/ui/Toast'
import { Button } from '../components/ui/Button'

type FilterPreset = 'thisMonth' | 'lastMonth' | 'thisYear' | 'custom'

export function ExpensesPage() {
  const { expenses, trips, user, deleteExpense } = useFinTrack()
  const { pushToast } = useToast()
  const [preset, setPreset] = useState<FilterPreset>('thisMonth')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [tripId, setTripId] = useState('')
  const [search, setSearch] = useState('')
  const [customStart, setCustomStart] = useState(startOfMonth(new Date()).toISOString().slice(0, 10))
  const [customEnd, setCustomEnd] = useState(endOfMonth(new Date()).toISOString().slice(0, 10))
  const [page, setPage] = useState(1)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)

  const range = useMemo(() => {
    const now = new Date()
    if (preset === 'lastMonth') {
      const month = subMonths(now, 1)
      return { start: startOfMonth(month), end: endOfMonth(month) }
    }
    if (preset === 'thisYear') return { start: startOfYear(now), end: endOfYear(now) }
    if (preset === 'custom') return { start: parseISO(customStart), end: parseISO(customEnd) }
    return { start: startOfMonth(now), end: endOfMonth(now) }
  }, [customEnd, customStart, preset])

  const filtered = useMemo(
    () =>
      expenses.filter((expense) => {
        const matchesRange = isWithinInterval(parseISO(expense.date), range)
        const matchesCategory = !selectedCategories.length || selectedCategories.includes(expense.category)
        const matchesTrip = !tripId || expense.tripId === tripId
        const query = search.trim().toLowerCase()
        const matchesSearch = !query || expense.note.toLowerCase().includes(query) || expense.tags.some((tag) => tag.toLowerCase().includes(query))
        return matchesRange && matchesCategory && matchesTrip && matchesSearch
      }),
    [expenses, range, search, selectedCategories, tripId],
  )

  const pagedExpenses = filtered.slice(0, page * 50)
  const total = filtered.reduce((sum, expense) => sum + expense.amount, 0)
  const averagePerDay = filtered.length ? total / new Set(filtered.map((item) => item.date)).size : 0

  return (
    <div className="space-y-4">
      <section className="sticky top-[88px] z-20 space-y-3 rounded-[28px] bg-white/95 p-4 shadow-sm backdrop-blur dark:bg-stone-900/95">
        <div className="flex gap-2 overflow-x-auto">
          {(['thisMonth', 'lastMonth', 'thisYear', 'custom'] as FilterPreset[]).map((option) => (
            <button key={option} onClick={() => setPreset(option)} className={`rounded-full px-4 py-2 text-sm ${preset === option ? 'bg-emerald-700 text-white' : 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-200'}`}>
              {option === 'thisMonth' ? 'This month' : option === 'lastMonth' ? 'Last month' : option === 'thisYear' ? 'This year' : 'Custom range'}
            </button>
          ))}
        </div>
        {preset === 'custom' ? (
          <div className="grid grid-cols-2 gap-2">
            <input type="date" value={customStart} onChange={(event) => setCustomStart(event.target.value)} className="rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 dark:border-stone-700 dark:bg-stone-800" />
            <input type="date" value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} className="rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 dark:border-stone-700 dark:bg-stone-800" />
          </div>
        ) : null}
        <div className="flex gap-2 overflow-x-auto">
          {CATEGORY_ORDER.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategories((current) => (current.includes(category) ? current.filter((item) => item !== category) : [...current, category]))}
              className={`rounded-full px-4 py-2 text-sm ${selectedCategories.includes(category) ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900' : 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-200'}`}
            >
              {CATEGORIES[category].label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-[1fr,auto] gap-2">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search note or tag" className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 dark:border-stone-700 dark:bg-stone-800" />
          <select value={tripId} onChange={(event) => setTripId(event.target.value)} className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 dark:border-stone-700 dark:bg-stone-800">
            <option value="">All trips</option>
            {trips.map((trip) => (
              <option key={trip.id} value={trip.id}>
                {trip.name}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-3 rounded-[28px] bg-white p-4 shadow-sm dark:bg-stone-900">
        <div>
          <p className="text-xs text-stone-500">Total</p>
          <p className="mt-1 text-sm font-semibold text-stone-900 dark:text-stone-50">{formatCurrency(total, user?.currency ?? 'INR')}</p>
        </div>
        <div>
          <p className="text-xs text-stone-500">Transactions</p>
          <p className="mt-1 text-sm font-semibold text-stone-900 dark:text-stone-50">{filtered.length}</p>
        </div>
        <div>
          <p className="text-xs text-stone-500">Avg/day</p>
          <p className="mt-1 text-sm font-semibold text-stone-900 dark:text-stone-50">{formatCurrency(averagePerDay, user?.currency ?? 'INR')}</p>
        </div>
      </section>

      {pagedExpenses.length ? (
        <>
          <ExpenseList
            expenses={pagedExpenses}
            onSelect={(expense) => setSelectedExpense(expense)}
            onDelete={async (id) => {
              if (!window.confirm('Delete this expense?')) return
              await deleteExpense(id)
              pushToast('Expense deleted')
            }}
          />
          {pagedExpenses.length < filtered.length ? (
            <Button variant="secondary" fullWidth onClick={() => setPage((current) => current + 1)}>
              Load more
            </Button>
          ) : null}
        </>
      ) : (
        <EmptyState emoji="🧾" title="No expenses found" description="Adjust your filters or add a new expense to start building your history." actionLabel="Add expense" onAction={() => setSelectedExpense({} as Expense)} />
      )}

      <AddExpenseSheet open={selectedExpense !== null} expense={selectedExpense && selectedExpense.id ? selectedExpense : null} onClose={() => setSelectedExpense(null)} onSaved={() => pushToast(selectedExpense?.id ? 'Expense updated' : 'Expense saved')} />
    </div>
  )
}
