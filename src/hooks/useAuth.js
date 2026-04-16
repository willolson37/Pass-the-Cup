import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('fetchProfile error:', error)
      return null
    }
    return data
  }, [])

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) {
        const prof = await fetchProfile(currentUser.id)
        if (mounted) setProfile(prof)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        const currentUser = session?.user ?? null
        setUser(currentUser)
        if (currentUser) {
          const prof = await fetchProfile(currentUser.id)
          if (mounted) setProfile(prof)
        } else {
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  const hasLiveAccess = useCallback(() => {
    return true // Live mode free for all while in beta
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!user) return
    const prof = await fetchProfile(user.id)
    setProfile(prof)
  }, [user, fetchProfile])

  return { user, profile, loading, hasLiveAccess, signOut, refreshProfile }
}
