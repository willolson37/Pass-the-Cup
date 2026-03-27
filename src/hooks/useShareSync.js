import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export default function useShareSync(gameState) {
  // Generate the code immediately on mount — don't wait for Supabase
  const [shareCode] = useState(() => generateCode())
  const [syncReady, setSyncReady] = useState(false) // true once Supabase confirms
  const [shareError, setShareError] = useState(false)
  const syncTimeoutRef = useRef(null)
  const registeredRef = useRef(false)

  // Register the code with Supabase once on mount
  const register = useCallback(async (code, state) => {
    try {
      const { error } = await supabase
        .from('game_sessions')
        .insert({ code, game_state: state, is_active: true })

      if (error) {
        console.error('[useShareSync] register error:', error.code, error.message)
        setShareError(true)
      } else {
        registeredRef.current = true
        setSyncReady(true)
        setShareError(false)
      }
    } catch (err) {
      console.error('[useShareSync] register exception:', err)
      setShareError(true)
    }
  }, [])

  useEffect(() => {
    register(shareCode, gameState)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync state updates to Supabase (debounced 500ms), only once registered
  useEffect(() => {
    if (!syncReady) return

    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current)

    syncTimeoutRef.current = setTimeout(async () => {
      try {
        const { error } = await supabase
          .from('game_sessions')
          .update({ game_state: gameState, updated_at: new Date().toISOString() })
          .eq('code', shareCode)
        if (error) console.error('[useShareSync] sync error:', error.message)
      } catch (err) {
        console.error('[useShareSync] sync exception:', err)
      }
    }, 500)

    return () => { if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current) }
  }, [gameState, syncReady, shareCode])

  // Mark inactive on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current)
      if (registeredRef.current) {
        supabase
          .from('game_sessions')
          .update({ is_active: false })
          .eq('code', shareCode)
          .then(() => {})
      }
    }
  }, [shareCode])

  const retryRegister = useCallback(() => {
    setShareError(false)
    register(shareCode, gameState)
  }, [shareCode, gameState, register])

  return { shareCode, syncReady, shareError, retryRegister }
}
