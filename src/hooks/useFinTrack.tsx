import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import { db } from '../services/db'
import { deleteDriveFile, downloadFromDrive, getOrCreateDriveFile, uploadToDrive } from '../services/drive'
import { buildBackup, mergeData } from '../services/sync'
import type { Budget, DriveBackup, Expense, SyncMeta, Trip, User } from '../types'
import { createId } from '../utils/uuid'
import { useAuth } from './useAuth'

type SyncState = 'synced' | 'syncing' | 'offline' | 'error'
type ThemeMode = 'system' | 'light' | 'dark'

interface ExpenseInput {
  amount: number
  currency: string
  note: string
  category: Expense['category']
  date: string
  tripId?: string
  receiptImageBase64?: string
  tags: string[]
}

interface TripInput {
  name: string
  destination: string
  startDate: string
  endDate: string
  budget: number
  currency: string
  coverEmoji: string
  notes: string
}

interface BudgetInput {
  category: Budget['category']
  amount: number
  threshold: number
}

interface FinTrackContextValue {
  loading: boolean
  indexedDbAvailable: boolean
  user: User | null
  expenses: Expense[]
  trips: Trip[]
  budgets: Budget[]
  syncMeta: SyncMeta
  syncState: SyncState
  needsOnboarding: boolean
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
  completeOnboarding: (currency: string, monthlyBudget: number) => Promise<void>
  saveExpense: (input: ExpenseInput, existingId?: string) => Promise<void>
  deleteExpense: (id: string) => Promise<void>
  saveTrip: (input: TripInput, existingId?: string) => Promise<void>
  deleteTrip: (id: string) => Promise<void>
  saveBudget: (input: BudgetInput, existingId?: string) => Promise<void>
  updateProfile: (payload: { currency: string; monthlyBudget: number }) => Promise<void>
  triggerSync: (manual?: boolean) => Promise<void>
  exportBackup: () => DriveBackup
  importBackup: (backup: DriveBackup) => Promise<void>
  clearLocalData: () => Promise<void>
  deleteDriveData: () => Promise<void>
}

const defaultSyncMeta: SyncMeta = { lastSyncedAt: null, driveFileId: null, pendingChanges: false }
const FinTrackContext = createContext<FinTrackContextValue | null>(null)
const THEME_KEY = 'fintrack-theme'

function getStoredTheme(): ThemeMode {
  const theme = localStorage.getItem(THEME_KEY)
  return theme === 'light' || theme === 'dark' || theme === 'system' ? theme : 'system'
}

function applyTheme(theme: ThemeMode) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const isDark = theme === 'dark' || (theme === 'system' && prefersDark)
  document.documentElement.classList.toggle('dark', isDark)
}

