import { useEffect, useState } from 'react'
import { Button } from './Button'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const VISITS_KEY = 'fintrack-visits'
const DISMISSED_KEY = 'fintrack-install-dismissed'

export function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    const visits = Number(localStorage.getItem(VISITS_KEY) ?? 0) + 1
    localStorage.setItem(VISITS_KEY, String(visits))

    const handler = (event: Event) => {
      event.preventDefault()
      const dismissed = localStorage.getItem(DISMISSED_KEY) === 'true'
      if (!dismissed && visits >= 2) {
        setDeferredPrompt(event as BeforeInstallPromptEvent)
        setShow(true)
      }
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!show || !deferredPrompt) return null

  return (
    <div className="fixed inset-x-4 bottom-24 z-50 rounded-[24px] bg-stone-900 px-4 py-4 text-white shadow-xl dark:bg-stone-100 dark:text-stone-900">
      <p className="text-sm font-medium">Install FinTrack for faster offline access.</p>
      <div className="mt-3 flex gap-3">
        <Button
          variant="secondary"
          onClick={async () => {
            await deferredPrompt.prompt()
            const choice = await deferredPrompt.userChoice
            if (choice.outcome === 'dismissed') localStorage.setItem(DISMISSED_KEY, 'true')
            setShow(false)
          }}
        >
          Install app
        </Button>
        <Button
          variant="ghost"
          className="text-white dark:text-stone-900"
          onClick={() => {
            localStorage.setItem(DISMISSED_KEY, 'true')
            setShow(false)
          }}
        >
          Not now
        </Button>
      </div>
    </div>
  )
}
