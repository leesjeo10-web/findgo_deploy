import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import ItemListPage from '../../features/items/pages/ItemListPage.jsx'
import ItemDetailPage from '../../features/items/pages/ItemDetailPage.jsx'
import ItemCreatePage from '../../features/items/pages/ItemCreatePage.jsx'
import ItemEditPage from '../../features/items/pages/ItemEditPage.jsx'
import MyPage from '../../features/my-page/pages/MyPage.jsx'
import LoginPage from '../../features/auth/pages/LoginPage.jsx'
import PasswordChangePage from '../../features/auth/pages/PasswordChangePage.jsx'
import PhoneSetupPage from '../../features/auth/pages/PhoneSetupPage.jsx'
import RequireAuth from '../../features/auth/components/RequireAuth.jsx'
import RequireAdmin from '../../features/auth/components/RequireAdmin.jsx'
import AdminItemsPage from '../../features/admin/pages/AdminItemsPage.jsx'
import StudentManagementPage from '../../features/admin/pages/StudentManagementPage.jsx'
function HomeRedirect() {
  const { search, hash } = useLocation()
  return <Navigate to={{ pathname: '/', search, hash }} replace />
}
export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth setup />}>
        <Route path="/auth/password" element={<PasswordChangePage />} />
        <Route path="/auth/phone" element={<PhoneSetupPage />} />
      </Route>
      <Route element={<RequireAuth />}>
        <Route path="/" element={<ItemListPage />} />
        <Route path="/home" element={<HomeRedirect />} />
        <Route path="/items/new" element={<ItemCreatePage />} />
        <Route path="/items/:id" element={<ItemDetailPage />} />
        <Route path="/items/:id/edit" element={<ItemEditPage />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route element={<RequireAdmin />}>
          <Route
            path="/admin"
            element={<Navigate to="/admin/items" replace />}
          />
          <Route path="/admin/items" element={<AdminItemsPage />} />
          <Route path="/admin/students" element={<StudentManagementPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
