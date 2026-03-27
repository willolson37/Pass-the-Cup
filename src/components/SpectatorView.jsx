import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'
import CupIcon from './CupIcon.jsx'

const PLAYER_COLORS = [
  '#3b82f6', '#f97316', '#22c55e', '#7c3aed',
  '#ec4899', '#14b8a6', '#f59e0b', '#6366f1', '#ef4444',
]

const POLL_INTERVAL_MS = 5000

function relativeTime(timestamp) {
  const now = Date.now()
  const diff = Math.floor((now - timestamp) / 1000)
  if (diff < 5) return 'just now'
  if (diff < 60) return `${diff}s ago`
  const mins = Math.floor(diff / 60)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  return `${hrs}h ago`
}

// ── Spectator Event Log ──────────────────────────────────────────────────────

function SpectatorEventLog({ events }) {
  const visible = (events || []).slice(0, 10)

  if (visible.length === 0) {
    return (
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Event Log</div>
        <div style={styles.emptyText}>No at-bats yet</div>
      </div>
    )
  }

  return (
    <div style={styles.section}>
      <div style={styles.sectionTitle}>Event Log</div>
      <div>
        {visible.map((evt) => {
          const change = evt.balanceChange
          const tagStyle =
            change === 0
              ? styles.tagNeutral
              : change > 0
              ? styles.tagPositive
              : styles.tagNegative
          const tagText =
            change === 0
              ? 'passes'
              : change > 0
              ? `+$${change}`
              : `-$${Math.abs(change)}`

          return (
            <div key={evt.id} style={styles.eventItem}>
              <div style={styles.eventItemTop}>
                <span style={styles.eventPlayer}>{evt.playerName}</span>
                <span style={tagStyle}>{tagText}</span>
              </div>
              <div style={styles.eventDesc}>{evt.description}</div>
              <div style={styles.eventMeta}>
                <span>Pot: ${evt.potBefore} → ${evt.potAfter}</span>
                <span>{relativeTime(evt.timestamp)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function SpectatorView({ code, onLeave }) {
  const [status, setStatus] = useState('loading') // 'loading' | 'active' | 'not_found' | 'error'
  const [gameState, setGameState] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const intervalRef = useRef(null)

  const fetchSession = useCallback(async () => {
    if (!code) {
      setStatus('not_found')
      return
    }

    try {
      const { data, error } = await supabase
        .from('game_sessions')
        .select('game_state, updated_at, is_active')
        .eq('code', code.toUpperCase().trim())
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          setStatus('not_found')
        } else {
          console.error('[SpectatorView] fetch error:', error.message)
          setStatus('error')
        }
        return
      }

      if (!data) {
        setStatus('not_found')
        return
      }

      setGameState(data.game_state)
      setLastUpdated(data.updated_at)
      setStatus('active')
    } catch (err) {
      console.error('[SpectatorView] unexpected error:', err)
      setStatus('error')
    }
  }, [code])

  // Initial fetch + polling
  useEffect(() => {
    fetchSession()

    intervalRef.current = setInterval(() => {
      fetchSession()
    }, POLL_INTERVAL_MS)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [fetchSession])

  // ── Render helpers ───────────────────────────────────────────────────────

  if (status === 'loading') {
    return (
      <div style={styles.screen}>
        <SpectatorBanner code={code} onLeave={onLeave} />
        <div style={styles.centeredMessage}>
          <div style={styles.spinner} />
          <p style={styles.waitingText}>Waiting for game to start…</p>
        </div>
      </div>
    )
  }

  if (status === 'not_found') {
    return (
      <div style={styles.screen}>
        <SpectatorBanner code={code} onLeave={onLeave} />
        <div style={styles.centeredMessage}>
          <div style={styles.notFoundIcon}>🔍</div>
          <p style={styles.waitingText}>Game not found</p>
          <p style={styles.subText}>
            Double-check the code or ask the host to start sharing.
          </p>
          <button style={styles.leaveBtn} onClick={onLeave}>
            Go Back
          </button>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div style={styles.screen}>
        <SpectatorBanner code={code} onLeave={onLeave} />
        <div style={styles.centeredMessage}>
          <p style={styles.waitingText}>Connection error</p>
          <p style={styles.subText}>Could not reach the server. Retrying…</p>
        </div>
      </div>
    )
  }

  // status === 'active' — render full game state
  const { players = [], pot = 0, currentPlayerIndex = 0, events = [] } = gameState || {}
  const currentPlayer = players[currentPlayerIndex] || null

  const lastUpdatedDisplay = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null

  return (
    <div style={styles.screen}>
      <SpectatorBanner code={code} onLeave={onLeave} lastUpdated={lastUpdatedDisplay} />

      {/* Pot display */}
      <div style={styles.potCard}>
        <CupIcon size={52} />
        <div style={styles.potLabel}>THE CUP</div>
        <div style={styles.potAmount}>${pot}</div>
      </div>

      {/* Now up (read-only) */}
      {currentPlayer && (
        <div style={styles.nowUpCard}>
          <div style={styles.nowUpLeft}>
            <span
              style={{
                ...styles.playerBadge,
                background: PLAYER_COLORS[currentPlayerIndex % PLAYER_COLORS.length],
              }}
            >
              {currentPlayerIndex + 1}
            </span>
            <div>
              <div style={styles.nowUpLabel}>NOW UP</div>
              <div style={styles.nowUpName}>{currentPlayer.name}</div>
              <div style={styles.nowUpBalance}>
                Balance:{' '}
                <span
                  style={currentPlayer.balance >= 0 ? styles.positiveText : styles.negativeText}
                >
                  {currentPlayer.balance >= 0 ? '+' : ''}${currentPlayer.balance}
                </span>
              </div>
            </div>
          </div>
          <div style={styles.readOnlyPill}>READ ONLY</div>
        </div>
      )}

      {/* Scoreboard */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Scoreboard</div>
        <div style={styles.scoreboardList}>
          {players.map((player, idx) => (
            <div
              key={player.id ?? idx}
              style={{
                ...styles.scoreboardRow,
                ...(idx === currentPlayerIndex ? styles.scoreboardRowActive : {}),
              }}
            >
              <span
                style={{
                  ...styles.sbOrder,
                  ...(idx === currentPlayerIndex
                    ? { background: PLAYER_COLORS[idx % PLAYER_COLORS.length], color: '#fff' }
                    : {}),
                }}
              >
                {idx + 1}
              </span>
              <span style={styles.sbName}>{player.name}</span>
              <span
                style={player.balance >= 0 ? styles.positiveText : styles.negativeText}
              >
                {player.balance >= 0 ? '+' : ''}${player.balance}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Event log */}
      <SpectatorEventLog events={events} />

      {/* Leave button */}
      <div style={styles.leaveWrapper}>
        <button style={styles.leaveBtn} onClick={onLeave}>
          Leave Game
        </button>
      </div>
    </div>
  )
}

// ── Banner sub-component ─────────────────────────────────────────────────────

function SpectatorBanner({ code, onLeave, lastUpdated }) {
  return (
    <div style={styles.banner}>
      <div style={styles.bannerLeft}>
        <span style={styles.bannerLabel}>SPECTATING</span>
        <span style={styles.bannerCode}>{code}</span>
      </div>
      <div style={styles.bannerRight}>
        {lastUpdated && (
          <span style={styles.bannerUpdated}>Updated {lastUpdated}</span>
        )}
        <button style={styles.bannerLeaveBtn} onClick={onLeave}>
          Leave
        </button>
      </div>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = {
  screen: {
    minHeight: '100vh',
    background: '#f0ebe3',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingBottom: 40,
    fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
  },

  // Banner
  banner: {
    width: '100%',
    background: '#1e293b',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 16px',
    boxSizing: 'border-box',
    flexShrink: 0,
  },
  bannerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  bannerLabel: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.12em',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  bannerCode: {
    fontSize: 18,
    fontWeight: 800,
    letterSpacing: '0.15em',
    color: '#f59e0b',
    fontFamily: 'monospace',
  },
  bannerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  bannerUpdated: {
    fontSize: 11,
    color: '#64748b',
  },
  bannerLeaveBtn: {
    background: 'transparent',
    border: '1px solid #475569',
    color: '#94a3b8',
    borderRadius: 8,
    padding: '4px 12px',
    fontSize: 12,
    cursor: 'pointer',
    fontWeight: 600,
  },

  // Pot card
  potCard: {
    background: '#fff',
    borderRadius: 20,
    padding: '24px 32px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    marginTop: 20,
    width: '90%',
    maxWidth: 400,
    boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
    boxSizing: 'border-box',
  },
  potLabel: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.12em',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  potAmount: {
    fontSize: 40,
    fontWeight: 800,
    color: '#1e293b',
    lineHeight: 1.1,
  },

  // Now up card
  nowUpCard: {
    background: '#fff',
    borderRadius: 20,
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    width: '90%',
    maxWidth: 400,
    boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
    boxSizing: 'border-box',
  },
  nowUpLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  },
  playerBadge: {
    width: 38,
    height: 38,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: 800,
    fontSize: 16,
    flexShrink: 0,
  },
  nowUpLabel: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.12em',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  nowUpName: {
    fontSize: 18,
    fontWeight: 700,
    color: '#1e293b',
  },
  nowUpBalance: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  readOnlyPill: {
    background: '#f1f5f9',
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.1em',
    padding: '4px 10px',
    borderRadius: 99,
    textTransform: 'uppercase',
    flexShrink: 0,
  },

  // Scoreboard
  section: {
    background: '#fff',
    borderRadius: 20,
    padding: '16px 20px',
    marginTop: 12,
    width: '90%',
    maxWidth: 400,
    boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
    boxSizing: 'border-box',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.1em',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  scoreboardList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  scoreboardRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '6px 10px',
    borderRadius: 10,
    background: '#f8fafc',
  },
  scoreboardRowActive: {
    background: '#eff6ff',
    outline: '1.5px solid #bfdbfe',
  },
  sbOrder: {
    width: 26,
    height: 26,
    borderRadius: '50%',
    background: '#e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 13,
    fontWeight: 700,
    color: '#475569',
    flexShrink: 0,
  },
  sbName: {
    flex: 1,
    fontSize: 14,
    fontWeight: 600,
    color: '#1e293b',
  },

  // Event items
  eventItem: {
    borderBottom: '1px solid #f1f5f9',
    paddingBottom: 10,
    marginBottom: 10,
  },
  eventItemTop: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  eventPlayer: {
    fontWeight: 700,
    fontSize: 14,
    color: '#1e293b',
  },
  tagPositive: {
    background: '#dcfce7',
    color: '#16a34a',
    fontSize: 12,
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: 99,
  },
  tagNegative: {
    background: '#fee2e2',
    color: '#dc2626',
    fontSize: 12,
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: 99,
  },
  tagNeutral: {
    background: '#f1f5f9',
    color: '#64748b',
    fontSize: 12,
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: 99,
  },
  eventDesc: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 4,
  },
  eventMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 11,
    color: '#94a3b8',
  },

  // Text helpers
  positiveText: {
    color: '#16a34a',
    fontWeight: 700,
    fontSize: 14,
  },
  negativeText: {
    color: '#dc2626',
    fontWeight: 700,
    fontSize: 14,
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    padding: '12px 0',
  },

  // Centered states
  centeredMessage: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 60,
    padding: '0 24px',
    textAlign: 'center',
  },
  waitingText: {
    fontSize: 18,
    fontWeight: 700,
    color: '#1e293b',
    margin: 0,
  },
  subText: {
    fontSize: 14,
    color: '#64748b',
    margin: 0,
    maxWidth: 280,
  },
  notFoundIcon: {
    fontSize: 48,
  },
  spinner: {
    width: 36,
    height: 36,
    border: '3px solid #e2e8f0',
    borderTop: '3px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },

  // Leave
  leaveWrapper: {
    marginTop: 24,
    width: '90%',
    maxWidth: 400,
  },
  leaveBtn: {
    width: '100%',
    padding: '12px 0',
    background: '#fff',
    border: '1.5px solid #e2e8f0',
    borderRadius: 14,
    fontSize: 15,
    fontWeight: 600,
    color: '#64748b',
    cursor: 'pointer',
  },
}
