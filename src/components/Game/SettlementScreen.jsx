import { useState } from 'react'
import { calculateSettlement, applyPotMode } from '../../utils/gameLogic.js'
import CupIcon from '../CupIcon.jsx'

const PLAYER_COLORS = [
  '#3b82f6', '#f97316', '#22c55e', '#7c3aed',
  '#ec4899', '#14b8a6', '#f59e0b', '#6366f1', '#ef4444',
]

function TrophyIcon({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 5 L9 15 Q9 21 14 21 Q19 21 19 15 L19 5 Z"
        fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
      <path d="M9 7 Q5 7 5 11 Q5 15 9 15"
        fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
      <path d="M19 7 Q23 7 23 11 Q23 15 19 15"
        fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
      <rect x="12.5" y="21" width="3" height="3.5" fill="#d97706" />
      <rect x="9" y="24.5" width="10" height="2" rx="1" fill="#d97706" />
      <text x="14" y="14" dominantBaseline="central" textAnchor="middle"
        fontSize="7" fill="white" fontWeight="900">★</text>
    </svg>
  )
}

function RankBadge({ rank }) {
  if (rank === 1) return <span className="rank-badge rank-1">1st</span>
  if (rank === 2) return <span className="rank-badge rank-2">2nd</span>
  if (rank === 3) return <span className="rank-badge rank-3">3rd</span>
  return <span className="rank-badge">{rank}th</span>
}

function buildShareText(ranked, transactions, potWinnerDesc) {
  const lines = ['Pass the Cup — Final Results', '']
  if (potWinnerDesc) lines.push(potWinnerDesc, '')
  lines.push('Standings:')
  ranked.forEach(p => {
    const bal = p.balance >= 0 ? `+$${p.balance}` : `-$${Math.abs(p.balance)}`
    lines.push(`  ${p.rank}. ${p.name} ${bal}`)
  })
  if (transactions.length > 0) {
    lines.push('', 'Settle Up:')
    transactions.forEach(t => {
      const amt = t.amount % 1 === 0 ? t.amount : t.amount.toFixed(2)
      lines.push(`  ${t.from} pays ${t.to} $${amt}`)
    })
  }
  return lines.join('\n')
}

export default function SettlementScreen({ gameState, onNewGame, onResume }) {
  const [shareFeedback, setShareFeedback] = useState('')
  const { players, pot } = gameState

  const { adjustedPlayers, potWinnerDesc } = applyPotMode(gameState)

  const ranked = [...adjustedPlayers]
    .sort((a, b) => b.balance - a.balance)
    .map((p, i) => ({ ...p, rank: i + 1 }))

  const transactions = calculateSettlement(adjustedPlayers)

  // Build a venmo lookup from original players
  const venmoMap = {}
  players.forEach(p => { if (p.venmo) venmoMap[p.name] = p.venmo })

  function handleShare() {
    const text = buildShareText(ranked, transactions, potWinnerDesc)
    if (navigator.share) {
      navigator.share({ title: 'Pass the Cup Results', text }).catch(() => {})
    } else {
      navigator.clipboard?.writeText(text).then(() => {
        setShareFeedback('Copied to clipboard!')
        setTimeout(() => setShareFeedback(''), 2500)
      }).catch(() => {})
    }
  }

  function venmoPayUrl(recipientVenmo, amount) {
    const cents = Math.round(amount * 100)
    const dollars = (cents / 100).toFixed(2)
    return `venmo://paycharge?txn=pay&recipients=${encodeURIComponent(recipientVenmo)}&amount=${dollars}&note=Pass%20the%20Cup`
  }

  return (
    <div className="screen settlement-screen">
      {/* Header */}
      <div className="settlement-header">
        <div className="settlement-icon-wrap">
          <TrophyIcon size={36} />
        </div>
        <h1 className="settlement-title">Game Over</h1>
        <p className="settlement-subtitle">Final Results</p>
      </div>

      {/* Pot distribution callout */}
      {pot > 0 && potWinnerDesc && (
        <div className="pot-outcome-banner">
          <CupIcon size={20} />
          <span>{potWinnerDesc}</span>
        </div>
      )}

      {/* Final standings */}
      <div className="settlement-card">
        <div className="section-label">Final Standings</div>
        <div className="standings-list">
          {ranked.map(player => {
            const colorIdx = players.findIndex(p => p.id === player.id)
            const color = PLAYER_COLORS[colorIdx % PLAYER_COLORS.length]
            const isWinner = player.rank === 1
            return (
              <div key={player.id} className={`standing-row${isWinner ? ' standing-winner' : ''}`}>
                <RankBadge rank={player.rank} />
                <span className="standing-dot" style={{ background: color }} />
                <span className="standing-name">{player.name}</span>
                {isWinner && <TrophyIcon size={18} />}
                <span className={`standing-balance ${player.balance >= 0 ? 'positive' : 'negative'}`}>
                  {player.balance >= 0 ? '+' : ''}${player.balance}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Settlement transactions */}
      <div className="settlement-card">
        <div className="section-label">Settle Up</div>
        {transactions.length === 0 ? (
          <p className="settle-all-square">All square — nobody owes anything!</p>
        ) : (
          <div className="transactions-list">
            {transactions.map((t, i) => {
              const recipientVenmo = venmoMap[t.to]
              const amt = t.amount % 1 === 0 ? t.amount : t.amount.toFixed(2)
              return (
                <div key={i} className="transaction-row">
                  <div className="transaction-info">
                    <span className="transaction-from">{t.from}</span>
                    <span className="transaction-arrow">pays</span>
                    <span className="transaction-to">{t.to}</span>
                    <span className="transaction-amount">${amt}</span>
                  </div>
                  {recipientVenmo && (
                    <a
                      className="venmo-pay-btn"
                      href={venmoPayUrl(recipientVenmo, t.amount)}
                    >
                      Pay on Venmo
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Share */}
      <button className="share-results-btn" onClick={handleShare}>
        {shareFeedback || 'Share Results'}
      </button>

      {/* Actions */}
      <div className="settlement-actions">
        <button className="btn-start" onClick={() => onNewGame(gameState)}>
          New Game
        </button>
        <button className="back-link settlement-resume" onClick={onResume}>
          ← Resume game
        </button>
      </div>
    </div>
  )
}
