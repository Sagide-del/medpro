export default function ProgressBar({ value = 0, status = '', label = '' }) {
  const clamped = Math.max(0, Math.min(100, Number(value) || 0));

  return (
    <div className="progress-card">
      <div className="progress-head">
        <div>
          <div className="progress-label">{label}</div>
          <div className="progress-status">{status}</div>
        </div>
        <div className="progress-value">{Math.round(clamped)}%</div>
      </div>
      <div className="progress-track" aria-hidden="true">
        <div className="progress-fill" style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}
