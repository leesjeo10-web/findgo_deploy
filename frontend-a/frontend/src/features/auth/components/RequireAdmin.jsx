import { Outlet } from 'react-router-dom'
import { useAuth } from '../model/authContext.js'
import EmptyState from '../../../shared/ui/EmptyState.jsx'
import Button from '../../../shared/ui/Button.jsx'
export default function RequireAdmin() {
  const { user } = useAuth()
  if (user?.role !== 'ADMIN')
    return (
      <main id="main-content">
        <EmptyState
          title="관리자만 이용할 수 있어요"
          image="Locked"
          description="학생 계정으로는 관리 페이지에 접근할 수 없어요."
        >
          <Button to="/">물품 목록으로</Button>
        </EmptyState>
      </main>
    )
  return <Outlet />
}
