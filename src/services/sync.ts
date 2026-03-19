import type { Budget, DriveBackup, Expense, Trip, User } from '../types'

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
    user: remote.user ?? local.user,
    expenses: mergeArray(local.expenses, remote.expenses),
    trips: mergeArray(local.trips, remote.trips),
    budgets: mergeArray(local.budgets, remote.budgets),
  }
}
