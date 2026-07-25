// Premium case-library tile: lock state, category/difficulty badges, best
// score, and a clear call to action -- built to feel like a commercial EMS
// training SaaS rather than a plain document list.
export default function CaseCard({ meta, progress, locked, completed, previousLabel, onOpen }) {
  const orderNumber = progress?.case_number ?? meta?.id;
  const bestScore = progress?.score || 0;

  return (
    <button
      type="button"
      className={`kems-case-card${locked ? ' locked' : ''}${completed ? ' completed' : ''}`}
      disabled={locked}
      onClick={onOpen}
    >
      <div className="kems-case-card-top">
        <span className="kems-lock-icon" aria-hidden="true">{locked ? '🔒' : completed ? '✅' : '🔓'}</span>
        <span className="kems-case-card-number">Case {orderNumber}</span>
        {!locked && <span className="kems-ambulance-icon" aria-hidden="true">🚑</span>}
      </div>
      <h3>{meta?.shortTitle || meta?.title || `Case ${orderNumber}`}</h3>
      {!locked ? (
        <>
          <p className="kems-case-card-location">{meta?.location} · {meta?.incidentDate}</p>
          <div className="kems-case-card-meta">
            <span className="kems-badge">{meta?.category}</span>
            <span className="kems-badge">{meta?.difficulty}</span>
          </div>
          <div className="kems-case-card-score">
            <div className="kems-progress-track">
              <div className="kems-progress-fill" style={{ width: `${Math.min(100, bestScore)}%` }} />
            </div>
            <span>Best score: {bestScore}%</span>
          </div>
        </>
      ) : (
        <p className="kems-case-card-locked-hint">
          Locked — complete Case {previousLabel} to unlock.
        </p>
      )}
      <div className="kems-case-card-action">
        {completed ? 'Review Case' : locked ? 'Locked' : 'Start Case'}
      </div>
    </button>
  );
}
