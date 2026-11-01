import { Link, NavLink, useLocation, useMatch } from 'react-router-dom';
import Brand from './Brand';
import { useAuthStore } from '../../stores/useAuthStore';
import { useItemStore } from '../../stores/useItemStore';

export function Avatar({ large = false }) {
  return <span className={`avatar ${large ? 'avatar-large' : ''}`}><img src="/assets/bba97.svg" alt="" /></span>;
}
export default function Header({ auth = false, signup = false }) {
  const user = useAuthStore(state => state.user);
  const { pathname } = useLocation();
  const detail = useMatch('/items/detail/:id');
  const edit = useMatch('/items/:id/edit');
  const itemId = detail?.params.id || edit?.params.id;
  const item = useItemStore(state => state.items.find(item => String(item.id) === itemId));
  const activeType = pathname === '/' || pathname === '/items/new/found' ? 'found' : pathname === '/items/new/lost' ? 'lost' : item?.type;
  return <header className={`site-header ${auth ? 'auth-header' : ''}`}>
    <div className="header-inner">
      <Brand />
      {auth ? !signup && <p className="school-context">경북소프트웨어마이스터고의 분실물 찾기</p> : <>
        <nav className="top-nav" aria-label="주요 메뉴">
          <NavLink to="/items/found" className={({ isActive }) => isActive || activeType === 'found' ? 'active' : ''}>습득물</NavLink>
          <NavLink to="/items/lost" className={({ isActive }) => isActive || activeType === 'lost' ? 'active' : ''}>분실물</NavLink>
        </nav>
        <Link to={user ? '/mypage' : '/login'} className="account-link" aria-label={user ? '마이페이지' : '로그인'}><Avatar /><span>{user ? '마이페이지' : '로그인'}</span></Link>
      </>}
    </div>
  </header>;
}
