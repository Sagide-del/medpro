import UiIcon from '../../../../shared/UiIcon';

function difficultyClass(difficulty) {
  const label = String(difficulty || '').toLowerCase();
  if (label.includes('advanced')) return 'difficulty-advanced';
  if (label.includes('intermediate')) return 'difficulty-intermediate';
  if (label.includes('basic') || label.includes('beginner')) return 'difficulty-basic';
  return '';
}

export default function CaseCard({ meta, progress, locked, completed, previousLabel, onOpen }) {
  const orderNumber = progress?.case_number ?? meta?.id;
  const bestScore = progress?.score || 0;
  const paddedNumber = String(orderNumber).padStart(2, '0');
  const statusLabel = completed ? 'Completed' : locked ? 'Locked' : 'Available';
  const statusClass = completed ? 'completed' : locked ? 'locked' : 'available';

  return (
    <button
      type="button"
      className={`kems-case-card${locked ? ' locked' : ''}${completed ? ' completed' : ''}`}
      disabled={locked}
      onClick={onOpen}
    >
      <div className="kems-case-card-thumb">
        {meta?.thumbnail ? (
          <img src={meta.thumbnail} alt="" />
        ) : (
          <UiIcon name="cases" />
        )}
      </div>
      <div className="kems-case-card-body">
        <div className="kems-case-card-top">
          <span className="kems-case-card-number">Case {paddedNumber}</span>
          <span className={`kems-status-pill ${statusClass}`}>{statusLabel}</span>
        </div>
        <h3>{meta?.shortTitle || meta?.title || `Case ${orderNumber}`}</h3>
        {!locked ? (
          <>
            <p className="kems-case-card-location">
              {meta?.location && <span><UiIcon name="calendar" /> {meta.location}</span>}
              {meta?.incidentDate && <span><UiIcon name="document" /> {meta.incidentDate}</span>}
            </p>
            <div className="kems-case-card-meta">
              {meta?.category && <span className="kems-badge"><UiIcon name="cases" /> {meta.category}</span>}
              {meta?.difficulty && <span className={`kems-badge ${difficultyClass(meta.difficulty)}`}>{meta.difficulty}</span>}
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
      </div>
      <div className="kems-case-card-action">
        {completed ? 'Review Case' : locked ? 'Locked' : 'Start Case'}
      </div>
    </button>
  );
}
