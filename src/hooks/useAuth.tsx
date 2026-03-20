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
import type { CredentialResponse } from '@react-oauth/google'
import { decodeCredential } from '../services/auth'
import { getDriveScope } from '../services/drive'
import type { AuthProfile } from '../types'

type AuthStatus = 'signed_out' | 'authorizing' | 'ready' | 'refreshing' | 'error'

interface AuthContextValue {
  profile: AuthProfile | null
  accessToken: string | null
  status: AuthStatus
  initializing: boolean
  error: string | null
  handleGoogleLogin: (response: CredentialResponse) => void
  refreshToken: (prompt?: '' | 'select_account') => void
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)
const CLIENT_ID = '962828595661-k25p2sr2i3tfu5adgfe2cvihqasvl6i7.apps.googleusercontent.com'
const AUTH_PROFILE_KEY = 'fintrack-auth-profile'
const PENDING_DRIVE_AUTH_KEY = 'fintrack-pending-drive-auth'
const REDIRECT_PATH = '/login'

function createState() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `state-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function getRedirectUri() {
  return `${window.location.origin}${REDIRECT_PATH}`
}

function storeProfile(profile: AuthProfile | null) {
  if (!profile) {
    localStorage.removeItem(AUTH_PROFILE_KEY)
    return
  }
  localStorage.setItem(AUTH_PROFILE_KEY, JSON.stringify(profile))
}

function readStoredProfile() {
  const stored = localStorage.getItem(AUTH_PROFILE_KEY)
  if (!stored) return null
  try {
    return JSON.parse(stored) as AuthProfile
  } catch {
    localStorage.removeItem(AUTH_PROFILE_KEY)
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<AuthProfile | null>(() => readStoredProfile())
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [status, setStatus] = useState<AuthStatus>('signed_out')
  const [initializing, setInitializing] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const expiryTimeoutRef = useRef<number | null>(null)

  const clearExpiryTimeout = () => {
    if (expiryTimeoutRef.current) {
      window.clearTimeout(expiryTimeoutRef.current)
      expiryTimeoutRef.current = null
    }
  }

  const startDriveRedirect = useCallback(
    (authProfile: AuthProfile, prompt: '' | 'select_account' = 'select_account') => {
      if (!CLIENT_ID) {
        setError('Missing Google client ID.')
        setStatus('error')
        setInitializing(false)
        return
      }

      const state = createState()
      sessionStorage.setItem(
        PENDING_DRIVE_AUTH_KEY,
        JSON.stringify({
          state,
          profile: authProfile,
          requestedAt: Date.now(),
        }),
      )

      setProfile(authProfile)
      storeProfile(authProfile)
      setStatus('authorizing')
      setError(null)
      setInitializing(false)

      const params = new URLSearchParams({
        client_id: CLIENT_ID,
        redirect_uri: getRedirectUri(),
        response_type: 'token',
        scope: getDriveScope(),
        include_granted_scopes: 'true',
        state,
        login_hint: authProfile.email,
      })

      if (prompt) params.set('prompt', prompt)
      window.location.assign(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`)
    },
    [],
  )

  const refreshToken = useCallback(
    (prompt: '' | 'select_account' = 'select_account') => {
      if (!profile) return
      startDriveRedirect(profile, prompt)
    },
    [profile, startDriveRedirect],
  )

  const handleGoogleLogin = useCallback(
    (response: CredentialResponse) => {
      if (!response.credential) {
        setError('Sign-in failed. Please try again.')
        setStatus('error')
        setInitializing(false)
        return
      }

      const parsedProfile = decodeCredential(response.credential)
      startDriveRedirect(parsedProfile, 'select_account')
    },
    [startDriveRedirect],
  )

  useEffect(() => {
    const pendingRaw = sessionStorage.getItem(PENDING_DRIVE_AUTH_KEY)
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const returnedToken = params.get('access_token')
    const returnedError = params.get('error')
    const returnedState = params.get('state')

    if (!pendingRaw && !returnedToken && !returnedError) {
      setStatus((current) => (profile ? current : 'signed_out'))
      setInitializing(false)
      return
    }

    let pending: { state: string; profile: AuthProfile } | null = null
    if (pendingRaw) {
      try {
        pending = JSON.parse(pendingRaw) as { state: string; profile: AuthProfile }
      } catch {
        sessionStorage.removeItem(PENDING_DRIVE_AUTH_KEY)
      }
    }

    if (returnedToken && pending && returnedState === pending.state) {
      const expiresIn = Number(params.get('expires_in') ?? '3600')
      setProfile(pending.profile)
      storeProfile(pending.profile)
      setAccessToken(returnedToken)
      setStatus('ready')
      setError(null)
      sessionStorage.removeItem(PENDING_DRIVE_AUTH_KEY)
      window.history.replaceState({}, document.title, window.location.pathname + window.location.search)
      clearExpiryTimeout()
      expiryTimeoutRef.current = window.setTimeout(() => {
        setAccessToken(null)
        setStatus('signed_out')
      }, Math.max(expiresIn * 1000, 60_000))
      setInitializing(false)
      return
    }

    if (returnedError) {
      sessionStorage.removeItem(PENDING_DRIVE_AUTH_KEY)
      window.history.replaceState({}, document.title, window.location.pathname + window.location.search)
      setAccessToken(null)
      setStatus('error')
      setError(returnedError === 'access_denied' ? 'Google Drive access was not granted.' : 'Google Drive authorization failed.')
      setInitializing(false)
      return
    }

    if (pending && returnedState && pending.state !== returnedState) {
      sessionStorage.removeItem(PENDING_DRIVE_AUTH_KEY)
      window.history.replaceState({}, document.title, window.location.pathname + window.location.search)
      setAccessToken(null)
      setStatus('error')
      setError('Google Drive authorization state did not match. Please try again.')
      setInitializing(false)
      return
    }

    setInitializing(false)
  }, [profile])

  const signOut = useCallback(() => {
    clearExpiryTimeout()
    setProfile(null)
    setAccessToken(null)
    setStatus('signed_out')
    setError(null)
    setInitializing(false)
    localStorage.removeItem(AUTH_PROFILE_KEY)
    sessionStorage.removeItem(PENDING_DRIVE_AUTH_KEY)
  }, [])

  useEffect(() => () => clearExpiryTimeout(), [])

  const value = useMemo<AuthContextValue>(
    () => ({
      profile,
      accessToken,
      status,
      initializing,
      error,
      handleGoogleLogin,
      refreshToken,
      signOut,
    }),
    [accessToken, error, handleGoogleLogin, initializing, profile, refreshToken, signOut, status],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
