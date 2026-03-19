import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App'
import { AuthProvider } from './hooks/useAuth'
import { FinTrackProvider } from './hooks/useFinTrack'
import { ToastProvider } from './components/ui/Toast'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId='962828595661-k25p2sr2i3tfu5adgfe2cvihqasvl6i7.apps.googleusercontent.com'>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <FinTrackProvider>
              <App />
            </FinTrackProvider>
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </StrictMode>,
)
