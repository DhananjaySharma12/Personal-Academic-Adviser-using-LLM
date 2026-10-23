import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import {
  onAuthStateChanged,
  signOut,
} from 'firebase/auth'
import { auth } from '@/firebase'
import { profileApi } from '@/api/profile'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)

  const refreshProfile = useCallback(async () => {
    if (!auth.currentUser) {
      setProfile(null)
      return null
    }
    setProfileLoading(true)
    try {
      const data = await profileApi.get()
      setProfile(data)
      return data
    } catch (err) {
      console.warn('Failed to refresh profile:', err)
      return null
    } finally {
      setProfileLoading(false)
    }
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        setProfileLoading(true)
        try {
          const data = await profileApi.get()
          setProfile(data)
        } catch {
          // non-fatal, profile can be refreshed later
        } finally {
          setProfileLoading(false)
        }
      } else {
        setProfile(null)
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const logout = async () => {
    await signOut(auth)
  }

  const value = {
    user,
    loading,
    logout,
    isAuthenticated: !!user,
    profile,
    profileLoading,
    refreshProfile,
    setProfile,
    onboardingComplete: profile?.onboardingComplete ?? true,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext

