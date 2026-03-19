import { useRegisterSW } from 'virtual:pwa-register/react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { ExpensesPage } from './pages/ExpensesPage'
import { TripsPage } from './pages/TripsPage'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { BudgetsPage } from './pages/BudgetsPage'
import { SettingsPage } from './pages/SettingsPage'
import { Layout } from './components/layout/Layout'
import { Spinner } from './components/ui/Spinner'
import { InstallBanner } from './components/ui/InstallBanner'
import { UpdateBanner } from './components/ui/UpdateBanner'
import { useAuth } from './hooks/useAuth'
import { useFinTrack } from './hooks/useFinTrack'
import { TripDetail } from './components/trips/TripDetail'

function ProtectedLayout() {
  const { profile } = useAuth()
  const { loading, indexedDbAvailable } = useFinTrack()

  if (!profile) return <Navigate to="/login" replace />
  if (loading) return <Spinner />

  return (
    <>
      {!indexedDbAvailable ? <div className="sticky top-0 z-50 bg-amber-100 px-4 py-3 text-sm text-amber-900">IndexedDB is unavailable. FinTrack is temporarily using in-memory storage.</div> : null}
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/expenses" element={<ExpensesPage />} />
          <Route path="/trips" element={<TripsPage />} />
          <Route path="/trips/:id" element={<TripDetail />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/budgets" element={<BudgetsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </>
  )
}

export default function App() {
  const { needRefresh, updateServiceWorker } = useRegisterSW()

  return (
    <>
      <UpdateBanner open={Boolean(needRefresh[0])} onRefresh={() => updateServiceWorker(true)} />
      <InstallBanner />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/*" element={<ProtectedLayout />} />
      </Routes>
    </>
  )
}
