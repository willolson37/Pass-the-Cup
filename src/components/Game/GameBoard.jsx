import AtBatControls from './AtBatControls.jsx'
import EventLog from './EventLog.jsx'

export default function GameBoard({ gameState, onAtBat, onReset, liveConfig, liveStatus }) {
  const { players, pot, currentPlayerIndex, events } = gameState
  const currentPlayer = players[currentPlayerIndex]
  const isLive = !!liveConfig

  return (
    <div className="screen game-screen">
      {/* Header */}
      <div className="game-header">
        <h1 className="game-title">Pass the Cup</h1>
        <button className="btn btn-danger btn-sm" onClick={onReset}>
          End Game
        </button>
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
      <div className="pot-display">
        <div className="pot-label">POT</div>
        <div className="pot-amount">${pot}</div>
        <div className="pot-icon">🏆</div>
      </div>

      {/* Current player card */}
      <div className="player-card active">
        <div className="player-card-label">UP NEXT</div>
        <div className="player-card-name">{currentPlayer.name}</div>
        <div className="player-card-balance">
          Balance:{' '}
          <span className={currentPlayer.balance >= 0 ? 'positive' : 'negative'}>
            {currentPlayer.balance >= 0 ? '+' : ''}${currentPlayer.balance}
          </span>
        </div>
      </div>

      {/* Scoreboard */}
      <div className="scoreboard card">
        <div className="scoreboard-title">Scoreboard</div>
        <div className="scoreboard-list">
          {players.map((player, idx) => (
            <div
              key={player.id}
              className={`scoreboard-row${idx === currentPlayerIndex ? ' current' : ''}`}
            >
              <span className="sb-order">{idx + 1}</span>
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
        <div className="live-waiting card">
          <span className="live-dot" />
          <span>Waiting for next at-bat…</span>
        </div>
      )}

      {/* Event log */}
      <EventLog events={events} maxVisible={20} />
    </div>
  )
}
