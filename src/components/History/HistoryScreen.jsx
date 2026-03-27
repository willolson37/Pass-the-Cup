import { useState, useEffect } from 'react'
import { POT_MODE_OPTIONS } from '../../utils/gameLogic.js'

const HISTORY_KEY = 'ptc-history'

function formatDate(isoString) {
  if (!isoString) return 'Unknown date'
  try {
    const d = new Date(isoString)
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return isoString
  }
}

function getPotModeLabel(potMode) {
  const option = POT_MODE_OPTIONS.find((o) => o.value === potMode)
  return option ? option.label : potMode || 'Custom'
}

// ── Single game card ──────────────────────────────────────────────────────────

function GameCard({ entry }) {
  const [expanded, setExpanded] = useState(false)

  const sortedPlayers = [...(entry.players || [])].sort(
    (a, b) => b.finalBalance - a.finalBalance
  )

  return (
    <div
      style={styles.card}
      onClick={() => setExpanded((v) => !v)}
      role="button"
      aria-expanded={expanded}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') setExpanded((v) => !v)
      }}
    >
      {/* Card header */}
      <div style={styles.cardHeader}>
        <div style={styles.cardHeaderLeft}>
          <div style={styles.cardDate}>{formatDate(entry.date)}</div>
          <div style={styles.cardWinner}>
            <span style={styles.trophy}>🏆</span>
            <span style={styles.winnerName}>{entry.winner || 'N/A'}</span>
          </div>
        </div>
        <div style={styles.cardHeaderRight}>
          <div style={styles.badgeRow}>
            {entry.multiplier > 1 && (
              <span style={styles.multiplierBadge}>{entry.multiplier}x</span>
            )}
            <span style={styles.potModeBadge}>{getPotModeLabel(entry.potMode)}</span>
          </div>
          <div style={styles.cardMeta}>
            {entry.players?.length ?? 0} players
            {entry.totalAtBats != null && ` · ${entry.totalAtBats} at-bats`}
          </div>
          <span style={styles.chevron}>{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Expanded player list */}
      {expanded && (
        <div style={styles.playerList} onClick={(e) => e.stopPropagation()}>
          <div style={styles.playerListDivider} />
          <div style={styles.playerListTitle}>Final Balances</div>
          {sortedPlayers.map((player, idx) => (
            <div key={player.name + idx} style={styles.playerRow}>
              <span style={styles.playerRank}>
                {idx === 0 ? '🏆' : `#${idx + 1}`}
              </span>
              <span style={styles.playerName}>{player.name}</span>
              <span
                style={
                  player.finalBalance >= 0
                    ? styles.positiveBalance
                    : styles.negativeBalance
                }
              >
                {player.finalBalance >= 0 ? '+' : ''}${player.finalBalance}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function HistoryScreen({ onBack }) {
  const [history, setHistory] = useState([])
  const [confirmClear, setConfirmClear] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        // Most recent first
        const sorted = [...parsed].sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        )
        setHistory(sorted)
      }
    } catch (err) {
      console.error('[HistoryScreen] failed to load history:', err)
      setHistory([])
    }
  }, [])

  function handleClearHistory() {
    if (!confirmClear) {
      setConfirmClear(true)
      return
    }
    try {
      localStorage.removeItem(HISTORY_KEY)
    } catch (err) {
      console.error('[HistoryScreen] failed to clear history:', err)
    }
    setHistory([])
    setConfirmClear(false)
  }

  function cancelClear() {
    setConfirmClear(false)
  }

  return (
    <div style={styles.screen}>
      {/* Top bar */}
      <div style={styles.topBar}>
        <button style={styles.backBtn} onClick={onBack}>
          ← Back
        </button>
        <h1 style={styles.screenTitle}>Game History</h1>
        <div style={styles.topBarSpacer} />
      </div>

      {/* Content */}
      <div style={styles.content}>
        {history.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>⚾</div>
            <p style={styles.emptyTitle}>No games yet</p>
            <p style={styles.emptySubtext}>
              Finished games will appear here after settlement.
            </p>
          </div>
        ) : (
          <div style={styles.gameList}>
            {history.map((entry) => (
              <GameCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}

        {/* Clear history */}
        {history.length > 0 && (
          <div style={styles.clearSection}>
            {confirmClear ? (
              <div style={styles.confirmRow}>
                <span style={styles.confirmText}>
                  Clear all {history.length} game{history.length !== 1 ? 's' : ''}?
                </span>
                <button style={styles.confirmYesBtn} onClick={handleClearHistory}>
                  Yes, clear
                </button>
                <button style={styles.confirmNoBtn} onClick={cancelClear}>
                  Cancel
                </button>
              </div>
            ) : (
              <button style={styles.clearBtn} onClick={handleClearHistory}>
                Clear History
              </button>
            )}
          </div>
        )}
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
    fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
  },

  // Top bar
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px 10px',
    background: '#f0ebe3',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  backBtn: {
    background: 'transparent',
    border: 'none',
    fontSize: 15,
    fontWeight: 600,
    color: '#3b82f6',
    cursor: 'pointer',
    padding: '4px 0',
    minWidth: 60,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: 800,
    color: '#1e293b',
    margin: 0,
    textAlign: 'center',
  },
  topBarSpacer: {
    minWidth: 60,
  },

  // Content
  content: {
    padding: '12px 16px 40px',
    maxWidth: 480,
    width: '100%',
    margin: '0 auto',
    boxSizing: 'border-box',
  },

  // Game list
  gameList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },

  // Card
  card: {
    background: '#ffffff',
    borderRadius: 20,
    padding: '16px 18px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
    cursor: 'pointer',
    userSelect: 'none',
    outline: 'none',
    transition: 'box-shadow 0.15s',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardHeaderLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    flex: 1,
    minWidth: 0,
  },
  cardDate: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: 500,
  },
  cardWinner: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  trophy: {
    fontSize: 16,
    flexShrink: 0,
  },
  winnerName: {
    fontSize: 17,
    fontWeight: 800,
    color: '#1e293b',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  cardHeaderRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 4,
    flexShrink: 0,
  },
  badgeRow: {
    display: 'flex',
    gap: 6,
    alignItems: 'center',
  },
  multiplierBadge: {
    background: '#fef3c7',
    color: '#d97706',
    fontSize: 11,
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: 99,
    letterSpacing: '0.04em',
  },
  potModeBadge: {
    background: '#eff6ff',
    color: '#3b82f6',
    fontSize: 11,
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: 99,
    whiteSpace: 'nowrap',
  },
  cardMeta: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'right',
  },
  chevron: {
    fontSize: 11,
    color: '#cbd5e1',
    marginTop: 2,
  },

  // Player list (expanded)
  playerListDivider: {
    height: 1,
    background: '#f1f5f9',
    margin: '12px 0 10px',
  },
  playerListTitle: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.1em',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  playerList: {
    cursor: 'default',
  },
  playerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '6px 0',
    borderBottom: '1px solid #f8fafc',
  },
  playerRank: {
    width: 28,
    fontSize: 14,
    textAlign: 'center',
    flexShrink: 0,
  },
  playerName: {
    flex: 1,
    fontSize: 14,
    fontWeight: 600,
    color: '#1e293b',
  },
  positiveBalance: {
    fontSize: 14,
    fontWeight: 700,
    color: '#16a34a',
  },
  negativeBalance: {
    fontSize: 14,
    fontWeight: 700,
    color: '#dc2626',
  },

  // Empty state
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 10,
    textAlign: 'center',
  },
  emptyIcon: {
    fontSize: 52,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 800,
    color: '#1e293b',
    margin: 0,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94a3b8',
    margin: 0,
    maxWidth: 260,
  },

  // Clear history
  clearSection: {
    marginTop: 28,
    display: 'flex',
    justifyContent: 'center',
  },
  clearBtn: {
    background: 'transparent',
    border: '1.5px solid #fca5a5',
    color: '#ef4444',
    borderRadius: 12,
    padding: '10px 28px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  confirmRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  confirmText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: 600,
  },
  confirmYesBtn: {
    background: '#ef4444',
    border: 'none',
    color: '#fff',
    borderRadius: 10,
    padding: '8px 18px',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
  },
  confirmNoBtn: {
    background: '#f1f5f9',
    border: 'none',
    color: '#475569',
    borderRadius: 10,
    padding: '8px 18px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
}
