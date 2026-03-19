import { eachMonthOfInterval, endOfMonth, format, startOfMonth, subMonths } from 'date-fns'
import { useMemo, useState } from 'react'
import { MonthlyBarChart } from '../components/charts/MonthlyBarChart'
import { CategoryDonut } from '../components/charts/CategoryDonut'
import { DailyLineChart } from '../components/charts/DailyLineChart'
import { useFinTrack } from '../hooks/useFinTrack'
import { CATEGORY_ORDER, CATEGORIES } from '../types'
import { formatCurrency } from '../utils/currency'
import { Button } from '../components/ui/Button'

type Period = '1m' | '3m' | '6m' | '12m'

export function AnalyticsPage() {
  const { expenses, user, budgets } = useFinTrack()
  const [period, setPeriod] = useState<Period>('1m')
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)

  const months = useMemo(() => {
    const now = new Date()
    const count = period === '1m' ? 1 : period === '3m' ? 3 : period === '6m' ? 6 : 12
    return eachMonthOfInterval({ start: startOfMonth(subMonths(now, count - 1)), end: endOfMonth(now) })
  }, [period])

  const filteredExpenses = useMemo(() => {
    const start = months[0]
    const end = endOfMonth(months[months.length - 1])
    return expenses.filter((expense) => {
      const date = new Date(expense.date)
      return date >= start && date <= end && (!categoryFilter || expense.category === categoryFilter)
    })
  }, [categoryFilter, expenses, months])

  const monthlyData = months.map((month) => {
    const label = format(month, 'MMM')
    const monthExpenses = filteredExpenses.filter((expense) => format(new Date(expense.date), 'yyyy-MM') === format(month, 'yyyy-MM'))
    const amount = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0)
    const budget = user?.monthlyBudget ?? 0
    const color = budget && amount > budget ? '#ef4444' : budget && amount >= budget * 0.8 ? '#f59e0b' : '#0f6e56'
    return { label, amount, color }
  })

  const categoryData = CATEGORY_ORDER.map((category) => ({
    name: category,
    value: filteredExpenses.filter((expense) => expense.category === category).reduce((sum, expense) => sum + expense.amount, 0),
    color: CATEGORIES[category].color,
  })).filter((item) => item.value > 0)

  const currentMonthExpenses = filteredExpenses.filter((expense) => format(new Date(expense.date), 'yyyy-MM') === format(new Date(), 'yyyy-MM'))
  const dailyMap = new Map<string, number>()
  currentMonthExpenses.forEach((expense) => dailyMap.set(expense.date, (dailyMap.get(expense.date) ?? 0) + expense.amount))
  const dailyData = Array.from(dailyMap.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([day, amount]) => ({ day: day.slice(-2), amount }))

  const topCategory = [...categoryData].sort((a, b) => b.value - a.value)[0]
  const biggestExpense = [...filteredExpenses].sort((a, b) => b.amount - a.amount)[0]
  const projectedSpend = currentMonthExpenses.length ? (currentMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0) / new Set(currentMonthExpenses.map((item) => item.date)).size) * 30 : 0
  const lastMonthTotal = expenses.filter((expense) => format(new Date(expense.date), 'yyyy-MM') === format(subMonths(new Date(), 1), 'yyyy-MM')).reduce((sum, expense) => sum + expense.amount, 0)
  const currentMonthTotal = currentMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  const change = lastMonthTotal ? ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0
  const totalBudget = budgets.find((budget) => budget.category === 'total')?.amount ?? user?.monthlyBudget ?? 0
  const budgetPerDay = totalBudget ? totalBudget / 30 : 0

  return (
    <div className="space-y-5">
      <div className="flex gap-2 overflow-x-auto">
        {[
          ['1m', 'This month'],
          ['3m', 'Last 3 months'],
          ['6m', 'Last 6 months'],
          ['12m', 'This year'],
        ].map(([value, label]) => (
          <button key={value} onClick={() => setPeriod(value as Period)} className={`rounded-full px-4 py-2 text-sm ${period === value ? 'bg-emerald-700 text-white' : 'bg-white text-stone-700 dark:bg-stone-900 dark:text-stone-200'}`}>
            {label}
          </button>
        ))}
      </div>

      <MonthlyBarChart data={monthlyData} />
      <CategoryDonut data={categoryData} onSelect={setCategoryFilter} />
      <DailyLineChart data={dailyData} budgetPerDay={budgetPerDay} />

      <section className="grid gap-3">
        <div className="rounded-[26px] bg-white p-4 shadow-sm dark:bg-stone-900">
          <p className="text-sm text-stone-500">Top category this month</p>
          <p className="mt-1 font-semibold text-stone-900 dark:text-stone-50">{topCategory ? `${CATEGORIES[topCategory.name as keyof typeof CATEGORIES].label} (${formatCurrency(topCategory.value, user?.currency ?? 'INR')})` : 'No spending yet'}</p>
        </div>
        <div className="rounded-[26px] bg-white p-4 shadow-sm dark:bg-stone-900">
          <p className="text-sm text-stone-500">Biggest single expense</p>
          <p className="mt-1 font-semibold text-stone-900 dark:text-stone-50">{biggestExpense ? `${biggestExpense.note || 'Untitled'} on ${biggestExpense.date} — ${formatCurrency(biggestExpense.amount, biggestExpense.currency)}` : 'No data yet'}</p>
        </div>
        <div className="rounded-[26px] bg-white p-4 shadow-sm dark:bg-stone-900">
          <p className="text-sm text-stone-500">Projected monthly spend</p>
          <p className="mt-1 font-semibold text-stone-900 dark:text-stone-50">{formatCurrency(projectedSpend, user?.currency ?? 'INR')}</p>
        </div>
        <div className="rounded-[26px] bg-white p-4 shadow-sm dark:bg-stone-900">
          <p className="text-sm text-stone-500">Compared to last month</p>
          <p className="mt-1 font-semibold text-stone-900 dark:text-stone-50">
            {change >= 0 ? '+' : ''}
            {change.toFixed(0)}%
          </p>
        </div>
      </section>

      <Button
        fullWidth
        onClick={() => {
          const headers = ['date', 'note', 'category', 'amount', 'currency', 'tags']
          const rows = filteredExpenses.map((expense) => [
            expense.date,
            `"${expense.note.replaceAll('"', '""')}"`,
            expense.category,
            String(expense.amount),
            expense.currency,
            `"${expense.tags.join('|')}"`,
          ])
          const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')
          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `fintrack-${period}.csv`
          link.click()
          URL.revokeObjectURL(url)
        }}
      >
        Export to CSV
      </Button>
    </div>
  )
}
