import { useMemo, useState } from 'react'
import { endOfMonth, isWithinInterval, parseISO, startOfMonth } from 'date-fns'
import { BudgetRow } from '../components/budgets/BudgetRow'
import { BudgetSheet } from '../components/budgets/BudgetSheet'
import { EmptyState } from '../components/ui/EmptyState'
import { useFinTrack } from '../hooks/useFinTrack'
import { getCategoryOptions, type Budget } from '../types'
import { useToast } from '../components/ui/Toast'

export function BudgetsPage() {
  const { budgets, expenses, user } = useFinTrack()
  const { pushToast } = useToast()
  const [selectedCategory, setSelectedCategory] = useState<Budget['category'] | null>(null)
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null)
  const monthExpenses = useMemo(() => {
    const range = { start: startOfMonth(new Date()), end: endOfMonth(new Date()) }
    return expenses.filter((expense) => isWithinInterval(parseISO(expense.date), range))
  }, [expenses])

  const rows: Budget['category'][] = ['total', ...getCategoryOptions(user).map((category) => category.id)]

  return (
    <div className="space-y-4">
      {rows.length ? (
        rows.map((category) => {
          const budget = budgets.find((item) => item.category === category) ?? null
          return (
            <div key={category}>
              {budget ? (
                <BudgetRow
                  budget={budget}
                  expenses={monthExpenses}
                  currency={user?.currency ?? 'INR'}
                  user={user}
                  onEdit={() => {
                    setSelectedCategory(category)
                    setSelectedBudget(budget)
                  }}
                />
              ) : (
                <button
                  onClick={() => {
                    setSelectedCategory(category)
                    setSelectedBudget(null)
                  }}
                  className="flex w-full items-center justify-between rounded-[24px] border border-dashed border-stone-300 px-4 py-4 text-left dark:border-stone-700"
                >
                  <span className="font-medium text-stone-900 dark:text-stone-50">{category === 'total' ? 'Total monthly' : category}</span>
                  <span className="text-sm text-emerald-700">Set budget</span>
                </button>
              )}
            </div>
          )
        })
      ) : (
        <EmptyState emoji="🎯" title="No budgets yet" description="Set monthly caps for your total spend or categories you care about." actionLabel="Create budget" onAction={() => setSelectedCategory('total')} />
      )}

      <BudgetSheet
        open={selectedCategory !== null}
        budget={selectedBudget}
        category={selectedCategory ?? 'total'}
        onClose={() => {
          setSelectedBudget(null)
          setSelectedCategory(null)
        }}
        onSaved={() => pushToast('Budget saved')}
      />
    </div>
  )
}
