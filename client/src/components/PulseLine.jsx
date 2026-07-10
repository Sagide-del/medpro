// Signature element: ECG trace used in the sidebar and login card
export default function PulseLine({ color = '#3fd0a4', width = 200 }) {
  return (
    <svg className="pulse-line" width={width} height="26" viewBox="0 0 200 26" fill="none" aria-hidden="true">
      <path
        d="M0 14 H52 L60 14 L66 5 L72 22 L78 9 L84 14 H120 L128 14 L133 8 L138 18 L143 14 H200"
        stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}
