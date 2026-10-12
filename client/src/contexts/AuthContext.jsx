/**
 * AuthContext — JWT token + user state. Token stored in localStorage.
 * On mount, if token exists → calls GET /api/auth/me to restore session.
 * Never passes userId from client to API; server reads it from the JWT.
 */
import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { authApi } from '@/api/auth'

const AuthContext = createContext(null)

const TOKEN_KEY = 'paa_token' // "Personal Academic Adviser"

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || null)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(!!localStorage.getItem(TOKEN_KEY)) // true only if token exists

  // On mount: restore session if token exists
  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }
    authApi
      .me()
      .then(({ user: u, profile: p }) => {
        setUser(u)
        setProfile(p)
      })
      .catch(() => {
        // Token invalid/expired — clear it
        localStorage.removeItem(TOKEN_KEY)
        setToken(null)
      })
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback((newToken, userData, profileData) => {
    localStorage.setItem(TOKEN_KEY, newToken)
    setToken(newToken)
    setUser(userData)
    setProfile(profileData ?? null)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
    setProfile(null)
  }, [])

  const refreshProfile = useCallback(async () => {
    try {
      const { profile: p } = await authApi.me()
      setProfile(p)
      return p
    } catch {
      return null
    }
  }, [])

  const value = {
    token,
    user,
    profile,
    setProfile,
    loading,
    login,
    logout,
    refreshProfile,
    isAuthenticated: !!token && !loading,
    onboardingComplete: profile?.onboardingComplete ?? false,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
