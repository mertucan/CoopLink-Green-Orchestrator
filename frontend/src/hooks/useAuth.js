import { createContext, createElement, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'

const AuthContext = createContext(null)
const TOKEN_KEY = 'cooplink_token'
const USER_KEY = 'cooplink_user'

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => window.localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState(() => {
    const stored = window.localStorage.getItem(USER_KEY)
    return stored ? JSON.parse(stored) : null
  })
  const [isChecking, setIsChecking] = useState(Boolean(token))

  const logout = () => {
    window.localStorage.removeItem(TOKEN_KEY)
    window.localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }

  useEffect(() => {
    if (!token) {
      setIsChecking(false)
      return
    }
    let ignore = false
    api.get('/auth/me')
      .then((response) => {
        if (ignore) return
        const nextUser = response.data.user
        setUser(nextUser)
        window.localStorage.setItem(USER_KEY, JSON.stringify(nextUser))
      })
      .catch(() => {
        if (!ignore) logout()
      })
      .finally(() => {
        if (!ignore) setIsChecking(false)
      })
    return () => {
      ignore = true
    }
  }, [token])

  useEffect(() => {
    window.addEventListener('cooplink:unauthorized', logout)
    return () => window.removeEventListener('cooplink:unauthorized', logout)
  }, [])

  const login = async ({ contactPhone, password }) => {
    const response = await api.post('/auth/login', {
      contact_phone: contactPhone,
      password
    })
    const nextToken = response.data.token
    const nextUser = response.data.user
    window.localStorage.setItem(TOKEN_KEY, nextToken)
    window.localStorage.setItem(USER_KEY, JSON.stringify(nextUser))
    setToken(nextToken)
    setUser(nextUser)
    return nextUser
  }

  const register = async ({ name, region, contactPhone, password }) => {
    const response = await api.post('/auth/register', {
      name,
      region,
      contact_phone: contactPhone,
      password
    })
    return response.data.user
  }

  const value = useMemo(() => ({
    user,
    role: user?.role || 'public',
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === 'admin',
    isCooperative: user?.role === 'cooperative',
    isChecking,
    login,
    register,
    logout
  }), [user, isChecking])

  return createElement(AuthContext.Provider, { value }, children)
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth, AuthProvider içinde kullanılmalı.')
  }
  return context
}
