import { useState } from 'react'
import CupIcon from '../CupIcon.jsx'
import { POT_MODE_OPTIONS } from '../../utils/gameLogic.js'

const MAX_PLAYERS = 9
const MIN_PLAYERS = 2

const PLAYER_COLORS = [
  '#3b82f6', // blue
  '#f97316', // orange
  '#22c55e', // green
  '#7c3aed', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f59e0b', // amber
  '#6366f1', // indigo
  '#ef4444', // red
]

export default function PlayerSetup({ mode, onComplete, onBack }) {
  const [players, setPlayers] = useState(['', ''])
  const [inputError, setInputError] = useState('')
  const [potMode, setPotMode] = useState(null)

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
    onComplete(trimmed, potMode)
  }

  const canStart = players.length >= MIN_PLAYERS && players.every((p) => p.trim() !== '') && potMode !== null

  return (
    <div className="screen setup-screen">
      {/* Back link */}
      <div className="screen-header">
        <button className="back-link" onClick={onBack}>
          ← Back
        </button>
        <div />
      </div>

      {/* Card */}
      <div className="setup-card">
        <div className="cup-icon-wrap">
          <CupIcon size={72} />
        </div>

        <h2 className="setup-card-title">
          {mode === 'live' ? 'Live Game Setup' : 'Manual Game'}
        </h2>
        <p className="setup-card-subtitle">Enter players in passing order</p>

        {mode === 'live' && (
          <div className="info-banner">
            You'll select a live MLB game on the next screen
          </div>
        )}

        <div className="players-list">
          {players.map((name, idx) => (
            <div key={idx} className="player-row">
              <span
                className="player-number"
                data-index={idx % PLAYER_COLORS.length}
                style={{ background: PLAYER_COLORS[idx % PLAYER_COLORS.length] }}
              >
                {idx + 1}
              </span>
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
                  className="remove-btn"
                  onClick={() => removePlayer(idx)}
                  aria-label={`Remove player ${idx + 1}`}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>

        {inputError && <p className="input-error">{inputError}</p>}

        {players.length < MAX_PLAYERS && (
          <button className="btn-add-player" onClick={addPlayer}>
            + Add Player
          </button>
        )}

        {/* End Game Rule */}
        <div className="pot-mode-section">
          <div className="pot-mode-heading">End Game Rule</div>
          <div className="pot-mode-grid">
            {POT_MODE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`pot-mode-card${potMode === opt.value ? ' selected' : ''}`}
                onClick={() => setPotMode(opt.value)}
                type="button"
              >
                <div className="pot-mode-name">{opt.label}</div>
                <div className="pot-mode-desc">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <button
          className="btn-start"
          onClick={handleStart}
          disabled={!canStart}
        >
          {mode === 'live' ? 'Continue →' : 'Start Game'}
        </button>
      </div>
    </div>
  )
}
