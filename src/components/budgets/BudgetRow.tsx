import { CATEGORIES, type Budget, type Expense } from '../../types'
import { formatCurrency } from '../../utils/currency'

export function BudgetRow({
  budget,
  expenses,
  currency,
  onEdit,
}: {
  budget: Budget
  expenses: Expense[]
  currency: string
  onEdit: () => void
}) {
  const spent =
    budget.category === 'total'
      ? expenses.reduce((sum, expense) => sum + expense.amount, 0)
      : expenses.filter((expense) => expense.category === budget.category).reduce((sum, expense) => sum + expense.amount, 0)
  const progress = budget.amount ? Math.min((spent / budget.amount) * 100, 100) : 0

  return (
    <button onClick={onEdit} className="w-full rounded-[24px] bg-white p-4 text-left shadow-sm dark:bg-stone-900">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-stone-900 dark:text-stone-50">
            {budget.category === 'total' ? 'Total monthly' : CATEGORIES[budget.category].label}
          </p>
          <p className="mt-1 text-sm text-stone-500">
            {formatCurrency(spent, currency)} spent of {formatCurrency(budget.amount, currency)}
          </p>
        </div>
        <div className="text-right text-xs text-stone-500">{budget.threshold}% alert</div>
      </div>
      <div className="mt-3 h-2 rounded-full bg-stone-200 dark:bg-stone-800">
        <div className="h-2 rounded-full bg-emerald-600" style={{ width: `${progress}%` }} />
      </div>
    </button>
  )
}
