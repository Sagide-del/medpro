import UnlockProgress from './UnlockProgress';

// The Kenya EMS "Learn" landing hero -- aggregate stats + a single clear call
// to action (continue in-progress work, or start Case 1) above the case grid.
export default function CaseDashboard({ cases = [], subscription }) {
  const total = cases.length;
  const completed = cases.filter((c) => c.status === 'completed').length;
  const scores = cases.map((c) => c.score || c.best_percentage || 0).filter((n) => n > 0);
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const nextCase = cases.find((c) => c.status !== 'completed' && c.status !== 'locked');

  return (
    <header className="kems-dashboard-hero">
      <div className="kems-dashboard-hero-top">
        <div className="kems-dashboard-title">
          <span className="kems-ambulance-icon" aria-hidden="true">🚑</span>
          <div>
            <h1>Kenya EMS Case Simulation</h1>
            <p>15 real Kenya EMS incidents, digitized case by case. Pass each case to unlock the next.</p>
          </div>
        </div>
        {nextCase && (
          <div className="kems-dashboard-cta-chip">
            <span aria-hidden="true">📡</span>
            Continue: Case {nextCase.order_number}
          </div>
        )}
      </div>

      {subscription && !subscription.allowed && (
        <div className="kems-alert-banner" role="status">
          <span aria-hidden="true">⚠️</span> Your subscription is {subscription.status}. Renew to continue with Kenya EMS Cases.
        </div>
      )}

      <div className="kems-dashboard-stats">
        <div className="kems-stat-card">
          <div className="kems-stat-value">{completed}/{total}</div>
          <div className="kems-stat-label">Cases Passed</div>
        </div>
        <div className="kems-stat-card">
          <div className="kems-stat-value">{avgScore}%</div>
          <div className="kems-stat-label">Average Score</div>
        </div>
        <div className="kems-stat-card">
          <div className="kems-stat-value">{completed === total ? '✅' : `${total - completed}`}</div>
          <div className="kems-stat-label">{completed === total ? 'Certified' : 'Cases Remaining'}</div>
        </div>
      </div>

      <UnlockProgress cases={cases} />
    </header>
  );
}
