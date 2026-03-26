import { useState } from 'react'

const MAX_PLAYERS = 9
const MIN_PLAYERS = 2

export default function PlayerSetup({ mode, onComplete, onBack }) {
  const [players, setPlayers] = useState(['', ''])
  const [inputError, setInputError] = useState('')

  function handleNameChange(idx, value) {
    setPlayers((prev) => prev.map((p, i) => (i === idx ? value : p)))
    setInputError('')
  }

  function addPlayer() {
    if (players.length >= MAX_PLAYERS) return
    setPlayers((prev) => [...prev, ''])
  }

  function removePlayer(idx) {
    if (players.length <= MIN_PLAYERS) return
    setPlayers((prev) => prev.filter((_, i) => i !== idx))
  }

  function handleStart() {
    const trimmed = players.map((p) => p.trim())
    const empty = trimmed.some((p) => p === '')
    if (empty) {
      setInputError('All player names must be filled in.')
      return
    }
    const hasDupes = new Set(trimmed).size !== trimmed.length
    if (hasDupes) {
      setInputError('Player names must be unique.')
      return
    }
    onComplete(trimmed)
  }

  const canStart = players.length >= MIN_PLAYERS && players.every((p) => p.trim() !== '')

  return (
    <div className="screen setup-screen">
      <div className="screen-header">
        <button className="btn btn-outline btn-sm" onClick={onBack}>
          ← Back
        </button>
        <h2 className="screen-title">Player Setup</h2>
        <div style={{ width: 60 }} />
      </div>

      <p className="setup-subtitle">
        Enter players in passing order ({MIN_PLAYERS}–{MAX_PLAYERS} players)
      </p>

      {mode === 'live' && (
        <div className="info-banner">
          📡 You'll select a live MLB game on the next screen
        </div>
      )}

      <div className="players-list">
        {players.map((name, idx) => (
          <div key={idx} className="player-input-row">
            <span className="player-order-num">{idx + 1}</span>
            <input
              className="player-input"
              type="text"
              placeholder={`Player ${idx + 1} name`}
              value={name}
              onChange={(e) => handleNameChange(idx, e.target.value)}
              maxLength={24}
              autoCapitalize="words"
            />
            {players.length > MIN_PLAYERS && (
              <button
                className="btn btn-danger btn-sm remove-btn"
                onClick={() => removePlayer(idx)}
                aria-label={`Remove player ${idx + 1}`}
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      {inputError && <p className="input-error">{inputError}</p>}

      <div className="setup-actions">
        {players.length < MAX_PLAYERS && (
          <button className="btn btn-outline" onClick={addPlayer}>
            + Add Player
          </button>
        )}

        <button
          className="btn btn-primary"
          onClick={handleStart}
          disabled={!canStart}
        >
          {mode === 'live' ? 'Next — Select Game →' : 'Start Game'}
        </button>
      </div>
    </div>
  )
}
