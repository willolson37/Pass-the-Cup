export default function CupIcon({ size = 100 }) {
  const w = size
  const h = size * 1.1

  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 100 110"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Cup with dollar bills"
    >
      {/* Dollar bill 1 — left, angled */}
      <g transform="rotate(-22, 38, 52)">
        <rect x="22" y="28" width="32" height="18" rx="2" fill="#4ade80" stroke="#16a34a" strokeWidth="1.2" />
        <text x="38" y="41" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#15803d">$</text>
        <line x1="24" y1="32" x2="52" y2="32" stroke="#16a34a" strokeWidth="0.6" opacity="0.5" />
        <line x1="24" y1="40" x2="52" y2="40" stroke="#16a34a" strokeWidth="0.6" opacity="0.5" />
      </g>

      {/* Dollar bill 2 — center, straight */}
      <g transform="rotate(0, 50, 52)">
        <rect x="34" y="26" width="32" height="18" rx="2" fill="#22c55e" stroke="#16a34a" strokeWidth="1.2" />
        <text x="50" y="39" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#15803d">$</text>
        <line x1="36" y1="30" x2="64" y2="30" stroke="#15803d" strokeWidth="0.6" opacity="0.5" />
        <line x1="36" y1="38" x2="64" y2="38" stroke="#15803d" strokeWidth="0.6" opacity="0.5" />
      </g>

      {/* Dollar bill 3 — right, angled */}
      <g transform="rotate(22, 62, 52)">
        <rect x="46" y="28" width="32" height="18" rx="2" fill="#4ade80" stroke="#16a34a" strokeWidth="1.2" />
        <text x="62" y="41" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#15803d">$</text>
        <line x1="48" y1="32" x2="76" y2="32" stroke="#16a34a" strokeWidth="0.6" opacity="0.5" />
        <line x1="48" y1="40" x2="76" y2="40" stroke="#16a34a" strokeWidth="0.6" opacity="0.5" />
      </g>

      {/* Cup body */}
      <path
        d="M22 50 L28 98 L72 98 L78 50 Z"
        fill="#dbeafe"
        stroke="#60a5fa"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Cup rim bar */}
      <rect x="20" y="47" width="60" height="7" rx="3.5" fill="#93c5fd" stroke="#60a5fa" strokeWidth="1.5" />

      {/* Highlight stripe on left */}
      <path
        d="M29 57 L33 94"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.55"
      />

      {/* Slight vertical lines for texture */}
      <line x1="50" y1="57" x2="51" y2="95" stroke="#bfdbfe" strokeWidth="1" opacity="0.6" />
    </svg>
  )
}
