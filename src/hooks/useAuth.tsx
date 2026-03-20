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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<AuthProfile | null>(() => {
    const stored = localStorage.getItem(AUTH_PROFILE_KEY)
    if (!stored) return null
    try {
      return JSON.parse(stored) as AuthProfile
    } catch {
      localStorage.removeItem(AUTH_PROFILE_KEY)
      return null
    }
  })
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [status, setStatus] = useState<AuthStatus>('signed_out')
  const [initializing, setInitializing] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const refreshTimeoutRef = useRef<number | null>(null)
  const authAttemptTimeoutRef = useRef<number | null>(null)
  const hasRestoredRef = useRef(false)

  const clearRefreshTimeout = () => {
    if (refreshTimeoutRef.current) {
      window.clearTimeout(refreshTimeoutRef.current)
      refreshTimeoutRef.current = null
    }
  }

  const clearAuthAttemptTimeout = () => {
    if (authAttemptTimeoutRef.current) {
      window.clearTimeout(authAttemptTimeoutRef.current)
      authAttemptTimeoutRef.current = null
    }
  }

  const requestTokenInternal = useCallback(
    (authProfile: AuthProfile, prompt: '' | 'select_account' = '', options?: { failSilently?: boolean }) => {
      if (!window.google?.accounts.oauth2 || !CLIENT_ID) {
        if (!CLIENT_ID) setError('Missing Google client ID.')
        setInitializing(false)
        return
      }

      setStatus(prompt ? 'authorizing' : 'refreshing')
      clearAuthAttemptTimeout()
      authAttemptTimeoutRef.current = window.setTimeout(() => {
        if (options?.failSilently) {
          setStatus('signed_out')
          setProfile(null)
          localStorage.removeItem(AUTH_PROFILE_KEY)
          setError(null)
        } else {
          setStatus('error')
          setError(
            'Google Drive authorization did not complete. This is usually caused by a blocked popup, a Cross-Origin-Opener-Policy header, or a missing authorized origin in Google Cloud.',
          )
        }
        setInitializing(false)
      }, 15000)
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: getDriveScope(),
        callback: (response) => {
          clearAuthAttemptTimeout()
          if (response.error || !response.access_token) {
            if (options?.failSilently) {
              setStatus('signed_out')
              setAccessToken(null)
              setProfile(null)
              localStorage.removeItem(AUTH_PROFILE_KEY)
              setError(null)
            } else {
              setError('Sign-in failed. Please try again.')
              setStatus('error')
            }
            setInitializing(false)
            return
          }
          setAccessToken(response.access_token)
          setStatus('ready')
          setError(null)
          setInitializing(false)
          clearRefreshTimeout()
          const expiresIn = response.expires_in ?? 3600
          refreshTimeoutRef.current = window.setTimeout(
            () => requestTokenInternal(authProfile, '', { failSilently: true }),
            Math.max((expiresIn - 300) * 1000, 60_000),
          )
        },
      })

      tokenClient.requestAccessToken({ prompt, hint: authProfile.email })
    },
    [],
  )

  const requestToken = useCallback(
    (prompt: '' | 'select_account' = '') => {
      if (!profile) return
      requestTokenInternal(profile, prompt)
    },
    [profile, requestTokenInternal],
  )

  const handleGoogleLogin = useCallback((response: CredentialResponse) => {
    if (!response.credential) {
      setError('Sign-in failed. Please try again.')
      setStatus('error')
      setInitializing(false)
      return
    }
    const parsedProfile = decodeCredential(response.credential)
    setProfile(parsedProfile)
    localStorage.setItem(AUTH_PROFILE_KEY, JSON.stringify(parsedProfile))
    setStatus('authorizing')
    setError(null)
    requestTokenInternal(parsedProfile, 'select_account')
  }, [requestTokenInternal])

  useEffect(() => {
    if (!profile) {
      setInitializing(false)
      return
    }
    if (hasRestoredRef.current) return
    hasRestoredRef.current = true
    requestTokenInternal(profile, '', { failSilently: true })
  }, [profile, requestTokenInternal])

  const signOut = useCallback(() => {
    clearRefreshTimeout()
    clearAuthAttemptTimeout()
    setProfile(null)
    setAccessToken(null)
    setStatus('signed_out')
    setError(null)
    setInitializing(false)
    localStorage.removeItem(AUTH_PROFILE_KEY)
  }, [])

  const cleanupTimeouts = useCallback(() => {
    clearRefreshTimeout()
    clearAuthAttemptTimeout()
  }, [])

  useEffect(() => () => cleanupTimeouts(), [cleanupTimeouts])

  const value = useMemo<AuthContextValue>(
    () => ({ profile, accessToken, status, initializing, error, handleGoogleLogin, refreshToken: requestToken, signOut }),
    [accessToken, error, handleGoogleLogin, initializing, profile, requestToken, signOut, status],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
