import { useCallback, useEffect, useState, useRef } from 'react'
import {
  getCurrentUser,
  login,
  logout,
  changePassword,
  updatePhone,
} from '../api/authRepository.js'
import { AuthContext } from './authContext.js'
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(null)
  const version = useRef(0)
  const refresh = useCallback(async () => {
    const requestVersion = version.current
    try {
      const next = await getCurrentUser()
      if (requestVersion !== version.current) return
      setUser(next)
      setError(null)
    } catch (failure) {
      if (requestVersion !== version.current) return
      setUser(null)
      setError(failure)
    } finally {
      if (requestVersion === version.current) setLoading(false)
    }
  }, [])
  useEffect(() => {
    refresh()
    window.addEventListener('focus', refresh)
    const timer = setInterval(refresh, 60000)
    return () => {
      window.removeEventListener('focus', refresh)
      clearInterval(timer)
    }
  }, [refresh])
  const value = {
    user,
    loading,
    error,
    refresh,
    signIn: async (values) => {
      version.current += 1
      const next = await login(values)
      setUser(next)
      setError(null)
      return next
    },
    signOut: async () => {
      version.current += 1
      try {
        await logout()
      } finally {
        setUser(null)
      }
    },
    changePassword: async (values) => {
      version.current += 1
      const next = await changePassword(values)
      setUser(next)
      return next
    },
    savePhone: async (phone) => {
      version.current += 1
      const next = await updatePhone(phone)
      setUser(next)
      return next
    },
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
