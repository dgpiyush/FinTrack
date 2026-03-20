import type { Budget, DriveBackup, Expense, Trip, User } from '../types'

function mergeUsers(local: User | null, remote: User | null): User | null {
  if (!local) return remote
  if (!remote) return local

  const customMap = new Map<string, User['customCategories'][number]>()
  ;[...(remote.customCategories ?? []), ...(local.customCategories ?? [])].forEach((category) => {
    customMap.set(category.id, category)
  })
  const customCategories = Array.from(customMap.values())

  const orderedIds = [...(remote.categoryOrder ?? []), ...(local.categoryOrder ?? []), ...customCategories.map((category) => category.id)]
  const seen = new Set<string>()
  const categoryOrder = orderedIds.filter((id) => {
    if (seen.has(id)) return false
    seen.add(id)
    return true
  })

  return {
    ...remote,
    currency: local.currency || remote.currency,
    monthlyBudget: local.monthlyBudget || remote.monthlyBudget,
    customCategories,
    categoryOrder,
  }
}

function mergeArray<T extends { id: string; updatedAt: string }>(local: T[], remote: T[]) {
  const map = new Map<string, T>()
  ;[...local, ...remote].forEach((item) => {
    const existing = map.get(item.id)
    if (!existing || item.updatedAt > existing.updatedAt) map.set(item.id, item)
  })
  return Array.from(map.values())
}

export function buildBackup({
  user,
  expenses,
  trips,
  budgets,
}: {
  user: User | null
  expenses: Expense[]
  trips: Trip[]
  budgets: Budget[]
}): DriveBackup {
  return { version: 2, exportedAt: new Date().toISOString(), user, expenses, trips, budgets }
}

export function mergeData(local: DriveBackup, remote: DriveBackup): DriveBackup {
  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    user: mergeUsers(local.user, remote.user),
    expenses: mergeArray(local.expenses, remote.expenses),
    trips: mergeArray(local.trips, remote.trips),
    budgets: mergeArray(local.budgets, remote.budgets),
  }
}
