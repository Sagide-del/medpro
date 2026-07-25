// Horizontal 15-step progress trail across the whole Kenya EMS module --
// gives the dashboard an at-a-glance certification-path feel.
export default function UnlockProgress({ cases = [] }) {
  if (!cases.length) return null;
  const completedCount = cases.filter((c) => c.status === 'completed').length;

  return (
    <div className="kems-unlock-progress" aria-label="Case unlock progress">
      <div className="kems-unlock-progress-head">
        <span className="kems-card-icon" aria-hidden="true">📡</span>
        <span>{completedCount} of {cases.length} cases passed</span>
      </div>
      <div className="kems-unlock-steps">
        {cases.map((c) => {
          const state = c.status === 'completed' ? 'completed' : c.status === 'locked' ? 'locked' : 'available';
          const icon = state === 'completed' ? '✅' : state === 'locked' ? '🔒' : '🔓';
          return (
            <div key={c.id} className={`kems-unlock-step kems-unlock-step-${state}`} title={`Case ${c.order_number}`}>
              <span aria-hidden="true">{icon}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
