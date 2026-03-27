import { useState } from 'react'
import CupIcon from '../CupIcon.jsx'
import { POT_MODE_OPTIONS, DEFAULT_HOUSE_RULES } from '../../utils/gameLogic.js'

const MAX_PLAYERS = 9
const MIN_PLAYERS = 2

const PLAYER_COLORS = [
  '#3b82f6', '#f97316', '#22c55e', '#7c3aed',
  '#ec4899', '#14b8a6', '#f59e0b', '#6366f1', '#ef4444',
]

const RULE_LABELS = [
  { key: 'single',    label: 'Single',      type: 'take' },
  { key: 'double',    label: 'Double',      type: 'take' },
  { key: 'triple',    label: 'Triple',      type: 'take' },
  { key: 'out',       label: 'Out',         type: 'add'  },
  { key: 'strikeout', label: 'Strikeout',   type: 'add'  },
  { key: 'doublePly', label: 'Double Play', type: 'add'  },
  { key: 'error',     label: 'Error',       type: 'add'  },
]

export default function PlayerSetup({ mode, onComplete, onBack }) {
  const [players, setPlayers] = useState([{ name: '', venmo: '' }, { name: '', venmo: '' }])
  const [inputError, setInputError] = useState('')
  const [potMode, setPotMode] = useState(null)
  const [multiplier, setMultiplier] = useState(1)
  const [showVenmo, setShowVenmo] = useState(false)
  const [showHouseRules, setShowHouseRules] = useState(false)
  const [houseRules, setHouseRules] = useState({ ...DEFAULT_HOUSE_RULES })

  function handleNameChange(idx, value) {
    setPlayers(prev => prev.map((p, i) => i === idx ? { ...p, name: value } : p))
    setInputError('')
  }

  function handleVenmoChange(idx, value) {
    // Strip leading @ so we store just the username
    const handle = value.startsWith('@') ? value.slice(1) : value
    setPlayers(prev => prev.map((p, i) => i === idx ? { ...p, venmo: handle } : p))
  }

  function addPlayer() {
    if (players.length >= MAX_PLAYERS) return
    setPlayers(prev => [...prev, { name: '', venmo: '' }])
  }

  function removePlayer(idx) {
    if (players.length <= MIN_PLAYERS) return
    setPlayers(prev => prev.filter((_, i) => i !== idx))
  }

  function adjustRule(key, delta) {
    setHouseRules(prev => ({
      ...prev,
      [key]: Math.max(1, Math.min(10, (prev[key] || DEFAULT_HOUSE_RULES[key]) + delta)),
    }))
  }

  function handleStart() {
    const trimmedPlayers = players.map(p => ({
      name: p.name.trim(),
      venmo: p.venmo.trim() || null,
    }))
    if (trimmedPlayers.some(p => p.name === '')) {
      setInputError('All player names must be filled in.')
      return
    }
    const names = trimmedPlayers.map(p => p.name)
    if (new Set(names).size !== names.length) {
      setInputError('Player names must be unique.')
      return
    }
    // Only pass houseRules if they differ from defaults
    const rulesChanged = RULE_LABELS.some(r => houseRules[r.key] !== DEFAULT_HOUSE_RULES[r.key])
    onComplete(trimmedPlayers, potMode, multiplier, rulesChanged ? houseRules : null)
  }

  const canStart = players.length >= MIN_PLAYERS &&
    players.every(p => p.name.trim() !== '') &&
    potMode !== null

  return (
    <div className="screen setup-screen">
      <div className="screen-header">
        <button className="back-link" onClick={onBack}>← Back</button>
        <div />
      </div>

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

        {/* Players */}
        <div className="players-list">
          {players.map((player, idx) => (
            <div key={idx} className="player-row-wrap">
              <div className="player-row">
                <span
                  className="player-number"
                  style={{ background: PLAYER_COLORS[idx % PLAYER_COLORS.length] }}
                >
                  {idx + 1}
                </span>
                <input
                  className="player-input"
                  type="text"
                  placeholder={`Player ${idx + 1} name`}
                  value={player.name}
                  onChange={e => handleNameChange(idx, e.target.value)}
                  maxLength={24}
                  autoCapitalize="words"
                />
                {players.length > MIN_PLAYERS && (
                  <button
                    className="remove-btn"
                    onClick={() => removePlayer(idx)}
                    aria-label={`Remove player ${idx + 1}`}
                  >×</button>
                )}
              </div>
              {showVenmo && (
                <div className="venmo-row">
                  <span className="venmo-at">@</span>
                  <input
                    className="player-input venmo-input"
                    type="text"
                    placeholder="Venmo username (optional)"
                    value={player.venmo}
                    onChange={e => handleVenmoChange(idx, e.target.value)}
                    maxLength={32}
                    autoCapitalize="none"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {inputError && <p className="input-error">{inputError}</p>}

        <div className="setup-row-actions">
          {players.length < MAX_PLAYERS && (
            <button className="btn-add-player" onClick={addPlayer}>+ Add Player</button>
          )}
          <button
            className={`btn-toggle-venmo${showVenmo ? ' active' : ''}`}
            onClick={() => setShowVenmo(v => !v)}
            type="button"
          >
            {showVenmo ? 'Hide Venmo' : '+ Venmo'}
          </button>
        </div>

        {/* Stakes */}
        <div className="pot-mode-section">
          <div className="pot-mode-heading">Stakes</div>
          <div className="multiplier-row">
            {[1, 2, 5, 10].map(val => (
              <button
                key={val}
                className={`multiplier-btn${multiplier === val ? ' selected' : ''}`}
                onClick={() => setMultiplier(val)}
                type="button"
              >
                {val === 1 ? '1x' : `${val}x`}
              </button>
            ))}
          </div>
          {multiplier > 1 && (
            <p className="multiplier-note">
              Ante ${multiplier} · Single ${houseRules.single * multiplier} · Double ${houseRules.double * multiplier} · Triple ${houseRules.triple * multiplier}
            </p>
          )}
        </div>

        {/* End Game Rule */}
        <div className="pot-mode-section">
          <div className="pot-mode-heading">End Game Rule</div>
          <div className="pot-mode-grid">
            {POT_MODE_OPTIONS.map(opt => (
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

        {/* House Rules (collapsible) */}
        <div className="house-rules-section">
          <button
            className="house-rules-toggle"
            onClick={() => setShowHouseRules(v => !v)}
            type="button"
          >
            <span>Customize Rules</span>
            <span className="house-rules-arrow">{showHouseRules ? '▲' : '▼'}</span>
          </button>
          {showHouseRules && (
            <div className="house-rules-grid">
              <div className="house-rules-col-header">Takes from pot</div>
              <div className="house-rules-col-header">Adds to pot</div>
              {['single','double','triple'].map(key => (
                <div key={key} className="house-rule-row">
                  <span className="house-rule-label">{RULE_LABELS.find(r => r.key === key)?.label}</span>
                  <div className="house-rule-stepper">
                    <button onClick={() => adjustRule(key, -1)} type="button">−</button>
                    <span>${houseRules[key]}</span>
                    <button onClick={() => adjustRule(key, 1)} type="button">+</button>
                  </div>
                </div>
              ))}
              {['out','strikeout','doublePly','error'].map(key => (
                <div key={key} className="house-rule-row">
                  <span className="house-rule-label">{RULE_LABELS.find(r => r.key === key)?.label}</span>
                  <div className="house-rule-stepper">
                    <button onClick={() => adjustRule(key, -1)} type="button">−</button>
                    <span>${houseRules[key]}</span>
                    <button onClick={() => adjustRule(key, 1)} type="button">+</button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
