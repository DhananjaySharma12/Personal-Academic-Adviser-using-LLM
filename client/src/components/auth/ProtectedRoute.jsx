import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <p className="text-text-secondary text-sm">Loading...</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children ? children : <Outlet />
}

export function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <p className="text-text-secondary text-sm">Loading...</p>
      </div>
    )
  }

  if (user) {
    return <Navigate to="/app/dashboard" replace />
  }

  return children ? children : <Outlet />
}

export default ProtectedRoute
