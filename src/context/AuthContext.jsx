import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { getSupabase, supabase, supabaseIsConfigured } from '../lib/supabaseClient'

const AuthContext = createContext(null)

const STAFF_ROLES = new Set(['editor', 'admin', 'super_admin'])
const ADMIN_ROLES = new Set(['admin', 'super_admin'])
const BLOG_WRITER_ROLES = new Set(['blog_writer'])
const CHECK_IN_ROLES = new Set(['check_in'])

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(supabaseIsConfigured)

  const loadProfile = useCallback(async (userId) => {
    if (!supabase || !userId) {
      setProfile(null)
      return
    }
    const { data, error } = await supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle()
    if (error) {
      console.error('[Auth] profile load failed', error)
      setProfile(null)
      return
    }
    setProfile(data)
  }, [])

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return undefined
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      loadProfile(data.session?.user?.id).finally(() => setLoading(false))
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      loadProfile(nextSession?.user?.id)
    })

    return () => sub.subscription.unsubscribe()
  }, [loadProfile])

  const signIn = useCallback(async (email, password) => {
    const { error } = await getSupabase().auth.signInWithPassword({ email, password })
    if (error) throw error
  }, [])

  const signOut = useCallback(async () => {
    const { error } = await getSupabase().auth.signOut()
    if (error) throw error
  }, [])

  const isActive = profile?.status === 'active'
  const isStaff = Boolean(isActive && STAFF_ROLES.has(profile?.role))
  const isAdmin = Boolean(isActive && ADMIN_ROLES.has(profile?.role))
  const isBlogWriter = Boolean(isActive && BLOG_WRITER_ROLES.has(profile?.role))
  const isCheckInStaff = Boolean(isActive && CHECK_IN_ROLES.has(profile?.role))
  const canAccessCms = isStaff || isBlogWriter || isCheckInStaff

  const value = useMemo(
    () => ({
      session,
      profile,
      loading,
      isStaff,
      isAdmin,
      isBlogWriter,
      isCheckInStaff,
      canAccessCms,
      supabaseConfigured: supabaseIsConfigured,
      signIn,
      signOut,
    }),
    [session, profile, loading, isStaff, isAdmin, isBlogWriter, isCheckInStaff, canAccessCms, signIn, signOut]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
