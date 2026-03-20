import { formatDateLabel } from '../../utils/date'
import type { Expense, User } from '../../types'
import { formatCurrency } from '../../utils/currency'
import { ExpenseRow } from './ExpenseRow'

export function ExpenseList({
  expenses,
  user,
  onSelect,
  onDelete,
}: {
  expenses: Expense[]
  user?: User | null
  onSelect: (expense: Expense) => void
  onDelete: (id: string) => void
}) {
  const groups = expenses.reduce<Record<string, Expense[]>>((acc, expense) => {
    acc[expense.date] ??= []
    acc[expense.date].push(expense)
    return acc
  }, {})

  return (
    <div className="space-y-4">
      {Object.entries(groups).map(([date, items]) => (
        <section key={date}>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-stone-600 dark:text-stone-300">{formatDateLabel(date)}</h3>
            <p className="text-sm text-stone-500">
              {formatCurrency(items.reduce((sum, item) => sum + item.amount, 0), items[0]?.currency ?? 'INR')}
            </p>
          </div>
          <div className="space-y-2">
            {items.map((expense) => (
              <ExpenseRow
                key={expense.id}
                expense={expense}
                user={user}
                onClick={() => onSelect(expense)}
                onDelete={() => onDelete(expense.id)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
