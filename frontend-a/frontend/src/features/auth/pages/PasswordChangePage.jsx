import { Navigate } from 'react-router-dom'
import { useAuth } from '../model/authContext.js'
import AuthLayout from '../components/AuthLayout.jsx'
import PasswordChangeForm from '../components/PasswordChangeForm.jsx'
import Button from '../../../shared/ui/Button.jsx'
export default function PasswordChangePage() {
  const { user, signOut } = useAuth()
  if (!user.mustChangePassword && !user.phone)
    return <Navigate to="/auth/phone" replace />
  return (
    <AuthLayout
      title={
        user.mustChangePassword
          ? '새 비밀번호를 설정해 주세요'
          : '비밀번호 변경'
      }
      description={
        user.mustChangePassword
          ? '첫 로그인이에요. 지급받은 비밀번호를 나만의 비밀번호로 변경해 주세요.'
          : '현재 비밀번호를 확인하고 새 비밀번호를 설정해 주세요.'
      }
      image="Key"
      step={user.mustChangePassword ? 1 : undefined}
    >
      <PasswordChangeForm />
      {!user.mustChangePassword && (
        <Button to="/mypage" variant="outline" className="auth-cancel">
          돌아가기
        </Button>
      )}
      <button
        className="auth-signout"
        type="button"
        onClick={() => signOut().catch(() => {})}
      >
        로그아웃
      </button>
    </AuthLayout>
  )
}
