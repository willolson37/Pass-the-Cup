export default function BaseballIcon({ size = 40 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Baseball"
    >
      {/* Ball */}
      <circle cx="20" cy="20" r="18" fill="white" stroke="#e5e7eb" strokeWidth="1.5" />

      {/* Left stitching curve */}
      <path
        d="M13 6 C10 10, 10 14, 13 18 C16 22, 16 26, 13 30"
        stroke="#ef4444"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Left stitching ticks */}
      <line x1="13" y1="9" x2="16" y2="10" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="11.5" y1="13" x2="14.5" y2="13.5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="11.5" y1="17" x2="14.5" y2="16.5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="13" y1="21" x2="16" y2="21.5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="11.5" y1="25" x2="14.5" y2="25.5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="13" y1="29" x2="16" y2="28" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />

      {/* Right stitching curve */}
      <path
        d="M27 6 C30 10, 30 14, 27 18 C24 22, 24 26, 27 30"
        stroke="#ef4444"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Right stitching ticks */}
      <line x1="27" y1="9" x2="24" y2="10" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="28.5" y1="13" x2="25.5" y2="13.5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="28.5" y1="17" x2="25.5" y2="16.5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="27" y1="21" x2="24" y2="21.5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="28.5" y1="25" x2="25.5" y2="25.5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="27" y1="29" x2="24" y2="28" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
