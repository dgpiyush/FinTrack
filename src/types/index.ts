import type { LucideIcon } from 'lucide-react'
import {
  BedDouble,
  Car,
  Clapperboard,
  Heart,
  MoreHorizontal,
  Receipt,
  ShoppingBag,
  UtensilsCrossed,
} from 'lucide-react'

export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'shopping'
  | 'bills'
  | 'health'
  | 'entertainment'
  | 'accommodation'
  | 'other'

export interface User {
  id: string
  name: string
  email: string
  avatar: string
  currency: string
  monthlyBudget: number
  createdAt: string
}

export interface Expense {
  id: string
  amount: number
  currency: string
  note: string
  category: ExpenseCategory
  date: string
  tripId?: string
  receiptImageBase64?: string
  tags: string[]
  createdAt: string
  updatedAt: string
  isDeleted: boolean
}

export interface Trip {
  id: string
  name: string
  destination: string
  startDate: string
  endDate: string
  budget: number
  currency: string
  coverEmoji: string
  notes: string
  createdAt: string
  updatedAt: string
  isDeleted: boolean
}

export interface Budget {
  id: string
  category: ExpenseCategory | 'total'
  amount: number
  period: 'monthly'
  threshold: number
  createdAt: string
  updatedAt: string
}

export interface SyncMeta {
  lastSyncedAt: string | null
  driveFileId: string | null
  pendingChanges: boolean
}

export interface DriveBackup {
  version: 2
  exportedAt: string
  user: User | null
  expenses: Expense[]
  trips: Trip[]
  budgets: Budget[]
}

export interface SyncMetaRecord extends SyncMeta {
  key: 'meta'
}

export interface AuthProfile {
  sub: string
  name: string
  email: string
  picture: string
}

export interface CategoryMeta {
  label: string
  color: string
  bgColor: string
  icon: LucideIcon
}

export const CATEGORIES: Record<ExpenseCategory, CategoryMeta> = {
  food: { label: 'Food', color: '#EF9F27', bgColor: '#FAEEDA', icon: UtensilsCrossed },
  transport: { label: 'Transport', color: '#378ADD', bgColor: '#E6F1FB', icon: Car },
  shopping: { label: 'Shopping', color: '#D4537E', bgColor: '#FBEAF0', icon: ShoppingBag },
  bills: { label: 'Bills', color: '#888780', bgColor: '#F1EFE8', icon: Receipt },
  health: { label: 'Health', color: '#E24B4A', bgColor: '#FCEBEB', icon: Heart },
  entertainment: { label: 'Entertainment', color: '#7F77DD', bgColor: '#EEEDFE', icon: Clapperboard },
  accommodation: { label: 'Accommodation', color: '#1D9E75', bgColor: '#E1F5EE', icon: BedDouble },
  other: { label: 'Other', color: '#B4B2A9', bgColor: '#F1EFE8', icon: MoreHorizontal },
}

export const CATEGORY_ORDER = Object.keys(CATEGORIES) as ExpenseCategory[]

export const CURRENCY_OPTIONS = [
  ['INR', '₹', 'Indian Rupee'],
  ['USD', '$', 'US Dollar'],
  ['EUR', '€', 'Euro'],
  ['GBP', '£', 'British Pound'],
  ['JPY', '¥', 'Japanese Yen'],
  ['AED', 'د.إ', 'UAE Dirham'],
  ['SGD', '$', 'Singapore Dollar'],
  ['AUD', '$', 'Australian Dollar'],
  ['CAD', '$', 'Canadian Dollar'],
  ['CHF', 'CHF', 'Swiss Franc'],
  ['HKD', '$', 'Hong Kong Dollar'],
  ['THB', '฿', 'Thai Baht'],
  ['MYR', 'RM', 'Malaysian Ringgit'],
  ['IDR', 'Rp', 'Indonesian Rupiah'],
  ['PHP', '₱', 'Philippine Peso'],
  ['VND', '₫', 'Vietnamese Dong'],
  ['KRW', '₩', 'South Korean Won'],
  ['BDT', '৳', 'Bangladeshi Taka'],
  ['NPR', 'रू', 'Nepalese Rupee'],
  ['LKR', 'Rs', 'Sri Lankan Rupee'],
] as const

export const TRIP_EMOJIS = ['✈️', '🚂', '🚗', '🏖️', '🏔️', '🌏', '🏕️', '🚢']
