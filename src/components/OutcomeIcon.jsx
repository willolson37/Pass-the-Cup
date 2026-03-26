// Bird's eye view of a baseball field with runners on bases.
// Used as emblem icons on the at-bat control buttons.

function FieldDiamond({ runners = [], size = 40 }) {
  // Base positions in a 40×40 viewBox — home at bottom, 2nd at top
  const bases = [
    { x: 20, y: 35 }, // 0 = home plate
    { x: 33, y: 22 }, // 1 = first base  (right)
    { x: 20, y: 9  }, // 2 = second base (top)
    { x: 7,  y: 22 }, // 3 = third base  (left)
  ]

  return (
    <svg width={size} height={size} viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      {/* Green outfield fan — foul lines fan out from home plate upward */}
      <path d="M20,36 L2,14 Q20,-3 38,14 Z" fill="#4ade80" />
      {/* Sandy infield diamond */}
      <polygon points="20,35 33,22 20,9 7,22" fill="#fde68a" />
      {/* Foul lines */}
      <line x1="20" y1="36" x2="2"  y2="14" stroke="white" strokeWidth="0.7" opacity="0.5" />
      <line x1="20" y1="36" x2="38" y2="14" stroke="white" strokeWidth="0.7" opacity="0.5" />
      {/* Base path lines */}
      <polygon points="20,35 33,22 20,9 7,22" fill="none" stroke="white" strokeWidth="1.2" />
      {/* Pitcher's mound */}
      <circle cx="20" cy="22" r="1.8" fill="#fbbf24" stroke="white" strokeWidth="0.5" />
      {/* Bases — orange when occupied, white when empty */}
      {bases.map((b, i) => (
        <rect
          key={i}
          x={b.x - 2.8}
          y={b.y - 2.8}
          width="5.6"
          height="5.6"
          rx="0.5"
          fill={runners.includes(i) ? '#f97316' : 'white'}
          stroke={runners.includes(i) ? '#ea580c' : '#d1d5db'}
          strokeWidth="0.8"
          transform={`rotate(45 ${b.x} ${b.y})`}
        />
      ))}
    </svg>
  )
}

// Round badge icons for non-diamond outcomes (Out, K, DP, BB, HBP, E)
function BadgeIcon({ text, bg, color, size = 36 }) {
  const fontSize = text.length >= 3 ? 9 : text.length === 2 ? 13 : 18
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
      <circle cx="18" cy="18" r="17" fill={bg} />
      <text
        x="18"
        y="18"
        dominantBaseline="central"
        textAnchor="middle"
        fill={color}
        fontSize={fontSize}
        fontWeight="800"
        fontFamily="-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif"
      >
        {text}
      </text>
    </svg>
  )
}

export default function OutcomeIcon({ outcome, size = 36 }) {
  switch (outcome) {
    case 'single':   return <FieldDiamond runners={[1]}         size={size} />
    case 'double':   return <FieldDiamond runners={[2]}         size={size} />
    case 'triple':   return <FieldDiamond runners={[3]}         size={size} />
    case 'homeRun':  return <FieldDiamond runners={[0,1,2,3]}   size={size} />
    case 'out':      return <BadgeIcon text="OUT" bg="#fee2e2" color="#dc2626" size={size} />
    case 'strikeout':return <BadgeIcon text="K"   bg="#fecaca" color="#b91c1c" size={size} />
    case 'doublePly':return <BadgeIcon text="DP"  bg="#fecaca" color="#b91c1c" size={size} />
    case 'walk':     return <BadgeIcon text="BB"  bg="#dbeafe" color="#1d4ed8" size={size} />
    case 'hbp':      return <BadgeIcon text="HBP" bg="#fed7aa" color="#c2410c" size={size} />
    case 'error':    return <BadgeIcon text="E"   bg="#fef3c7" color="#b45309" size={size} />
    default:         return null
  }
}
