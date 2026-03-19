import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type {
  Budget,
  DriveBackup,
  Expense,
  SyncMetaRecord,
  Trip,
  User,
} from '../types'

interface FinTrackDB extends DBSchema {
  expenses: {
    key: string
    value: Expense
    indexes: { date: string; category: string; tripId: string }
  }
  trips: {
    key: string
    value: Trip
    indexes: { startDate: string }
  }
  budgets: {
    key: string
    value: Budget
  }
  user: {
    key: string
    value: User
  }
  syncMeta: {
    key: string
    value: SyncMetaRecord
  }
}

interface MemoryState {
  expenses: Map<string, Expense>
  trips: Map<string, Trip>
  budgets: Map<string, Budget>
  user: Map<string, User>
  syncMeta: SyncMetaRecord
}

const defaultSyncMeta: SyncMetaRecord = {
  key: 'meta',
  lastSyncedAt: null,
  driveFileId: null,
  pendingChanges: false,
}

let databasePromise: Promise<IDBPDatabase<FinTrackDB> | null> | null = null
let indexedDbAvailable = true

const memoryState: MemoryState = {
  expenses: new Map(),
  trips: new Map(),
  budgets: new Map(),
  user: new Map(),
  syncMeta: defaultSyncMeta,
}

async function getDatabase() {
  if (!databasePromise) {
    databasePromise = openDB<FinTrackDB>('fintrack-db', 2, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('expenses')) {
          const store = db.createObjectStore('expenses', { keyPath: 'id' })
          store.createIndex('date', 'date')
          store.createIndex('category', 'category')
          store.createIndex('tripId', 'tripId')
        }
        if (!db.objectStoreNames.contains('trips')) {
          const store = db.createObjectStore('trips', { keyPath: 'id' })
          store.createIndex('startDate', 'startDate')
        }
        if (!db.objectStoreNames.contains('budgets')) db.createObjectStore('budgets', { keyPath: 'id' })
        if (!db.objectStoreNames.contains('user')) db.createObjectStore('user', { keyPath: 'id' })
        if (!db.objectStoreNames.contains('syncMeta')) db.createObjectStore('syncMeta', { keyPath: 'key' })
      },
    }).catch(() => {
      indexedDbAvailable = false
      return null
    })
  }
  return databasePromise
}

type CollectionStoreName = 'expenses' | 'trips' | 'budgets' | 'user'

async function getAllFromStore<K extends CollectionStoreName>(storeName: K): Promise<FinTrackDB[K]['value'][]> {
  const db = await getDatabase()
  if (!db) {
    if (storeName === 'expenses') return Array.from(memoryState.expenses.values()) as FinTrackDB[K]['value'][]
    if (storeName === 'trips') return Array.from(memoryState.trips.values()) as FinTrackDB[K]['value'][]
    if (storeName === 'budgets') return Array.from(memoryState.budgets.values()) as FinTrackDB[K]['value'][]
    return Array.from(memoryState.user.values()) as FinTrackDB[K]['value'][]
  }
  return db.getAll(storeName)
}

export const db = {
  async isIndexedDbAvailable() {
    await getDatabase()
    return indexedDbAvailable
  },

  async getUser() {
    const users = await getAllFromStore('user')
    return users[0] ?? null
  },

  async putUser(user: User) {
    const database = await getDatabase()
    if (!database) {
      memoryState.user.set(user.id, user)
      return
    }
    await database.put('user', user)
  },

  async getExpenses() {
    const expenses = await getAllFromStore('expenses')
    return [...expenses].sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt.localeCompare(a.updatedAt))
  },

  async putExpense(expense: Expense) {
    const database = await getDatabase()
    if (!database) {
      memoryState.expenses.set(expense.id, expense)
      return
    }
    await database.put('expenses', expense)
  },

  async getTrips() {
    const trips = await getAllFromStore('trips')
    return [...trips].sort((a, b) => b.startDate.localeCompare(a.startDate))
  },

  async putTrip(trip: Trip) {
    const database = await getDatabase()
    if (!database) {
      memoryState.trips.set(trip.id, trip)
      return
    }
    await database.put('trips', trip)
  },

  async getBudgets() {
    return getAllFromStore('budgets')
  },

  async putBudget(budget: Budget) {
    const database = await getDatabase()
    if (!database) {
      memoryState.budgets.set(budget.id, budget)
      return
    }
    await database.put('budgets', budget)
  },

  async getSyncMeta() {
    const database = await getDatabase()
    if (!database) return memoryState.syncMeta
    return (await database.get('syncMeta', 'meta')) ?? defaultSyncMeta
  },

  async putSyncMeta(record: SyncMetaRecord) {
    const database = await getDatabase()
    if (!database) {
      memoryState.syncMeta = record
      return
    }
    await database.put('syncMeta', record)
  },

  async replaceAll(backup: DriveBackup) {
    const database = await getDatabase()
    if (!database) {
      memoryState.expenses = new Map(backup.expenses.map((item) => [item.id, item]))
      memoryState.trips = new Map(backup.trips.map((item) => [item.id, item]))
      memoryState.budgets = new Map(backup.budgets.map((item) => [item.id, item]))
      memoryState.user = new Map(backup.user ? [[backup.user.id, backup.user]] : [])
      return
    }

    const tx = database.transaction(['expenses', 'trips', 'budgets', 'user'], 'readwrite')
    await tx.objectStore('expenses').clear()
    await tx.objectStore('trips').clear()
    await tx.objectStore('budgets').clear()
    await tx.objectStore('user').clear()
    await Promise.all(backup.expenses.map((item) => tx.objectStore('expenses').put(item)))
    await Promise.all(backup.trips.map((item) => tx.objectStore('trips').put(item)))
    await Promise.all(backup.budgets.map((item) => tx.objectStore('budgets').put(item)))
    if (backup.user) await tx.objectStore('user').put(backup.user)
    await tx.done
  },

  async clearLocalData() {
    const database = await getDatabase()
    if (!database) {
      memoryState.expenses.clear()
      memoryState.trips.clear()
      memoryState.budgets.clear()
      memoryState.user.clear()
      memoryState.syncMeta = defaultSyncMeta
      return
    }
    const tx = database.transaction(['expenses', 'trips', 'budgets', 'user', 'syncMeta'], 'readwrite')
    await Promise.all([
      tx.objectStore('expenses').clear(),
      tx.objectStore('trips').clear(),
      tx.objectStore('budgets').clear(),
      tx.objectStore('user').clear(),
      tx.objectStore('syncMeta').clear(),
    ])
    await tx.done
  },
}
