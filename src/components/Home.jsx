import CupIcon from './CupIcon.jsx'
import BaseballIcon from './BaseballIcon.jsx'

export default function Home({ onSelectMode }) {
  return (
    <div className="screen home-screen">
      <div className="home-card card">
        <div className="cup-icon-wrap">
          <CupIcon size={96} />
        </div>

        <h1 className="app-title">Pass the Cup</h1>
        <p className="app-subtitle">Baseball Drinking Game</p>

        <div className="home-modes">
          <button
            className="mode-btn btn"
            onClick={() => onSelectMode('manual')}
          >
            <div className="mode-btn-icon green">
              <BaseballIcon size={28} />
            </div>
            <div className="mode-content">
              <div className="mode-name">Manual Mode</div>
              <div className="mode-desc">Enter at-bats yourself</div>
            </div>
            <div className="mode-arrow">›</div>
          </button>

          <button
            className="mode-btn btn"
            onClick={() => onSelectMode('live')}
          >
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
        </div>
      </div>
    </div>
  )
}
