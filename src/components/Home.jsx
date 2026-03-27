import { useState } from 'react'
import CupIcon from './CupIcon.jsx'
import BaseballIcon from './BaseballIcon.jsx'

export default function Home({ onSelectMode, onJoinGame, onViewHistory, user, profile, hasLiveAccess, onSignOut }) {
  const [joinInput, setJoinInput] = useState('')
  const [showJoin, setShowJoin] = useState(false)
  const [joinError, setJoinError] = useState('')

  const getPlanLabel = () => {
    if (!profile) return null
    if (profile.plan === 'season') return 'Season'
    if (profile.plan === 'game' || (profile.game_credits || 0) > 0) return `${profile.game_credits || 0} credit${(profile.game_credits || 0) !== 1 ? 's' : ''}`
    return 'Free'
  }

  const isActive = hasLiveAccess && hasLiveAccess()

  function handleJoin() {
    const code = joinInput.trim().toUpperCase()
    if (code.length !== 6) {
      setJoinError('Enter the 6-character game code')
      return
    }
    setJoinError('')
    setShowJoin(false)
    setJoinInput('')
    onJoinGame(code)
  }

  return (
    <div className="screen home-screen">
      <div className="home-card card">
        <div className="cup-icon-wrap">
          <CupIcon size={96} />
        </div>

        <h1 className="app-title">Pass the Cup</h1>
        <p className="app-subtitle">Baseball Drinking Game</p>

        <div className="home-modes">
          <button className="mode-btn btn" onClick={() => onSelectMode('manual')}>
            <div className="mode-btn-icon green">
              <BaseballIcon size={28} />
            </div>
            <div className="mode-content">
              <div className="mode-name">Manual Mode</div>
              <div className="mode-desc">Enter at-bats yourself</div>
            </div>
            <div className="mode-arrow">›</div>
          </button>

          <button className="mode-btn btn" onClick={() => onSelectMode('live')}>
            <div className="mode-btn-icon">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="14" r="5" fill="#3b82f6" />
                <circle cx="14" cy="14" r="9" stroke="#3b82f6" strokeWidth="1.5" fill="none" opacity="0.5" />
                <circle cx="14" cy="14" r="13" stroke="#3b82f6" strokeWidth="1" fill="none" opacity="0.25" />
              </svg>
            </div>
            <div className="mode-content">
              <div className="mode-name">
                Live Mode
                <span className="plus-badge">PLUS</span>
              </div>
              <div className="mode-desc">Connect to a live MLB game</div>
            </div>
            <div className="mode-arrow">›</div>
          </button>

          {/* Join Game */}
          <button className="mode-btn btn" onClick={() => setShowJoin(v => !v)}>
            <div className="mode-btn-icon" style={{ background: '#f0fdf4' }}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect x="4" y="8" width="20" height="14" rx="3" stroke="#22c55e" strokeWidth="1.8" fill="none" />
                <path d="M4 12h20" stroke="#22c55e" strokeWidth="1.5" />
                <text x="14" y="21" textAnchor="middle" fontSize="8" fontWeight="700" fill="#22c55e">#</text>
              </svg>
            </div>
            <div className="mode-content">
              <div className="mode-name">Join Game</div>
              <div className="mode-desc">Enter a 6-character code</div>
            </div>
            <div className="mode-arrow">›</div>
          </button>

          {showJoin && (
            <div className="join-game-form">
              <input
                className="join-code-input"
                type="text"
                placeholder="Enter code (e.g. AB3X7K)"
                value={joinInput}
                onChange={e => { setJoinInput(e.target.value.toUpperCase()); setJoinError('') }}
                maxLength={6}
                autoCapitalize="characters"
                autoFocus
              />
              {joinError && <p className="input-error">{joinError}</p>}
              <button className="btn-start" onClick={handleJoin} style={{ marginTop: 8 }}>
                Join →
              </button>
            </div>
          )}
        </div>

        {/* History link */}
        <button className="history-link" onClick={onViewHistory}>
          View Game History
        </button>

        {user ? (
          <div className="user-status-bar">
            <span className="user-status-email" title={user.email}>{user.email}</span>
            {profile && (
              <span className={`user-plan-badge${isActive ? ' active' : ''}`}>
                {getPlanLabel()}
              </span>
            )}
            <button className="user-signout-link" onClick={onSignOut}>
              Sign out
            </button>
          </div>
        ) : (
          <div className="user-signin-prompt">
            <button className="user-signin-link" onClick={() => onSelectMode('live')}>
              Sign in for Live Mode
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
