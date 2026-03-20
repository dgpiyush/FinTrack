import { getCategoryMeta, type Expense, type User } from '../../types'
import { formatCurrency } from '../../utils/currency'

export function ExpenseRow({
  expense,
  user,
  onClick,
  onDelete,
}: {
  expense: Expense
  user?: User | null
  onClick?: () => void
  onDelete?: () => void
}) {
  const category = getCategoryMeta(expense.category, user)
  const Icon = category.icon

  return (
    <div className="group flex items-center gap-3 rounded-[22px] bg-white px-3 py-3 shadow-sm dark:bg-stone-900">
      <button className="flex flex-1 items-center gap-3 text-left" onClick={onClick}>
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
          style={{ backgroundColor: category.bgColor, color: category.color }}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-stone-900 dark:text-stone-50">{expense.note || 'Untitled expense'}</p>
          <p className="truncate text-sm text-stone-500">{category.label}</p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-stone-900 dark:text-stone-50">
            {formatCurrency(expense.amount, expense.currency)}
          </p>
          <p className="text-xs text-stone-500">{expense.tags.join(', ')}</p>
        </div>
      </button>
      {onDelete && (
        <button onClick={onDelete} className="min-h-11 rounded-xl bg-red-50 px-3 text-sm font-medium text-red-600">
          Delete
        </button>
      )}
    </div>
  )
}
