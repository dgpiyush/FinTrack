import { useFinTrack } from './useFinTrack'

export function useExpenses() {
  const { expenses, saveExpense, deleteExpense } = useFinTrack()
  return { expenses, saveExpense, deleteExpense }
}
