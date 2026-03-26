import { OUTCOMES } from '../../utils/gameLogic.js'
import OutcomeIcon from '../OutcomeIcon.jsx'

const HIT_BUTTONS = [
  { outcome: OUTCOMES.SINGLE,   label: 'Single',    sub: '+$1' },
  { outcome: OUTCOMES.DOUBLE,   label: 'Double',    sub: '+$2' },
  { outcome: OUTCOMES.TRIPLE,   label: 'Triple',    sub: '+$3' },
  { outcome: OUTCOMES.HOME_RUN, label: 'Home Run',  sub: 'Take all' },
]

const OUT_BUTTONS = [
  { outcome: OUTCOMES.OUT,         label: 'Out',         sub: '-$1' },
  { outcome: OUTCOMES.STRIKEOUT,   label: 'Strikeout',   sub: '-$2' },
  { outcome: OUTCOMES.DOUBLE_PLAY, label: 'Double Play', sub: '-$2' },
  { outcome: OUTCOMES.ERROR,       label: 'Error',       sub: '-$1' },
]

const NEUTRAL_BUTTONS = [
  { outcome: OUTCOMES.WALK, label: 'Walk',         sub: 'passes' },
  { outcome: OUTCOMES.HBP,  label: 'Hit by Pitch', sub: 'passes' },
]

function OutcomeButton({ outcome, label, sub, type, onClick, disabled }) {
  return (
    <button
      className={`outcome-btn outcome-btn-${type}`}
      onClick={() => onClick(outcome)}
      disabled={disabled}
    >
      <OutcomeIcon outcome={outcome} size={34} />
      <span className="outcome-btn-label">{label}</span>
      <span className="outcome-btn-sub">{sub}</span>
    </button>
  )
}

export default function AtBatControls({ onAtBat, disabled }) {
  function handleClick(outcome) {
    if (!disabled) onAtBat(outcome, null)
  }

  return (
    <div className="atbat-controls">
      <div className="atbat-title">Record At-Bat</div>

      <div className="outcome-group">
        <div className="outcome-group-label hit-label">Hits — Take from Pot</div>
        <div className="outcome-grid">
          {HIT_BUTTONS.map(b => (
            <OutcomeButton key={b.outcome} {...b} type="hit" onClick={handleClick} disabled={disabled} />
          ))}
        </div>
      </div>

      <div className="outcome-group">
        <div className="outcome-group-label out-label">Outs — Add to Pot</div>
        <div className="outcome-grid">
          {OUT_BUTTONS.map(b => (
            <OutcomeButton key={b.outcome} {...b} type="out" onClick={handleClick} disabled={disabled} />
          ))}
        </div>
      </div>

      <div className="outcome-group">
        <div className="outcome-group-label neutral-label">Neutral — Cup Passes</div>
        <div className="outcome-grid outcome-grid-2">
          {NEUTRAL_BUTTONS.map(b => (
            <OutcomeButton key={b.outcome} {...b} type="neutral" onClick={handleClick} disabled={disabled} />
          ))}
        </div>
      </div>
    </div>
  )
}
