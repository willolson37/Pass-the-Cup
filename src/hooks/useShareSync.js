import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'

// Generates a 6-char code from unambiguous chars (no 0/O/1/I)
function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

// Hook usage: const { shareCode, isSharing, startSharing, stopSharing } = useShareSync(gameState)
// - startSharing: generates code, creates Supabase record, starts auto-syncing gameState changes
// - stopSharing: marks game inactive
// - shareCode: the 6-char code or null
// - isSharing: boolean

export default function useShareSync(gameState) {
  const [shareCode, setShareCode] = useState(null)
  const [isSharing, setIsSharing] = useState(false)
  const [shareError, setShareError] = useState(false)
  const codeRef = useRef(null)
  const isSharingRef = useRef(false)
  const syncTimeoutRef = useRef(null)

  // Keep refs in sync with state so callbacks always have current values
  useEffect(() => {
    isSharingRef.current = isSharing
  }, [isSharing])

  useEffect(() => {
    codeRef.current = shareCode
  }, [shareCode])

  const syncState = useCallback(async (state, code) => {
    if (!code || !state) return
    try {
      const { error } = await supabase
        .from('game_sessions')
        .upsert(
          {
            code,
            game_state: state,
            updated_at: new Date().toISOString(),
            is_active: true,
          },
          { onConflict: 'code' }
        )
      if (error) {
        console.error('[useShareSync] upsert error:', error.message)
      }
    } catch (err) {
      console.error('[useShareSync] unexpected sync error:', err)
    }
  }, [])

  // Auto-sync on gameState changes when sharing is active.
  // Debounce by 300ms to avoid hammering Supabase on rapid state updates.
  useEffect(() => {
    if (!isSharingRef.current || !codeRef.current) return

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current)
    }

    syncTimeoutRef.current = setTimeout(() => {
      syncState(gameState, codeRef.current)
    }, 300)

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
    }
  }, [gameState, syncState])

  const startSharing = useCallback(async () => {
    if (isSharingRef.current) return

    setShareError(false)
    const code = generateCode()

    // Timeout: if Supabase doesn't respond in 8s, surface the error
    const timeoutId = setTimeout(() => {
      if (!isSharingRef.current) {
        console.error('[useShareSync] timed out waiting for Supabase')
        setShareError(true)
      }
    }, 8000)

    try {
      console.log('[useShareSync] inserting code:', code)
      const { data, error } = await supabase
        .from('game_sessions')
        .upsert(
          {
            code,
            game_state: gameState,
            updated_at: new Date().toISOString(),
            is_active: true,
          },
          { onConflict: 'code' }
        )
        .select()

      clearTimeout(timeoutId)

      if (error) {
        console.error('[useShareSync] startSharing error:', error.code, error.message, error.details)
        setShareError(true)
        return
      }

      console.log('[useShareSync] session created:', data)
      codeRef.current = code
      isSharingRef.current = true
      setShareError(false)
      setShareCode(code)
      setIsSharing(true)
    } catch (err) {
      clearTimeout(timeoutId)
      console.error('[useShareSync] unexpected startSharing error:', err)
      setShareError(true)
    }
  }, [gameState])

  const stopSharing = useCallback(async () => {
    if (!isSharingRef.current || !codeRef.current) return

    const code = codeRef.current

    try {
      const { error } = await supabase
        .from('game_sessions')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('code', code)

      if (error) {
        console.error('[useShareSync] stopSharing error:', error.message)
      }
    } catch (err) {
      console.error('[useShareSync] unexpected stopSharing error:', err)
    }

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current)
    }

    codeRef.current = null
    isSharingRef.current = false
    setShareCode(null)
    setIsSharing(false)
  }, [])

  // Clean up on unmount — mark session inactive without blocking
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
      if (codeRef.current) {
        supabase
          .from('game_sessions')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq('code', codeRef.current)
          .then(({ error }) => {
            if (error) {
              console.error('[useShareSync] cleanup error:', error.message)
            }
          })
      }
    }
  }, [])

  return { shareCode, isSharing, shareError, startSharing, stopSharing }
}
