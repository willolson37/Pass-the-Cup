import { useState, useCallback } from 'react'
import { useMLBLive } from '../../hooks/useMLBLive.js'
import GameBoard from '../Game/GameBoard.jsx'
import AtBatControls from '../Game/AtBatControls.jsx'

export default function LiveGameBoard({ gameState, liveConfig, onAtBat, onReset, playerNames }) {
  const [showManual, setShowManual] = useState(false)
  const [retryKey, setRetryKey] = useState(0)

  const handleNewPlay = useCallback(
    (outcome, mlbContext) => {
      onAtBat(outcome, mlbContext)
    },
    [onAtBat],
  )

  const liveStatus = useMLBLive({
    gamePk: liveConfig.gamePk,
    trackTeam: liveConfig.trackTeam,
    onNewPlay: handleNewPlay,
    enabled: true,
    intervalMs: 15000,
    // retryKey is used to re-mount the hook on retry
    _retryKey: retryKey,
  })

  const { isPolling, error, gameStatus, currentBatter, currentInning, currentHalfInning } = liveStatus

  const isGameFinal = gameStatus === 'Final'

  return (
    <div className="live-game-wrapper">
      {/* Top live status banner */}
      <div className={`live-banner top-banner${isGameFinal ? ' live-banner-final' : ''}`}>
        {isGameFinal ? (
          <span className="live-banner-text">
            <strong>GAME OVER</strong> — {liveConfig.awayTeamAbbr} @ {liveConfig.homeTeamAbbr} is Final
          </span>
        ) : error ? (
          <span className="live-banner-text live-banner-error">
            ⚠ Connection error — retrying…
          </span>
        ) : (
          <span className="live-banner-text">
            <span className="live-dot" />
            <strong> LIVE</strong>
            {liveConfig.awayTeamAbbr && liveConfig.homeTeamAbbr && (
              <> — {liveConfig.awayTeamAbbr} @ {liveConfig.homeTeamAbbr}</>
            )}
            {currentInning && (
              <>
                {' '}| {currentHalfInning === 'bottom' ? '▼' : '▲'} {currentInning}
              </>
            )}
            {currentBatter && <> | {currentBatter} up</>}
          </span>
        )}
      </div>

      {/* Error state with retry */}
      {error && (
        <div className="error-card card" style={{ margin: '8px 16px' }}>
          <p className="error-text">{error}</p>
          <button
            className="btn btn-primary"
            onClick={() => setRetryKey((k) => k + 1)}
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Main game board — live mode (no AtBatControls inline) */}
      <GameBoard
        gameState={gameState}
        onAtBat={onAtBat}
        onReset={onReset}
        liveConfig={liveConfig}
        liveStatus={{
          isPolling,
          error,
          gameStatus,
          currentBatter,
          currentInning,
          currentHalfInning,
        }}
      />

      {/* Manual Override section */}
      <div className="manual-override card" style={{ margin: '0 0 16px' }}>
        <button
          className="btn btn-outline manual-override-toggle"
          onClick={() => setShowManual((v) => !v)}
        >
          {showManual ? '▲ Hide' : '▼ Show'} Manual Override
        </button>
        {showManual && (
          <div className="manual-override-body">
            <p className="manual-override-hint">
              Use this to correct missed plays or enter results manually.
            </p>
            <AtBatControls onAtBat={onAtBat} disabled={false} />
          </div>
        )}
      </div>
    </div>
  )
}
