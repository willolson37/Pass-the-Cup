import { useState } from 'react'
import AtBatControls from './AtBatControls.jsx'
import EventLog from './EventLog.jsx'
import CupIcon from '../CupIcon.jsx'
import SettlementScreen from './SettlementScreen.jsx'

const PLAYER_COLORS = [
  '#3b82f6', '#f97316', '#22c55e', '#7c3aed',
  '#ec4899', '#14b8a6', '#f59e0b', '#6366f1', '#ef4444',
]

export default function GameBoard({ gameState, onAtBat, onReset, liveConfig, liveStatus }) {
  const [showSettlement, setShowSettlement] = useState(false)
  const { players, pot, currentPlayerIndex, events, multiplier } = gameState
  const currentPlayer = players[currentPlayerIndex]
  const isLive = !!liveConfig

  if (showSettlement) {
    return (
      <SettlementScreen
        gameState={gameState}
        onNewGame={onReset}
        onResume={() => setShowSettlement(false)}
      />
    )
  }

  return (
    <div className="screen game-screen">
      {/* Header */}
      <div className="game-header">
        <h1 className="game-title">Pass the Cup</h1>
        <div className="game-header-right">
          {multiplier > 1 && (
            <span className="multiplier-badge">{multiplier}x</span>
          )}
          <button className="btn btn-danger btn-sm" onClick={() => setShowSettlement(true)}>
            End Game
          </button>
        </div>
      </div>

      {/* Live indicator bar */}
      {isLive && liveStatus && (
        <div className="live-banner">
          <span className="live-dot" />
          <span className="live-banner-text">
            {liveStatus.gameStatus === 'Final' ? (
              <strong>FINAL</strong>
            ) : (
              <>
                <strong>LIVE</strong>
                {liveConfig.awayTeamAbbr && liveConfig.homeTeamAbbr && (
                  <> — {liveConfig.awayTeamAbbr} vs {liveConfig.homeTeamAbbr}</>
                )}
                {liveStatus.currentInning && (
                  <> | {liveStatus.currentHalfInning === 'bottom' ? '▼' : '▲'} {liveStatus.currentInning}</>
                )}
                {liveStatus.currentBatter && (
                  <> | {liveStatus.currentBatter} up</>
                )}
              </>
            )}
          </span>
          {liveStatus.isPolling && liveStatus.gameStatus !== 'Final' && (
            <span className="live-polling-dot" title="Polling for updates" />
          )}
        </div>
      )}

      {/* Pot display */}
      <div className="pot-card">
        <CupIcon size={56} />
        <div className="pot-label">THE CUP</div>
        <div className="pot-amount">${pot}</div>
      </div>

      {/* Current player card */}
      <div className="player-card active">
        <div className="player-card-left">
          <span
            className="player-number"
            style={{ background: PLAYER_COLORS[currentPlayerIndex % PLAYER_COLORS.length] }}
          >
            {currentPlayerIndex + 1}
          </span>
          <div className="player-card-info">
            <div className="player-card-label">NOW UP</div>
            <div className="player-card-name">{currentPlayer.name}</div>
            <div className="player-card-balance">
              Balance:{' '}
              <span className={currentPlayer.balance >= 0 ? 'positive' : 'negative'}>
                {currentPlayer.balance >= 0 ? '+' : ''}${currentPlayer.balance}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Scoreboard */}
      <div className="scoreboard">
        <div className="scoreboard-title">Scoreboard</div>
        <div className="scoreboard-list">
          {players.map((player, idx) => (
            <div
              key={player.id}
              className={`scoreboard-row${idx === currentPlayerIndex ? ' current' : ''}`}
            >
              <span
                className="sb-order"
                style={
                  idx === currentPlayerIndex
                    ? { background: PLAYER_COLORS[idx % PLAYER_COLORS.length], color: '#ffffff' }
                    : {}
                }
              >
                {idx + 1}
              </span>
              <span className="sb-name">{player.name}</span>
              <span className={`sb-balance ${player.balance >= 0 ? 'positive' : 'negative'}`}>
                {player.balance >= 0 ? '+' : ''}${player.balance}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* At-bat controls or live indicator */}
      {!isLive ? (
        <AtBatControls onAtBat={onAtBat} disabled={false} />
      ) : (
        <div className="live-waiting">
          <span className="live-dot" />
          <span>Waiting for next at-bat…</span>
        </div>
      )}

      {/* Event log */}
      <EventLog events={events} maxVisible={20} />
    </div>
  )
}