export function FinTrackProvider({ children }: { children: ReactNode }) {
  const { accessToken, profile, status: authStatus, signOut } = useAuth()
  const [loading, setLoading] = useState(true)
  const [indexedDbAvailable, setIndexedDbAvailable] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [trips, setTrips] = useState<Trip[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [syncMeta, setSyncMeta] = useState<SyncMeta>(defaultSyncMeta)
  const [syncState, setSyncState] = useState<SyncState>(navigator.onLine ? 'synced' : 'offline')
  const [theme, setThemeState] = useState<ThemeMode>(() => getStoredTheme())
  const syncingRef = useRef(false)

  const refreshLocalData = useCallback(async () => {
    const [storedUser, storedExpenses, storedTrips, storedBudgets, storedMeta, idbAvailable] = await Promise.all([
      db.getUser(),
      db.getExpenses(),
      db.getTrips(),
      db.getBudgets(),
      db.getSyncMeta(),
      db.isIndexedDbAvailable(),
    ])
    setUser(storedUser)
    setExpenses(storedExpenses)
    setTrips(storedTrips)
    setBudgets(storedBudgets)
    setSyncMeta(storedMeta)
    setIndexedDbAvailable(idbAvailable)
    return { user: storedUser, expenses: storedExpenses, trips: storedTrips, budgets: storedBudgets, syncMeta: storedMeta }
  }, [])

  const updateSyncMeta = useCallback(async (next: SyncMeta) => {
    setSyncMeta(next)
    await db.putSyncMeta({ key: 'meta', ...next })
  }, [])

  const exportBackup = useCallback(() => buildBackup({ user, expenses, trips, budgets }), [budgets, expenses, trips, user])

  const replaceBackup = useCallback(
    async (backup: DriveBackup, metaOverride?: Partial<SyncMeta>) => {
      await db.replaceAll(backup)
      const nextMeta = { ...syncMeta, ...metaOverride }
      await updateSyncMeta(nextMeta)
      setUser(backup.user)
      setExpenses(backup.expenses.sort((a, b) => b.date.localeCompare(a.date)))
      setTrips(backup.trips.sort((a, b) => b.startDate.localeCompare(a.startDate)))
      setBudgets(backup.budgets)
    },
    [syncMeta, updateSyncMeta],
  )

  const triggerSync = useCallback(
    async () => {
      if (!navigator.onLine) {
        setSyncState('offline')
        return
      }
      if (!accessToken || authStatus !== 'ready' || syncingRef.current) return

      syncingRef.current = true
      setSyncState('syncing')
      try {
        const current = await refreshLocalData()
        const localBackup = buildBackup(current)
        const fileId = current.syncMeta.driveFileId ?? (await getOrCreateDriveFile(accessToken))
        let merged = localBackup

        try {
          const remote = await downloadFromDrive(accessToken, fileId)
          merged = mergeData(localBackup, remote)
        } catch {
          merged = localBackup
        }

        await uploadToDrive(accessToken, fileId, merged)
        await replaceBackup(merged, {
          driveFileId: fileId,
          lastSyncedAt: new Date().toISOString(),
          pendingChanges: false,
        })
        setSyncState('synced')
      } catch {
        setSyncState(navigator.onLine ? 'error' : 'offline')
      } finally {
        syncingRef.current = false
      }
    },
    [accessToken, authStatus, refreshLocalData, replaceBackup],
  )

  useEffect(() => {
    applyTheme(theme)
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  useEffect(() => {
    refreshLocalData().finally(() => setLoading(false))
  }, [refreshLocalData])

  useEffect(() => {
    if (profile && accessToken && authStatus === 'ready') void triggerSync()
  }, [accessToken, authStatus, profile, triggerSync])

  useEffect(() => {
    const handleOnline = () => {
      setSyncState('syncing')
      void triggerSync()
    }
    const handleOffline = () => setSyncState('offline')
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [triggerSync])

  const queueSync = useCallback(async () => {
    const nextMeta = { ...syncMeta, pendingChanges: true }
    await updateSyncMeta(nextMeta)
    if (navigator.onLine && accessToken && authStatus === 'ready') {
      void triggerSync()
    } else {
      setSyncState('offline')
    }
  }, [accessToken, authStatus, syncMeta, triggerSync, updateSyncMeta])

  const completeOnboarding = useCallback(
    async (currency: string, monthlyBudget: number) => {
      if (!profile) return
      const newUser: User = {
        id: profile.sub,
        name: profile.name,
        email: profile.email,
        avatar: profile.picture,
        currency,
        monthlyBudget,
        createdAt: new Date().toISOString(),
      }
      await db.putUser(newUser)
      setUser(newUser)
      await queueSync()
    },
    [profile, queueSync],
  )

  const saveExpense = useCallback(
    async (input: ExpenseInput, existingId?: string) => {
      const existing = existingId ? expenses.find((item) => item.id === existingId) : undefined
      const now = new Date().toISOString()
      const expense: Expense = { id: existing?.id ?? createId(), createdAt: existing?.createdAt ?? now, updatedAt: now, isDeleted: false, ...input }
      await db.putExpense(expense)
      await refreshLocalData()
      await queueSync()
    },
    [expenses, queueSync, refreshLocalData],
  )

  const deleteExpense = useCallback(
    async (id: string) => {
      const existing = expenses.find((item) => item.id === id)
      if (!existing) return
      await db.putExpense({ ...existing, isDeleted: true, updatedAt: new Date().toISOString() })
      await refreshLocalData()
      await queueSync()
    },
    [expenses, queueSync, refreshLocalData],
  )

  const saveTrip = useCallback(
    async (input: TripInput, existingId?: string) => {
      const existing = existingId ? trips.find((item) => item.id === existingId) : undefined
      const now = new Date().toISOString()
      const trip: Trip = { id: existing?.id ?? createId(), createdAt: existing?.createdAt ?? now, updatedAt: now, isDeleted: false, ...input }
      await db.putTrip(trip)
      await refreshLocalData()
      await queueSync()
    },
    [queueSync, refreshLocalData, trips],
  )

  const deleteTrip = useCallback(
    async (id: string) => {
      const existing = trips.find((item) => item.id === id)
      if (!existing) return
      await db.putTrip({ ...existing, isDeleted: true, updatedAt: new Date().toISOString() })
      await refreshLocalData()
      await queueSync()
    },
    [queueSync, refreshLocalData, trips],
  )

  const saveBudget = useCallback(
    async (input: BudgetInput, existingId?: string) => {
      const existing = existingId ? budgets.find((item) => item.id === existingId) : undefined
      const now = new Date().toISOString()
      const budget: Budget = { id: existing?.id ?? createId(), createdAt: existing?.createdAt ?? now, updatedAt: now, period: 'monthly', ...input }
      await db.putBudget(budget)
      await refreshLocalData()
      await queueSync()
    },
    [budgets, queueSync, refreshLocalData],
  )

  const updateProfile = useCallback(
    async (payload: { currency: string; monthlyBudget: number }) => {
      if (!user) return
      const nextUser = { ...user, ...payload }
      await db.putUser(nextUser)
      setUser(nextUser)
      await queueSync()
    },
    [queueSync, user],
  )

  const importBackup = useCallback(
    async (backup: DriveBackup) => {
      await replaceBackup(backup, { pendingChanges: true })
      await queueSync()
    },
    [queueSync, replaceBackup],
  )

  const clearLocalData = useCallback(async () => {
    await db.clearLocalData()
    setUser(null)
    setExpenses([])
    setTrips([])
    setBudgets([])
    setSyncMeta(defaultSyncMeta)
    signOut()
  }, [signOut])

  const deleteDriveData = useCallback(async () => {
    if (!accessToken || !syncMeta.driveFileId) return
    await deleteDriveFile(accessToken, syncMeta.driveFileId)
    await updateSyncMeta({ lastSyncedAt: syncMeta.lastSyncedAt, driveFileId: null, pendingChanges: false })
  }, [accessToken, syncMeta.driveFileId, syncMeta.lastSyncedAt, updateSyncMeta])

  const value = useMemo<FinTrackContextValue>(
    () => ({
      loading,
      indexedDbAvailable,
      user,
      expenses: expenses.filter((item) => !item.isDeleted),
      trips: trips.filter((item) => !item.isDeleted),
      budgets,
      syncMeta,
      syncState,
      needsOnboarding: Boolean(profile && !user && !loading),
      theme,
      setTheme: setThemeState,
      completeOnboarding,
      saveExpense,
      deleteExpense,
      saveTrip,
      deleteTrip,
      saveBudget,
      updateProfile,
      triggerSync,
      exportBackup,
      importBackup,
      clearLocalData,
      deleteDriveData,
    }),
    [budgets, clearLocalData, completeOnboarding, deleteDriveData, deleteExpense, deleteTrip, expenses, exportBackup, importBackup, indexedDbAvailable, loading, profile, saveBudget, saveExpense, saveTrip, syncMeta, syncState, theme, triggerSync, trips, updateProfile, user],
  )

  return <FinTrackContext.Provider value={value}>{children}</FinTrackContext.Provider>
}

export function useFinTrack() {
  const context = useContext(FinTrackContext)
  if (!context) throw new Error('useFinTrack must be used within FinTrackProvider')
  return context
}
