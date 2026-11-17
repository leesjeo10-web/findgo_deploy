import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../model/authContext.js'
import { nextAuthPath } from '../model/authModel.js'
import LoadingState from '../../../shared/ui/LoadingState.jsx'
import ErrorState from '../../../shared/ui/ErrorState.jsx'
export default function RequireAuth({ setup = false }) {
  const { user, loading, error, refresh } = useAuth()
  if (loading) return <LoadingState />
  if (error) return <ErrorState error={error} onRetry={refresh} />
  if (!user) return <Navigate to="/login" replace />
  const next = nextAuthPath(user)
  if (!setup && next !== '/') return <Navigate to={next} replace />
  return <Outlet />
}
