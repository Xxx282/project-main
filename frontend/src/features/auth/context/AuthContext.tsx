import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { AuthUser } from '../store/authStore'
import { authStore } from '../store/authStore'
import { me } from '../api/authApi'

type AuthState = {
  user: AuthUser | null
  loading: boolean
  refresh: () => Promise<void>
  logout: () => void
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
    authStore.clearToken()
    setUser(null)
  }

  useEffect(() => {
    ;(async () => {
      try {
        await refresh()
      } catch {
        logout()
      } finally {
        setLoading(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const value = useMemo<AuthState>(() => ({ user, loading, refresh, logout }), [user, loading])

  return <Ctx.Provider value={value}>{props.children}</Ctx.Provider>
}

