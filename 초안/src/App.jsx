import { useEffect } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import Header from './components/common/Header';
import Button from './components/common/Button';
import { Toast } from './components/common/Feedback';
import Home from './pages/Home/Home';
import Login from './pages/Auth/Login';
import ItemsPage from './pages/Items/ItemsPage';
import ItemCreatePage, { EditItemPage } from './pages/Items/ItemCreatePage';
import ItemDetailPage from './pages/Items/ItemDetailPage';
import MyPage from './pages/MyPage/MyPage';
import { useAuthStore } from './stores/useAuthStore';
import { useItemStore } from './stores/useItemStore';
import { useUIStore } from './stores/useUIStore';

function RequireAuth() {
  const user = useAuthStore(state => state.user);
  const location = useLocation();
  return user ? <Outlet /> : <Navigate to="/login" state={{ from: location.pathname }} replace />;
}
function Layout() { return <><Header /><Outlet /></>; }
export default function App() {
  const { pathname } = useLocation();
  const user = useAuthStore(state => state.user);
  const clear = useAuthStore(state => state.clear);
  const fetchItems = useItemStore(state => state.fetchItems);
  const notify = useUIStore(state => state.notify);
  useEffect(() => { fetchItems(); }, [fetchItems, user?.id]);
  useEffect(() => { window.scrollTo(0, 0); document.title = '찾Go · 우리 학교 분실물 찾기'; }, [pathname]);
  useEffect(() => {
    const expired = () => { clear(); notify('로그인이 만료됐어요. 다시 로그인해 주세요.'); };
    window.addEventListener('chatgo:unauthorized', expired);
    return () => window.removeEventListener('chatgo:unauthorized', expired);
  }, [clear, notify]);
  return <><a className="skip-link" href="#app-content">본문으로 건너뛰기</a><div id="app-content" tabIndex={-1}>
    <Routes>
      <Route path="/login" element={<Login />} /><Route path="/signup" element={<Login signup />} />
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="/items/found" element={<ItemsPage type="found" />} /><Route path="/items/lost" element={<ItemsPage type="lost" />} />
        <Route path="/items/detail/:id" element={<ItemDetailPage />} />
        <Route element={<RequireAuth />}>
          <Route path="/items/new/found" element={<ItemCreatePage key="new-found" type="found" />} /><Route path="/items/new/lost" element={<ItemCreatePage key="new-lost" type="lost" />} />
          <Route path="/items/:id/edit" element={<EditItemPage />} /><Route path="/mypage" element={<MyPage />} />
        </Route>
        <Route path="*" element={<main className="page empty-state"><h1 className="text-3xl">페이지를 찾을 수 없어요.</h1><Button to="/">홈으로 돌아가기</Button></main>} />
      </Route>
    </Routes>
  </div><Toast /></>;
}
