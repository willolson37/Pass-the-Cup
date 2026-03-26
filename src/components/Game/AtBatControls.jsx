import { OUTCOMES } from '../../utils/gameLogic.js'

const HIT_BUTTONS = [
  { outcome: OUTCOMES.SINGLE,   label: 'Single',    sub: '+$1',  type: 'hit' },
  { outcome: OUTCOMES.DOUBLE,   label: 'Double',    sub: '+$2',  type: 'hit' },
  { outcome: OUTCOMES.TRIPLE,   label: 'Triple',    sub: '+$3',  type: 'hit' },
  { outcome: OUTCOMES.HOME_RUN, label: 'Home Run',  sub: '💰',   type: 'hit' },
]

const OUT_BUTTONS = [
  { outcome: OUTCOMES.OUT,         label: 'Out',         sub: '-$1', type: 'out' },
  { outcome: OUTCOMES.STRIKEOUT,   label: 'Strikeout',   sub: '-$2', type: 'out' },
  { outcome: OUTCOMES.DOUBLE_PLAY, label: 'Double Play', sub: '-$2', type: 'out' },
  { outcome: OUTCOMES.ERROR,       label: 'Error',       sub: '-$1', type: 'out' },
]

const NEUTRAL_BUTTONS = [
  { outcome: OUTCOMES.WALK, label: 'Walk',        sub: '→', type: 'neutral' },
  { outcome: OUTCOMES.HBP,  label: 'Hit By Pitch', sub: '→', type: 'neutral' },
]

export default function AtBatControls({ onAtBat, disabled }) {
  function handleClick(outcome) {
    if (disabled) return
    onAtBat(outcome, null)
  }

  return (
    <div className="atbat-controls card">
      <div className="atbat-title">Record At-Bat</div>

      <div className="outcome-group">
        <div className="outcome-group-label hit-label">Hits — Take from Pot</div>
        <div className="outcome-grid">
          {HIT_BUTTONS.map(({ outcome, label, sub, type }) => (
            <button
              key={outcome}
              className={`outcome-btn outcome-btn-${type}`}
              onClick={() => handleClick(outcome)}
              disabled={disabled}
            >
              <span className="outcome-btn-label">{label}</span>
              <span className="outcome-btn-sub">{sub}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="outcome-group">
        <div className="outcome-group-label out-label">Outs — Add to Pot</div>
        <div className="outcome-grid">
          {OUT_BUTTONS.map(({ outcome, label, sub, type }) => (
            <button
              key={outcome}
              className={`outcome-btn outcome-btn-${type}`}
              onClick={() => handleClick(outcome)}
              disabled={disabled}
            >
              <span className="outcome-btn-label">{label}</span>
              <span className="outcome-btn-sub">{sub}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="outcome-group">
        <div className="outcome-group-label neutral-label">Neutral — Cup Passes</div>
        <div className="outcome-grid outcome-grid-2">
          {NEUTRAL_BUTTONS.map(({ outcome, label, sub, type }) => (
            <button
              key={outcome}
              className={`outcome-btn outcome-btn-${type}`}
              onClick={() => handleClick(outcome)}
              disabled={disabled}
            >
              <span className="outcome-btn-label">{label}</span>
              <span className="outcome-btn-sub">{sub}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
