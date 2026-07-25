import { useNavigate } from 'react-router-dom';
import UnlockProgress from './UnlockProgress';
import { TOTAL_KENYA_EMS_CASES, findCaseEntry } from '../kenyaEmsRegistry';

// The Kenya EMS "Learn" landing hero -- aggregate stats + a single clear call
// to action (continue in-progress work, or start Case 1) above the case grid.
//
// The denominator for "Cases Completed" is always the registry's known count
// (15), never `cases.length` -- this guarantees a brand-new student, or any
// degraded/partial API response, still reads as "0/15" rather than a
// confusing "0/0". Similarly, "Certified" only ever appears once every case
// is actually completed; before that the status reads "EMT Trainee" rather
// than an empty/undefined state.
export default function CaseDashboard({ cases = [], subscription }) {
  const navigate = useNavigate();
  const total = TOTAL_KENYA_EMS_CASES;
  const completed = cases.filter((c) => c.status === 'completed').length;
  const scores = cases.map((c) => c.score || 0).filter((n) => n > 0);
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const nextCase = cases.find((c) => c.status !== 'completed' && c.status !== 'locked');
  const isCertified = total > 0 && completed === total;
  const currentEntry = nextCase ? findCaseEntry(nextCase.case_number) : null;

  return (
    <header className="kems-dashboard-hero">
      <div className="kems-dashboard-hero-top">
        <div className="kems-dashboard-title">
          <span className="kems-ambulance-icon" aria-hidden="true">🚑</span>
          <div>
            <h1>Kenya EMS Case Simulation</h1>
            <p>15 real Kenya EMS incidents, digitized case by case. Pass each case to unlock the next and build your EMT competency record.</p>
          </div>
        </div>
        <div className="kems-dashboard-hero-actions">
          {nextCase ? (
            <button
              type="button"
              className="kems-continue-btn"
              onClick={() => navigate(`/student/learn/kenya-ems/${nextCase.case_number}`)}
            >
              Continue Case {nextCase.case_number} →
            </button>
          ) : isCertified ? (
            <button
              type="button"
              className="kems-continue-btn done"
              onClick={() => navigate('/student/learn/kenya-ems/1')}
            >
              Review Cases →
            </button>
          ) : null}
          {nextCase && <span className="kems-dashboard-cta-hint">{completed} of {total} cases passed</span>}
        </div>
      </div>

      {subscription && !subscription.allowed && (
        <div className="kems-alert-banner" role="status">
          <span aria-hidden="true">⚠️</span> Your subscription is {subscription.status}. Renew to continue with Kenya EMS Cases.
        </div>
      )}

      <div className="kems-dashboard-stats">
        <div className="kems-stat-card">
          <span className="kems-stat-icon" aria-hidden="true">📚</span>
          <div className="kems-stat-value">{completed}/{total}</div>
          <div className="kems-stat-label">Cases Completed</div>
          <div className="kems-stat-sublabel">Training Progress</div>
        </div>
        <div className="kems-stat-card green">
          <span className="kems-stat-icon" aria-hidden="true">📈</span>
          <div className="kems-stat-value">{avgScore}%</div>
          <div className="kems-stat-label">Average Score</div>
          <div className="kems-stat-sublabel">Performance Tracking</div>
        </div>
        <div className="kems-stat-card navy">
          <span className="kems-stat-icon" aria-hidden="true">🎓</span>
          <div className="kems-stat-value">{isCertified ? 'Certified' : 'EMT Trainee'}</div>
          <div className="kems-stat-label">Certification Status</div>
          <div className="kems-stat-sublabel">75% average required</div>
        </div>
        <div className="kems-stat-card red">
          <span className="kems-stat-icon" aria-hidden="true">🚨</span>
          <div className="kems-stat-value">{currentEntry?.meta?.shortTitle || currentEntry?.meta?.title || (isCertified ? 'All Cases Passed' : 'Case ' + (nextCase?.case_number ?? 1))}</div>
          <div className="kems-stat-label">Current Module</div>
          <div className="kems-stat-sublabel">{currentEntry?.meta?.difficulty ? `${currentEntry.meta.difficulty} · Advanced EMT Training` : 'Advanced EMT Training'}</div>
        </div>
      </div>

      <UnlockProgress cases={cases} />
    </header>
  );
}
