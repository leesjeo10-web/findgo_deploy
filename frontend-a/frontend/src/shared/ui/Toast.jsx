import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
const ToastContext = createContext(null)
export function ToastProvider({ children }) {
  const [message, setMessage] = useState('')
  const timer = useRef()
  const notify = useCallback((text) => {
    clearTimeout(timer.current)
    setMessage(text)
    timer.current = setTimeout(() => setMessage(''), 4000)
  }, [])
  useEffect(() => () => clearTimeout(timer.current), [])
  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {message && (
          <div className="toast">
            {message}
            <button
              type="button"
              onClick={() => setMessage('')}
              aria-label="알림 닫기"
            >
              ×
            </button>
          </div>
        )}
      </div>
    </ToastContext.Provider>
  )
}
export function useToast() {
  return useContext(ToastContext)
}
