import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { AuthUser } from '../store/authStore'
import { authStore } from '../store/authStore'
import { me } from '../api/authApi'

type AuthState = {
  user: AuthUser | null
  loading: boolean
  refresh: () => Promise<void>
  logout: () => void
  isLoggingOut: boolean
}

const Ctx = createContext<AuthState | null>(null)

export function useAuth() {
  const v = useContext(Ctx)
  if (!v) throw new Error('AuthContext not found')
  return v
}

export function AuthProvider(props: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const navigate = useNavigate()

  const refresh = async () => {
    const token = authStore.getToken()
    if (!token) {
      setUser(null)
      return
    }
    const u = await me()
    setUser(u)
  }

  const logout = () => {
    setIsLoggingOut(true)
    authStore.clearToken()
    setUser(null)
    navigate('/', { replace: true })
  }

  useEffect(() => {
    ;(async () => {
      try {
        await refresh()
      } catch {
        // token无效，清除状态但不设置isLoggingOut标记
        authStore.clearToken()
        setUser(null)
      } finally {
        setLoading(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const value = useMemo<AuthState>(() => ({ user, loading, refresh, logout, isLoggingOut }), [user, loading, isLoggingOut])

  return <Ctx.Provider value={value}>{props.children}</Ctx.Provider>
}

