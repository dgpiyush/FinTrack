import { useFinTrack } from './useFinTrack'

export function useBudgets() {
  const { budgets, saveBudget } = useFinTrack()
  return { budgets, saveBudget }
}
