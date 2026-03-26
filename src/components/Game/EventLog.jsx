import { useState } from 'react'

function relativeTime(timestamp) {
  const now = Date.now()
  const diff = Math.floor((now - timestamp) / 1000)
  if (diff < 5) return 'just now'
  if (diff < 60) return `${diff}s ago`
  const mins = Math.floor(diff / 60)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  return `${hrs}h ago`
}

function BalanceTag({ balanceChange }) {
  if (balanceChange === 0) return <span className="bal-neutral">passes</span>
  if (balanceChange > 0)
    return <span className="bal-positive">+${balanceChange}</span>
  return <span className="bal-negative">-${Math.abs(balanceChange)}</span>
}

const PAGE_SIZE = 10

export default function EventLog({ events, maxVisible = 20 }) {
  const [showAll, setShowAll] = useState(false)

  if (!events || events.length === 0) {
    return (
      <div className="event-log">
        <div className="event-log-title">Event Log</div>
        <div className="event-log-empty">No at-bats yet</div>
      </div>
    )
  }

  const limit = showAll ? maxVisible : PAGE_SIZE
  const visible = events.slice(0, limit)
  const hasMore = events.length > limit

  return (
    <div className="event-log">
      <div className="event-log-title">Event Log</div>
      <div className="event-log-list">
        {visible.map((evt) => (
          <div key={evt.id} className="event-item">
            <div className="event-item-main">
              <span className="event-player">{evt.playerName}</span>
              <BalanceTag balanceChange={evt.balanceChange} />
            </div>
            <div className="event-desc">{evt.description}</div>
            {evt.mlbContext && (
              <div className="event-mlb-context">
                {evt.mlbContext.batterName && (
                  <span className="mlb-batter">{evt.mlbContext.batterName}</span>
                )}
                {evt.mlbContext.inning && (
                  <span className="mlb-inning">
                    {evt.mlbContext.halfInning === 'bottom' ? '▼' : '▲'}
                    {evt.mlbContext.inning}
                  </span>
                )}
              </div>
            )}
            <div className="event-meta">
              <span className="event-pot">
                Pot: ${evt.potBefore} → ${evt.potAfter}
              </span>
              <span className="event-time">{relativeTime(evt.timestamp)}</span>
            </div>
          </div>
        ))}
      </div>
      {hasMore && (
        <button
          className="btn btn-outline btn-sm show-more-btn"
          onClick={() => setShowAll(true)}
        >
          Show more ({events.length - limit} remaining)
        </button>
      )}
    </div>
  )
}
