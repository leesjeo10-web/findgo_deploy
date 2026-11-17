import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/model/authContext.js'
import { logo } from '../lib/assets.js'
import './layout.css'
export default function Header({ search }) {
  const { pathname } = useLocation()
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  return (
    <header className="site-header">
      <div className={'wrap site-nav' + (search ? ' site-nav--search' : '')}>
        <Link className="site-logo" to="/" aria-label="찾Go 홈">
          <img src={logo} alt="찾Go" width="102" height="34" />
        </Link>
        <nav className="site-menu" aria-label="주 메뉴">
          <NavLink to="/" end>
            습득/분실물 조회
          </NavLink>
          <NavLink
            to="/items/new"
            aria-current={pathname.endsWith('/edit') ? 'page' : undefined}
          >
            물품 등록
          </NavLink>
          <NavLink to="/mypage">내 물품</NavLink>
          {user?.role === 'ADMIN' && <NavLink to="/admin">선생님 관리</NavLink>}
        </nav>
        {search && <div className="header-search">{search}</div>}
        <div className="header-actions">
          <span className="header-account">
            <b>{user?.name}</b> {user?.role === 'ADMIN' ? '관리자' : '학생'}
          </span>
          <button
            className="header-signout"
            type="button"
            onClick={async () => {
              try {
                await signOut()
              } catch {
                /* 로컬 세션은 signOut에서 먼저 정리한다. */
              } finally {
                navigate('/login', { replace: true })
              }
            }}
          >
            로그아웃
          </button>
        </div>
      </div>
    </header>
  )
}
