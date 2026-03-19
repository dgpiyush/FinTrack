import { GoogleLogin } from '@react-oauth/google'
import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useFinTrack } from '../hooks/useFinTrack'
import { CURRENCY_OPTIONS } from '../types'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'

export function LoginPage() {
  const { profile, accessToken, handleGoogleLogin, error, status } = useAuth()
  const { needsOnboarding, completeOnboarding, user } = useFinTrack()
  const [step, setStep] = useState(1)
  const [currency, setCurrency] = useState('INR')
  const [budget, setBudget] = useState('')

  if (profile && accessToken && user) return <Navigate to="/" replace />

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(15,110,86,0.18),_transparent_35%),linear-gradient(180deg,#f8faf7_0%,#f2ece2_100%)] px-4 dark:bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.18),_transparent_30%),linear-gradient(180deg,#0b1220_0%,#111827_100%)]">
      <div className="w-full max-w-md rounded-[36px] border border-white/70 bg-white/85 p-8 shadow-2xl backdrop-blur dark:border-stone-800 dark:bg-stone-950/80">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-emerald-700 text-2xl font-bold text-white">₹</div>
        <h1 className="mt-6 text-center text-3xl font-semibold text-stone-900 dark:text-stone-50">FinTrack</h1>
        <p className="mt-3 text-center text-sm text-stone-600 dark:text-stone-300">Your finances. Your data. Your Drive.</p>
        <div className="mt-8 flex justify-center">
          <GoogleLogin onSuccess={handleGoogleLogin} onError={() => undefined} theme="outline" text="signin_with" shape="pill" useOneTap={false} />
        </div>
        <p className="mt-4 text-center text-xs text-stone-500 dark:text-stone-400">Your data is stored privately in your Google Drive. We have no servers.</p>
        {(status === 'authorizing' || status === 'refreshing') && <p className="mt-4 text-center text-sm text-amber-700">Authorizing Google Drive access...</p>}
        {error ? <p className="mt-4 text-center text-sm text-red-600">{error}</p> : null}
      </div>

      <Modal open={needsOnboarding} onClose={() => undefined} title="Welcome to FinTrack">
        {step === 1 ? (
          <div className="space-y-4">
            <p className="text-sm text-stone-600 dark:text-stone-300">What&apos;s your home currency?</p>
            <select value={currency} onChange={(event) => setCurrency(event.target.value)} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 dark:border-stone-700 dark:bg-stone-800">
              {CURRENCY_OPTIONS.map(([code, symbol, label]) => (
                <option key={code} value={code}>
                  {symbol} {code} — {label}
                </option>
              ))}
            </select>
            <Button fullWidth onClick={() => setStep(2)}>
              Continue
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-stone-600 dark:text-stone-300">Set a monthly budget?</p>
            <input inputMode="decimal" value={budget} onChange={(event) => setBudget(event.target.value)} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 dark:border-stone-700 dark:bg-stone-800" placeholder="Optional" />
            <div className="flex gap-3">
              <Button variant="secondary" fullWidth onClick={() => setStep(1)}>
                Back
              </Button>
              <Button fullWidth onClick={async () => { await completeOnboarding(currency, Number(budget || 0)) }}>
                Finish setup
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
