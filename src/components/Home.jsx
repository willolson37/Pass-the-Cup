export default function Home({ onSelectMode }) {
  return (
    <div className="screen home-screen">
      <div className="home-hero">
        <div className="home-icon">🏆</div>
        <h1 className="home-title">Pass the Cup</h1>
        <p className="home-tagline">Baseball Drinking Game</p>
      </div>

      <div className="home-modes">
        <button
          className="mode-card btn"
          onClick={() => onSelectMode('manual')}
        >
          <div className="mode-icon">⚾</div>
          <div className="mode-content">
            <div className="mode-name">Manual Mode</div>
            <div className="mode-desc">Enter at-bat outcomes yourself as you watch</div>
          </div>
          <div className="mode-arrow">›</div>
        </button>

        <button
          className="mode-card btn"
          onClick={() => onSelectMode('live')}
        >
          <div className="mode-icon">📡</div>
          <div className="mode-content">
            <div className="mode-name">
              Live Mode
              <span className="plus-badge">LIVE</span>
            </div>
            <div className="mode-desc">Auto-tracks a real MLB game in real time</div>
          </div>
          <div className="mode-arrow">›</div>
        </button>
      </div>

      <div className="home-rules">
        <h3 className="rules-title">Quick Rules</h3>
        <ul className="rules-list">
          <li><span className="rule-hit">Hits</span> — take from the pot (1B=$1, 2B=$2, 3B=$3, HR=all)</li>
          <li><span className="rule-out">Outs</span> — add to the pot (Out=$1, K=$2, DP=$2)</li>
          <li><span className="rule-neutral">Walk / HBP</span> — cup passes, nothing changes</li>
          <li>Home Run triggers a re-ante ($1 each)</li>
        </ul>
      </div>
    </div>
  )
}
