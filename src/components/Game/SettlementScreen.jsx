import { calculateSettlement, applyPotMode } from '../../utils/gameLogic.js'
import CupIcon from '../CupIcon.jsx'

const PLAYER_COLORS = [
  '#3b82f6', '#f97316', '#22c55e', '#7c3aed',
  '#ec4899', '#14b8a6', '#f59e0b', '#6366f1', '#ef4444',
]

function TrophyIcon({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
      {/* Cup */}
      <path d="M9 5 L9 15 Q9 21 14 21 Q19 21 19 15 L19 5 Z"
        fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
      {/* Left handle */}
      <path d="M9 7 Q5 7 5 11 Q5 15 9 15"
        fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
      {/* Right handle */}
      <path d="M19 7 Q23 7 23 11 Q23 15 19 15"
        fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
      {/* Stem */}
      <rect x="12.5" y="21" width="3" height="3.5" fill="#d97706" />
      {/* Base */}
      <rect x="9" y="24.5" width="10" height="2" rx="1" fill="#d97706" />
      {/* Star highlight */}
      <text x="14" y="14" dominantBaseline="central" textAnchor="middle"
        fontSize="7" fill="white" fontWeight="900">★</text>
    </svg>
  )
}

function RankBadge({ rank }) {
  if (rank === 1) return (
    <span className="rank-badge rank-1">1st</span>
  )
  if (rank === 2) return (
    <span className="rank-badge rank-2">2nd</span>
  )
  if (rank === 3) return (
    <span className="rank-badge rank-3">3rd</span>
  )
  return <span className="rank-badge">{rank}th</span>
}

export default function SettlementScreen({ gameState, onNewGame, onResume }) {
  const { players, pot } = gameState

  // Apply pot distribution rule first
  const { adjustedPlayers, potWinnerDesc } = applyPotMode(gameState)

  // Sort adjusted players best to worst for standings
  const ranked = [...adjustedPlayers]
    .sort((a, b) => b.balance - a.balance)
    .map((p, i) => ({ ...p, rank: i + 1 }))

  const transactions = calculateSettlement(adjustedPlayers)

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
          {ranked.map((player) => {
            const colorIdx = players.findIndex(p => p.id === player.id)
            const color = PLAYER_COLORS[colorIdx % PLAYER_COLORS.length]
            const isWinner = player.rank === 1
            return (
              <div key={player.id} className={`standing-row${isWinner ? ' standing-winner' : ''}`}>
                <RankBadge rank={player.rank} />
                <span
                  className="standing-dot"
                  style={{ background: color }}
                />
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
            {transactions.map((t, i) => (
              <div key={i} className="transaction-row">
                <span className="transaction-from">{t.from}</span>
                <span className="transaction-arrow">pays</span>
                <span className="transaction-to">{t.to}</span>
                <span className="transaction-amount">${t.amount % 1 === 0 ? t.amount : t.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="settlement-actions">
        <button className="btn-start" onClick={onNewGame}>
          New Game
        </button>
        <button className="back-link settlement-resume" onClick={onResume}>
          ← Resume game
        </button>
      </div>
    </div>
  )
}
