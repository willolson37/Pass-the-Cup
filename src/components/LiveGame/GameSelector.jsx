import { useState, useEffect } from 'react'
import { fetchTodaysGames } from '../../utils/mlbApi.js'
import BaseballIcon from '../BaseballIcon.jsx'

function GameCard({ game, onSelect }) {
  const isSelectable = game.status === 'Live' || game.status === 'Preview'

  return (
    <button
      className={`game-card btn${isSelectable ? ' game-card-selectable' : ' game-card-final'}`}
      onClick={() => isSelectable && onSelect(game)}
      disabled={!isSelectable}
    >
      <div className="game-card-teams">
        <span className="game-away">{game.awayTeamAbbr}</span>
        <span className="game-vs">@</span>
        <span className="game-home">{game.homeTeamAbbr}</span>
      </div>
      {(game.status === 'Live' || game.status === 'Final') && (
        <div className="game-score">
          {game.awayScore} – {game.homeScore}
        </div>
      )}
      <div className="game-status-row">
        {game.status === 'Live' && (
          <>
            <span className="live-dot" />
            <span className="game-inning">
              {game.inningHalf === 'Bottom' ? '▼' : '▲'} {game.inning}
            </span>
          </>
        )}
        {game.status === 'Preview' && (
          <span className="game-preview-label">{game.detailedStatus || 'Scheduled'}</span>
        )}
        {game.status === 'Final' && (
          <span className="game-final-label">FINAL</span>
        )}
      </div>
    </button>
  )
}

function TeamSelectorOverlay({ game, onConfirm, onCancel }) {
  return (
    <div className="overlay-backdrop" onClick={onCancel}>
      <div className="team-selector" onClick={(e) => e.stopPropagation()}>
        <h3 className="team-selector-title">Track which team's at-bats?</h3>
        <p className="team-selector-sub">
          {game.awayTeam} @ {game.homeTeam}
        </p>
        <div className="team-selector-btns">
          <button
            className="btn btn-outline"
            onClick={() => onConfirm({ ...game, trackTeam: 'away' })}
          >
            {game.awayTeam}
            <span className="track-hint">Away (top innings)</span>
          </button>
          <button
            className="btn btn-outline"
            onClick={() => onConfirm({ ...game, trackTeam: 'home' })}
          >
            {game.homeTeam}
            <span className="track-hint">Home (bottom innings)</span>
          </button>
          <button
            className="btn btn-primary"
            onClick={() => onConfirm({ ...game, trackTeam: 'both' })}
          >
            Both Teams
            <span className="track-hint">All at-bats</span>
          </button>
        </div>
        <button className="btn btn-outline btn-sm cancel-btn" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  )
}

export default function GameSelector({ playerNames, onSelectGame, onBack }) {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedGame, setSelectedGame] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchTodaysGames()
      .then((data) => {
        if (!cancelled) {
          setGames(data)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Failed to load games')
          setLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [])

  function handleConfirmGame(gameWithTrack) {
    setSelectedGame(null)
    onSelectGame(gameWithTrack)
  }

  const liveGames = games.filter((g) => g.status === 'Live')
  const previewGames = games.filter((g) => g.status === 'Preview')
  const finalGames = games.filter((g) => g.status === 'Final')

  return (
    <div className="screen selector-screen">
      <div className="screen-header">
        <button className="back-link" onClick={onBack}>
          ← Back
        </button>
        <div />
      </div>

      {/* Header card */}
      <div className="card" style={{ textAlign: 'center', padding: '24px 20px 20px' }}>
        <div className="cup-icon-wrap">
          <BaseballIcon size={56} />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111827', marginBottom: 4 }}>
          Select a Game
        </h2>
        <p style={{ fontSize: 13, color: '#6b7280' }}>
          {playerNames.length} players ready — pick a game to track
        </p>
      </div>

      {loading && (
        <div className="loading-container">
          <div className="loading-spinner" />
          <p className="loading-text">Loading today's games…</p>
        </div>
      )}

      {error && (
        <div className="error-card">
          <p className="error-text">Failed to load games: {error}</p>
          <button
            className="btn btn-primary"
            onClick={() => {
              setLoading(true)
              setError(null)
              fetchTodaysGames()
                .then((data) => { setGames(data); setLoading(false) })
                .catch((err) => { setError(err.message); setLoading(false) })
            }}
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          {liveGames.length > 0 && (
            <div className="games-group">
              <div className="games-group-label">
                <span className="live-dot" /> Live Now
              </div>
              {liveGames.map((g) => (
                <GameCard key={g.gamePk} game={g} onSelect={setSelectedGame} />
              ))}
            </div>
          )}

          {previewGames.length > 0 && (
            <div className="games-group">
              <div className="games-group-label">Upcoming</div>
              {previewGames.map((g) => (
                <GameCard key={g.gamePk} game={g} onSelect={setSelectedGame} />
              ))}
            </div>
          )}

          {finalGames.length > 0 && (
            <div className="games-group">
              <div className="games-group-label">Final</div>
              {finalGames.map((g) => (
                <GameCard key={g.gamePk} game={g} onSelect={setSelectedGame} />
              ))}
            </div>
          )}

          {games.length === 0 && (
            <div className="empty-state">
              <p>No games scheduled today.</p>
              <p className="muted">Check back when the season is underway.</p>
            </div>
          )}

          {liveGames.length === 0 && games.length > 0 && (
            <div className="info-banner">
              No live games right now — you can track an upcoming game and it will start automatically
            </div>
          )}
        </>
      )}

      {selectedGame && (
        <TeamSelectorOverlay
          game={selectedGame}
          onConfirm={handleConfirmGame}
          onCancel={() => setSelectedGame(null)}
        />
      )}
    </div>
  )
}
