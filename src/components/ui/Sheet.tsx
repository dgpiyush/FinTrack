import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'

export function Sheet({
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
  const pushedStateRef = useRef(false)

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    if (!pushedStateRef.current) {
      window.history.pushState({ fintrackSheet: title }, '')
      pushedStateRef.current = true
    }
    const handlePopState = () => {
      if (pushedStateRef.current) {
        pushedStateRef.current = false
        onClose()
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('popstate', handlePopState)
    }
  }, [onClose, open, title])

  useEffect(() => {
    if (!open && pushedStateRef.current) pushedStateRef.current = false
  }, [open])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[75] bg-stone-950/45" onClick={onClose}>
      <div
        className="absolute inset-x-0 bottom-0 max-h-[90vh] overflow-y-auto rounded-t-[32px] bg-white px-5 pb-8 pt-3 shadow-2xl dark:bg-stone-900"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-stone-300 dark:bg-stone-700" />
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-50">{title}</h3>
          <button onClick={onClose} className="min-h-11 min-w-11 text-sm text-stone-500">
            Close
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}
