/**
 * ProtectedRoute — redirects to /login if not authenticated.
 * Shows loading spinner while auth is being restored from token.
 * Redirects to /onboarding if logged in but onboarding not complete.
 */
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { GraduationCap } from 'lucide-react'

function AuthLoader() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <GraduationCap size={36} className="text-primary animate-pulse" />
        <p className="text-text-secondary text-sm">Restoring session…</p>
      </div>
    </div>
  )
}

export function ProtectedRoute() {
  const { isAuthenticated, loading, onboardingComplete } = useAuth()
  const location = useLocation()

  if (loading) return <AuthLoader />
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  // Redirect to onboarding if not complete (skip if already there)
  if (!onboardingComplete && location.pathname !== '/app/onboarding') {
    return <Navigate to="/app/onboarding" replace />
  }
  return <Outlet />
}

export function PublicOnlyRoute() {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <AuthLoader />
  if (isAuthenticated) return <Navigate to="/app/dashboard" replace />
  return <Outlet />
}
