import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../utils/cn'
import { vibrateTap } from '../../utils/haptics'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  fullWidth?: boolean
}

export function Button({
  children,
  className,
  variant = 'primary',
  fullWidth,
  onClick,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex min-h-11 items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition active:scale-[0.98] disabled:opacity-50',
        variant === 'primary' && 'bg-emerald-700 text-white shadow-lg shadow-emerald-900/20',
        variant === 'secondary' && 'bg-stone-100 text-stone-900 dark:bg-stone-800 dark:text-stone-100',
        variant === 'ghost' && 'bg-transparent text-stone-700 dark:text-stone-200',
        variant === 'danger' && 'bg-red-600 text-white',
        fullWidth && 'w-full',
        className,
      )}
      onClick={(event) => {
        vibrateTap()
        onClick?.(event)
      }}
      {...props}
    >
      {children}
    </button>
  )
}
