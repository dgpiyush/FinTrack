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
  error: string | null
  handleGoogleLogin: (response: CredentialResponse) => void
  refreshToken: (prompt?: '' | 'select_account') => void
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)
const CLIENT_ID = '962828595661-k25p2sr2i3tfu5adgfe2cvihqasvl6i7.apps.googleusercontent.com'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<AuthProfile | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [status, setStatus] = useState<AuthStatus>('signed_out')
  const [error, setError] = useState<string | null>(null)
  const refreshTimeoutRef = useRef<number | null>(null)

  const clearRefreshTimeout = () => {
    if (refreshTimeoutRef.current) {
      window.clearTimeout(refreshTimeoutRef.current)
      refreshTimeoutRef.current = null
    }
  }

  const requestToken = useCallback(
    (prompt: '' | 'select_account' = '') => {
      if (!window.google?.accounts.oauth2 || !CLIENT_ID || !profile) {
        if (!CLIENT_ID) setError('Missing Google client ID.')
        return
      }

      setStatus(prompt ? 'authorizing' : 'refreshing')
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: getDriveScope(),
        callback: (response) => {
          if (response.error || !response.access_token) {
            setError('Sign-in failed. Please try again.')
            setStatus('error')
            return
          }
          setAccessToken(response.access_token)
          setStatus('ready')
          setError(null)
          clearRefreshTimeout()
          const expiresIn = response.expires_in ?? 3600
          refreshTimeoutRef.current = window.setTimeout(() => requestToken(''), Math.max((expiresIn - 300) * 1000, 60_000))
        },
      })

      tokenClient.requestAccessToken({ prompt, hint: profile.email })
    },
    [profile],
  )

  const handleGoogleLogin = useCallback((response: CredentialResponse) => {
    if (!response.credential) {
      setError('Sign-in failed. Please try again.')
      setStatus('error')
      return
    }
    setProfile(decodeCredential(response.credential))
    setStatus('authorizing')
    setError(null)
  }, [])

  useEffect(() => {
    if (profile) requestToken('select_account')
  }, [profile, requestToken])

  useEffect(() => () => clearRefreshTimeout(), [])

  const signOut = useCallback(() => {
    clearRefreshTimeout()
    setProfile(null)
    setAccessToken(null)
    setStatus('signed_out')
    setError(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ profile, accessToken, status, error, handleGoogleLogin, refreshToken: requestToken, signOut }),
    [accessToken, error, handleGoogleLogin, profile, requestToken, signOut, status],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
