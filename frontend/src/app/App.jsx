import { BrowserRouter } from 'react-router-dom'
import AppRouter from './router/AppRouter.jsx'
import { ToastProvider } from '../shared/ui/Toast.jsx'
import { AuthProvider } from '../features/auth/model/AuthProvider.jsx'
export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
