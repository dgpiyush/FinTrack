import { useEffect, useState } from 'react'
import { getCategoryMeta, type Budget } from '../../types'
import { Button } from '../ui/Button'
import { Sheet } from '../ui/Sheet'
import { useFinTrack } from '../../hooks/useFinTrack'

export function BudgetSheet({
  open,
  budget,
  category,
  onClose,
  onSaved,
}: {
  open: boolean
  budget?: Budget | null
  category: Budget['category']
  onClose: () => void
  onSaved: () => void
}) {
  const { saveBudget, user } = useFinTrack()
  const [amount, setAmount] = useState('')
  const [threshold, setThreshold] = useState(80)

  useEffect(() => {
    if (!open) return
    setAmount(budget ? String(budget.amount) : '')
    setThreshold(budget?.threshold ?? 80)
  }, [budget, open])

  return (
    <Sheet open={open} onClose={onClose} title="Edit budget">
      <div className="space-y-5">
        <div className="rounded-2xl bg-stone-100 px-4 py-3 text-sm text-stone-700 dark:bg-stone-800 dark:text-stone-100">
          {category === 'total' ? 'Total monthly' : getCategoryMeta(category, user).label}
        </div>
        <input inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 dark:border-stone-700 dark:bg-stone-800" placeholder="Monthly amount" />
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-stone-700 dark:text-stone-200">Alert me when I reach {threshold}%</span>
          <input type="range" min="50" max="100" step="5" value={threshold} onChange={(event) => setThreshold(Number(event.target.value))} className="w-full" />
        </label>
        <Button
          fullWidth
          onClick={async () => {
            await saveBudget({ category, amount: Number(amount || 0), threshold }, budget?.id)
            onSaved()
            onClose()
          }}
        >
          Save budget
        </Button>
      </div>
    </Sheet>
  )
}
