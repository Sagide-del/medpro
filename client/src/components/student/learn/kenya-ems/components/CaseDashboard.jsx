import { useNavigate } from 'react-router-dom';
import UnlockProgress from './UnlockProgress';
import UiIcon from '../../../../shared/UiIcon';
import { TOTAL_KENYA_EMS_CASES } from '../kenyaEmsRegistry';

export default function CaseDashboard({ cases = [], subscription }) {
  const navigate = useNavigate();
  const total = TOTAL_KENYA_EMS_CASES;
  const completed = cases.filter((c) => c.status === 'completed').length;
  const scores = cases.map((c) => c.score || 0).filter((n) => n > 0);
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const nextCase = cases.find((c) => c.status !== 'completed' && c.status !== 'locked');
  const isCertified = total > 0 && completed === total;

  return (
    <header className="kems-dashboard-hero">
      <div className="kems-dashboard-hero-top">
        <div className="kems-dashboard-title">
          <span className="kems-ambulance-icon" aria-hidden="true">
            <UiIcon name="cases" />
          </span>
          <div>
            <h1>Kenya EMS Case Simulation</h1>
            <p>Complete the real incident worksheets in order and unlock the next case as you pass.</p>
          </div>
        </div>
        <div className="kems-dashboard-hero-actions">
          {nextCase ? (
            <button
              type="button"
              className="kems-continue-btn"
              onClick={() => navigate(`/student/learn/kenya-ems/${nextCase.case_number}`)}
            >
              Continue Case {nextCase.case_number}
            </button>
          ) : isCertified ? (
            <button
              type="button"
              className="kems-continue-btn done"
              onClick={() => navigate('/student/learn/kenya-ems/1')}
            >
              Review Cases
            </button>
          ) : null}
          {nextCase && <span className="kems-dashboard-cta-hint">{completed} of {total} cases passed</span>}
        </div>
      </div>

      {subscription && !subscription.allowed && (
        <div className="kems-alert-banner" role="status">
          <UiIcon name="alert" /> Your subscription is {subscription.status}. Renew to continue with Kenya EMS Cases.
        </div>
      )}

      <div className="kems-dashboard-stats">
        <div className="kems-stat-card">
          <span className="kems-stat-icon" aria-hidden="true"><UiIcon name="cases" /></span>
          <div className="kems-stat-value">{completed}/{total}</div>
          <div className="kems-stat-label">Cases Completed</div>
          <div className="kems-stat-sublabel">Training progress</div>
        </div>
        <div className="kems-stat-card green">
          <span className="kems-stat-icon" aria-hidden="true"><UiIcon name="progress" /></span>
          <div className="kems-stat-value">{avgScore}%</div>
          <div className="kems-stat-label">Average Score</div>
          <div className="kems-stat-sublabel">Performance tracking</div>
        </div>
        <div className="kems-stat-card navy">
          <span className="kems-stat-icon" aria-hidden="true"><UiIcon name={isCertified ? 'result' : 'document'} /></span>
          <div className="kems-stat-value">{isCertified ? 'Certified' : 'EMT Trainee'}</div>
          <div className="kems-stat-label">Certification Status</div>
          <div className="kems-stat-sublabel">80% average required</div>
        </div>
        <div className="kems-stat-card red">
          <span className="kems-stat-icon" aria-hidden="true"><UiIcon name="dispatch" /></span>
          <div className="kems-stat-value">
            {nextCase?.title || (isCertified ? 'All Cases Passed' : `Case ${nextCase?.case_number ?? 1}`)}
          </div>
          <div className="kems-stat-label">Current Module</div>
          <div className="kems-stat-sublabel">
            {nextCase?.difficulty ? `${nextCase.difficulty} · Advanced EMT training` : 'Advanced EMT training'}
          </div>
        </div>
      </div>

      <UnlockProgress cases={cases} />
    </header>
  );
}

