import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import ItemListPage from '../../features/items/pages/ItemListPage.jsx'
import ItemDetailPage from '../../features/items/pages/ItemDetailPage.jsx'
import ItemCreatePage from '../../features/items/pages/ItemCreatePage.jsx'
import ItemEditPage from '../../features/items/pages/ItemEditPage.jsx'
function HomeRedirect() {
  const { search, hash } = useLocation()
  return <Navigate to={{ pathname: '/', search, hash }} replace />
}
export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<ItemListPage />} />
      <Route path="/home" element={<HomeRedirect />} />
      <Route path="/items/new" element={<ItemCreatePage />} />
      <Route path="/items/:id" element={<ItemDetailPage />} />
      <Route path="/items/:id/edit" element={<ItemEditPage />} />
      <Route path="/mypage" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
