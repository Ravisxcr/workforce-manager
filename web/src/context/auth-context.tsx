import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import { getUserInfo, login as apiLogin, logout as apiLogout } from '@/api/auth'
import { clearToken } from '@/api/client'
import type { UserInfo, UserLogin } from '@/types'

interface AuthContextValue {
  user: UserInfo | null
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  login: (data: UserLogin) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchUser = useCallback(async () => {
    try {
      const info = await getUserInfo()
      setUser(info)
    } catch {
      setUser(null)
      clearToken()
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  const login = async (data: UserLogin) => {
    await apiLogin(data)
    await fetchUser()
  }

  const logout = async () => {
    try { await apiLogout() } catch { /* best-effort */ }
    clearToken()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, isAdmin: user?.role === 'admin', login, logout, refresh: fetchUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
