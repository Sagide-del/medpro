// Learning Path timeline -- numbered circles connected by a progress line
// across all 15 Kenya EMS cases. States: Available = blue, Completed = green
// check, Locked = grey lock. Replaces the old tiny lock-icon strip with a
// proper certification-path visual.
export default function UnlockProgress({ cases = [] }) {
  if (!cases.length) return null;
  const completedCount = cases.filter((c) => c.status === 'completed').length;

  return (
    <div className="kems-unlock-progress" aria-label="Learning path progress">
      <div className="kems-unlock-progress-head">
        <span className="kems-card-icon" aria-hidden="true">🗺️</span>
        <span>Learning Path — {completedCount} of {cases.length} cases passed</span>
      </div>
      <div className="kems-unlock-steps">
        {cases.map((c, index) => {
          const state = c.status === 'completed' ? 'completed' : c.status === 'locked' ? 'locked' : 'available';
          const isLast = index === cases.length - 1;
          return (
            <div key={c.case_number} className="kems-unlock-step-wrap">
              <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <div
                  className={`kems-unlock-step kems-unlock-step-${state}`}
                  title={`Case ${c.case_number}${state === 'locked' ? ' (locked)' : state === 'completed' ? ' (completed)' : ' (available)'}`}
                >
                  {state === 'completed' ? '✓' : state === 'locked' ? '🔒' : c.case_number}
                </div>
                {!isLast && <div className={`kems-unlock-connector${state === 'completed' ? ' done' : ''}`} />}
              </div>
              <span className="kems-unlock-step-label">Case {c.case_number}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
