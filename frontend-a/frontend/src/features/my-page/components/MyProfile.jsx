import { useAuth } from '../../auth/model/authContext.js'
import Button from '../../../shared/ui/Button.jsx'
export default function MyProfile() {
  const { user } = useAuth()
  return (
    <section className="profile-card" aria-label="내 정보">
      <div>
        <h2>
          {user.name} <small>{user.role === 'ADMIN' ? '관리자' : '학생'}</small>
        </h2>
        <p>
          아이디 {user.loginId} · {user.phone}
        </p>
      </div>
      <nav aria-label="내 정보 설정">
        <Button to="/auth/password" variant="outline" size="small">
          비밀번호 변경
        </Button>
        <Button to="/auth/phone" variant="outline" size="small">
          연락처 수정
        </Button>
      </nav>
    </section>
  )
}
