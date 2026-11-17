import { Navigate } from 'react-router-dom'
import { useAuth } from '../model/authContext.js'
import { nextAuthPath } from '../model/authModel.js'
import LoadingState from '../../../shared/ui/LoadingState.jsx'
import ErrorState from '../../../shared/ui/ErrorState.jsx'
import AuthLayout from '../components/AuthLayout.jsx'
import LoginForm from '../components/LoginForm.jsx'
export default function LoginPage() {
  const { user, loading, error, refresh } = useAuth()
  if (loading) return <LoadingState />
  if (error) return <ErrorState error={error} onRetry={refresh} />
  if (user) return <Navigate to={nextAuthPath(user)} replace />
  return (
    <AuthLayout
      title="찾Go에 로그인해 주세요"
      description="학교에서 지급받은 계정으로 시작해 보세요."
      image="Magnifying glass tilted left"
    >
      <LoginForm />

    </AuthLayout>
  )
}
