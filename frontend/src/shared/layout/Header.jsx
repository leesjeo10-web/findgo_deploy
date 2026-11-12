import { Link, NavLink, useLocation } from 'react-router-dom'
import { logo } from '../lib/assets.js'
import Button from '../ui/Button.jsx'
import './layout.css'
export default function Header({ search }) {
  const { pathname } = useLocation()
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
        </nav>
        {search && <div className="header-search">{search}</div>}
        <div className="header-actions">
          <Button to="/items/new" size="small">
            물품 등록
          </Button>
        </div>
      </div>
    </header>
  )
}
