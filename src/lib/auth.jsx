import { createContext, useContext, useState, useEffect } from 'react'
import { supabase, isDemoMode } from './supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isDemoMode) {
      setUser({ id: 'demo', email: 'demo@supplybrain.app' })
      setLoading(false)
      return
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email, password, empresa) => {
    if (isDemoMode) return { error: { message: 'Demo mode' } }
    return supabase.auth.signUp({ email, password, options: { data: { empresa } } })
  }

  const signIn = async (email, password) => {
    if (isDemoMode) return { error: { message: 'Demo mode' } }
    return supabase.auth.signInWithPassword({ email, password })
  }

  const signOut = async () => {
    if (isDemoMode) return
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut, isDemoMode }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
