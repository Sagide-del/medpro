const ICONS = {
  dashboard: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.8" />
      <rect x="13" y="3.5" width="7.5" height="4.5" rx="1.8" />
      <rect x="13" y="10.5" width="7.5" height="10" rx="1.8" />
      <rect x="3.5" y="13" width="7.5" height="7.5" rx="1.8" />
    </svg>
  ),
  learn: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 4.5h10.5a3 3 0 0 1 3 3V20H8a3 3 0 0 0-3 3V4.5Z" />
      <path d="M19 20H8a3 3 0 0 1-3 3" />
      <path d="M8 7h8" />
      <path d="M8 11h8" />
    </svg>
  ),
  practice: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="4.5" width="14" height="17" rx="2.2" />
      <path d="M9 4.5V3.5h6v1" />
      <path d="M8 10h8" />
      <path d="M8 14h8" />
      <path d="M8 18h5" />
    </svg>
  ),
  progress: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4.5 19.5h15" />
      <path d="M7 16v-4" />
      <path d="M12 16V8" />
      <path d="M17 16v-6" />
      <path d="M6.5 7.5 11 4.5l3.5 2 3.5-1.5" />
    </svg>
  ),
  community: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 12.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      <path d="M17 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
      <path d="M3.5 20a5 5 0 0 1 7-4.5" />
      <path d="M13.5 20a4.5 4.5 0 0 1 7-3.8" />
    </svg>
  ),
  subscription: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="6" width="16" height="12" rx="2" />
      <path d="M4 10h16" />
      <path d="M7 15.5h4" />
      <path d="M14 15.5h3" />
    </svg>
  ),
  exam: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="4.5" width="14" height="17" rx="2.2" />
      <path d="M8 9h8" />
      <path d="M8 13h8" />
      <path d="M8 17h5" />
    </svg>
  ),
  simulation: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="7.5" />
      <path d="M12 7.5v4l3 2" />
      <path d="m14.5 5.5 1.5-1.5" />
      <path d="m9.5 5.5-1.5-1.5" />
    </svg>
  ),
  cases: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 5.5h10l4 4V19a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19V7A1.5 1.5 0 0 1 5 5.5Z" />
      <path d="M15 5.5V9h4" />
      <path d="M8 13h8" />
      <path d="M8 16.5h6" />
    </svg>
  ),
  alert: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4 3.5 19h17L12 4Z" />
      <path d="M12 9v4" />
      <path d="M12 16.5h.01" />
    </svg>
  ),
  dispatch: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 20a7 7 0 0 0 7-7" />
      <path d="M12 16a3 3 0 0 0 3-3" />
      <circle cx="12" cy="13" r="1.5" />
      <path d="M6 20a9 9 0 0 1 12 0" />
      <path d="M8.5 8.5 5.5 5.5" />
      <path d="M15.5 8.5 18.5 5.5" />
    </svg>
  ),
  question: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 9a3 3 0 1 1 5 2.2c-.8.6-1.5 1.2-1.5 2.3" />
      <path d="M12 17.5h.01" />
      <circle cx="12" cy="12" r="8.5" />
    </svg>
  ),
  response: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4.5" y="5" width="15" height="14" rx="2" />
      <path d="M7 9h10" />
      <path d="M7 12.5h7" />
      <path d="M7 16h5" />
    </svg>
  ),
  result: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7.5 12.5 10.5 15.5 16.5 8.5" />
      <circle cx="12" cy="12" r="8.5" />
    </svg>
  ),
  lock: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 1 1 8 0v3" />
    </svg>
  ),
  unlock: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M11 11V8a4 4 0 1 1 7 2" />
    </svg>
  ),
  arrowRight: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h12" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="5.5" width="16" height="14" rx="2" />
      <path d="M4 9h16" />
      <path d="M8 3.5v4" />
      <path d="M16 3.5v4" />
    </svg>
  ),
  activity: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 13h4l2-6 4 12 2-6h4" />
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4.5 19 7v5.2c0 4.2-2.8 7.8-7 9.3-4.2-1.5-7-5.1-7-9.3V7l7-2.5Z" />
      <path d="M9.5 12.5 11.2 14.2 15 9.8" />
    </svg>
  ),
  document: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 3.5h7l4 4V20a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 20V5A1.5 1.5 0 0 1 7 3.5Z" />
      <path d="M14 3.5V8h4" />
      <path d="M8 12h8" />
      <path d="M8 16h6" />
    </svg>
  ),
};

export default function UiIcon({ name, className = '', title }) {
  const icon = ICONS[name] || ICONS.document;

  return (
    <span className={`ui-icon ${className}`.trim()} aria-hidden={title ? undefined : 'true'} title={title}>
      {icon}
    </span>
  );
}
