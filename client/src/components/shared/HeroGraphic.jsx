// Abstract background graphic for the home hero — extends the app's existing
// "vitals monitor" identity (pulse line, signal red, precise geometry)
// rather than attempting literal illustration.
export default function HeroGraphic() {
  return (
    <svg
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    >
      <circle cx="900" cy="380" r="300" fill="none" stroke="#cc0000" strokeWidth="1" opacity="0.35" />
      <circle cx="900" cy="380" r="220" fill="none" stroke="#ffffff" strokeWidth="1" opacity="0.06" />
      <circle cx="900" cy="380" r="380" fill="none" stroke="#ffffff" strokeWidth="1" opacity="0.04" />
      <circle cx="900" cy="80" r="5" fill="#cc0000" />
      <line x1="900" y1="85" x2="900" y2="160" stroke="#cc0000" strokeWidth="1" opacity="0.4" />

      <g opacity="0.9">
        <path
          d="M0 420 H520 L545 420 L565 360 L595 470 L620 400 L645 420 H760 L780 420 L800 380 L825 440 L845 420 H1200"
          fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        />
      </g>

      <g fill="#cc0000">
        <circle cx="120" cy="140" r="2" opacity="0.5" />
        <circle cx="180" cy="620" r="2" opacity="0.4" />
        <circle cx="260" cy="200" r="1.5" opacity="0.35" />
        <circle cx="340" cy="640" r="2" opacity="0.3" />
        <circle cx="1020" cy="620" r="2" opacity="0.4" />
        <circle cx="1100" cy="180" r="1.5" opacity="0.35" />
        <circle cx="1140" cy="520" r="2" opacity="0.3" />
        <circle cx="80" cy="480" r="1.5" opacity="0.3" />
      </g>

      <rect x="960" y="560" width="120" height="120" rx="4" fill="none" stroke="#ffffff" strokeWidth="1" opacity="0.06" transform="rotate(20 1020 620)" />
    </svg>
  );
}
