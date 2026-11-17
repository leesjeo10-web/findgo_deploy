import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser, login, logout, changePassword, updatePhone } from '../api/authRepository.js'
import { getAccessToken } from './session.js'
import { configureApiAuth } from '../../../shared/api/http.js'
import { AuthContext } from './authContext.js'
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const version = useRef(0)
  const navigate = useNavigate()
  const expire = useCallback(async () => {
    version.current += 1
    await logout()
    setUser(null); setError(null); setLoading(false)
    navigate('/login', { replace: true })
  }, [navigate])
  const refresh = useCallback(async () => {
    const requestVersion = version.current
    try {
      const next = await getCurrentUser()
      if (requestVersion === version.current) { setUser(next); setError(null) }
    } catch (failure) {
      if (requestVersion === version.current) { setUser(null); setError(failure.status === 401 ? null : failure) }
    } finally { if (requestVersion === version.current) setLoading(false) }
  }, [])
  useEffect(() => {
    configureApiAuth({ getToken: getAccessToken, onUnauthorized: expire })
    refresh()
    const sync = event => setUser(previous => previous && String(previous.id) === String(event.detail?.id) ? event.detail : previous)
    window.addEventListener('finder:user-updated', sync)
    window.addEventListener('focus', refresh)
    const timer = setInterval(refresh, 60000)
    return () => { window.removeEventListener('finder:user-updated', sync); window.removeEventListener('focus', refresh); clearInterval(timer) }
  }, [refresh, expire])
  const value = {
    user, loading, error, refresh,
    signIn: async values => { version.current += 1; const next = await login(values); setUser(next); setError(null); setLoading(false); return next },
    signOut: expire,
    changePassword: async values => { version.current += 1; const next = await changePassword(values); setUser(next); return next },
    savePhone: async (phone, officePhone) => { version.current += 1; const next = await updatePhone(phone, officePhone); setUser(next); return next },
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
