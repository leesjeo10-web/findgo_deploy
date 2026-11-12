import { BrowserRouter } from 'react-router-dom'
import AppRouter from './router/AppRouter.jsx'
import { ToastProvider } from '../shared/ui/Toast.jsx'
export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AppRouter />
      </ToastProvider>
    </BrowserRouter>
  )
}
