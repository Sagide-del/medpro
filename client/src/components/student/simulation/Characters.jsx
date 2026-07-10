// Responder uses a real photo (free-license, no attribution required — see
// note below); the patient stays an abstract animated figure rather than a
// real photo. Swapping a real, identifiable person's photo across "distress
// → critical → improving" states to simulate a dying/recovering patient
// isn't something we do to a real photographed stranger, even under a
// permissive license — so the patient keeps the icon treatment, which can
// change color/rhythm freely since it depicts no one in particular.

// Photo: "A female emt walks away from an open ambulance." by Jacob
// Narkiewicz — Unsplash License (free for commercial use, no attribution
// required). https://unsplash.com/photos/VbDXHj0DUHk
const RESPONDER_PHOTO =
  'https://images.unsplash.com/photo-1780570348905-908c8525ff0b?auto=format&fit=crop&w=300&h=300&q=80';

export function ResponderAvatar({ pose = 'idle', label }) {
  return (
    <div className="sim-avatar sim-avatar-responder">
      <div className="sim-responder-photo-wrap">
        <div className="sim-avatar-halo" />
        <img className="sim-responder-photo" src={RESPONDER_PHOTO} alt="EMS responder" />
        <span className="sim-responder-badge" aria-hidden="true">+</span>
      </div>
      {label && <div className="sim-avatar-label">{label}</div>}
    </div>
  );
}

export function PatientAvatar({ status = 'distress', label }) {
  return (
    <div className={`sim-avatar sim-avatar-patient status-${status}`}>
      <div className="sim-avatar-halo" />
      <svg viewBox="0 0 170 90" width="140" height="74" aria-hidden="true">
        <circle cx="28" cy="46" r="14" fill="none" stroke="var(--black)" strokeWidth="3" />
        <line x1="42" y1="46" x2="128" y2="46" stroke="var(--black)" strokeWidth="3" strokeLinecap="round" className="sim-chest" />
        <line x1="128" y1="46" x2="150" y2="30" stroke="var(--black)" strokeWidth="3" strokeLinecap="round" />
        <line x1="128" y1="46" x2="150" y2="62" stroke="var(--black)" strokeWidth="3" strokeLinecap="round" />
        <line x1="72" y1="46" x2="62" y2="24" stroke="var(--black)" strokeWidth="3" strokeLinecap="round" />
        <line x1="96" y1="46" x2="106" y2="68" stroke="var(--black)" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <svg className="sim-pulse-wave" viewBox="0 0 170 28" width="140" height="24" aria-hidden="true">
        <path d="M0 14 H55 L63 14 L69 3 L77 25 L83 14 L91 14 H170" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {label && <div className="sim-avatar-label">{label}</div>}
    </div>
  );
}

export function SimScene({ children }) {
  return <div className="sim-scene">{children}</div>;
}
