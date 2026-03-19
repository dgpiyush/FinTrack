import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'

export function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean
  title: string
  children: ReactNode
  onClose: () => void
}) {
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-stone-950/45 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-[28px] bg-white p-5 shadow-2xl dark:bg-stone-900">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-50">{title}</h3>
          <button onClick={onClose} className="min-h-11 min-w-11 text-stone-500">
            Close
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}
