import {
  differenceInCalendarDays,
  endOfMonth,
  endOfYear,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isWithinInterval,
  parseISO,
  startOfMonth,
  startOfYear,
  subMonths,
} from 'date-fns'

export function todayIso() {
  return format(new Date(), 'yyyy-MM-dd')
}

export function formatDateLabel(value: string) {
  const date = parseISO(value)
  const now = new Date()
  if (isSameDay(date, now)) return 'Today'
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (isSameDay(date, yesterday)) return 'Yesterday'
  return format(date, 'EEE d MMM')
}

export function isTripActive(startDate: string, endDate: string, at = new Date()) {
  return isWithinInterval(at, { start: parseISO(startDate), end: parseISO(endDate) })
}

export function getTripStatus(startDate: string, endDate: string) {
  const now = new Date()
  const start = parseISO(startDate)
  const end = parseISO(endDate)
  if (isBefore(now, start)) return 'Upcoming'
  if (isAfter(now, end)) return 'Completed'
  return 'Active'
}

export function getDaysLeft(endDate: string) {
  return Math.max(differenceInCalendarDays(parseISO(endDate), new Date()), 0)
}

export type PresetRange = 'thisMonth' | 'lastMonth' | 'thisYear' | 'custom'

export function getRangeForPreset(preset: PresetRange) {
  const now = new Date()
  if (preset === 'lastMonth') {
    const month = subMonths(now, 1)
    return { start: startOfMonth(month), end: endOfMonth(month) }
  }
  if (preset === 'thisYear') {
    return { start: startOfYear(now), end: endOfYear(now) }
  }
  return { start: startOfMonth(now), end: endOfMonth(now) }
}
