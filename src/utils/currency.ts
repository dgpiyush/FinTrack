import { CURRENCY_OPTIONS } from '../types'

export function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0)
}

export function getCurrencyLabel(currency: string) {
  const match = CURRENCY_OPTIONS.find(([code]) => code === currency)
  return match ? `${match[1]} ${match[0]} — ${match[2]}` : currency
}
