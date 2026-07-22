import { useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Vital from '../Vital';
import Loading from '../shared/Loading';

export default function ProgressAnalytics() {
  const { user } = useAuth();
  const [progress, setProgress] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api(`/analytics/students/${user.id}/progress`).then((d) => setProgress(d.progress)),
      api('/assessments/my-attempts').then((d) => setAttempts(d.attempts)),
      api('/payments/subscription').then((d) => setSubscription(d)),
    ]).catch((e) => setError(e.message));
  }, [user.id]);

  const summary = useMemo(() => {
    const domains = progress || [];
    const readinessScore = domains.length
      ? Math.round(domains.reduce((sum, item) => sum + Number(item.avg_score), 0) / domains.length)
      : 0;
    const weakest = [...domains].sort((a, b) => Number(a.avg_score) - Number(b.avg_score))[0] || null;
    const strongest = [...domains].sort((a, b) => Number(b.avg_score) - Number(a.avg_score))[0] || null;
    const completedAttempts = attempts.filter((attempt) => attempt.status === 'graded' || attempt.status === 'submitted').length;
    return { readinessScore, weakest, strongest, completedAttempts };
  }, [attempts, progress]);

  if (error) return <div className="alert">{error}</div>;
  if (!progress || !subscription) return <Loading label="Loading progress analytics..." />;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Progress Analytics</h1>
          <div className="sub">Track readiness, weak areas, and completed assessment activity.</div>
        </div>
      </div>

      <div className="vitals">
        <Vital label="Readiness score" value={`${summary.readinessScore}%`} />
        <Vital label="Completed attempts" value={summary.completedAttempts} />
        <Vital label="Weakest area" value={summary.weakest ? summary.weakest.domain : '-'} />
        <Vital label="Subscription" value={subscription.active ? 'Active' : 'Inactive'} />
      </div>

      <div className="form-grid">
        <div className="card">
          <h2>Competency summary</h2>
          <p style={{ color: 'var(--ink-soft)', marginBottom: 14 }}>
            Strongest domain: <strong style={{ color: 'var(--ink)' }}>{summary.strongest ? summary.strongest.domain : 'No data yet'}</strong>
          </p>
          <p style={{ color: 'var(--ink-soft)', marginBottom: 0 }}>
            Focus next on <strong style={{ color: 'var(--ink)' }}>{summary.weakest ? summary.weakest.domain : 'building initial assessment data'}</strong>.
          </p>
        </div>

        <div className="card">
          <h2>Subscription coverage</h2>
          <p style={{ color: 'var(--ink-soft)', marginBottom: 8 }}>
            {subscription.active
              ? subscription.source === 'institution'
                ? 'Your institution currently covers assessment access.'
                : 'Your personal MedProHub assessment subscription is active.'
              : 'Assessment access is currently inactive.'}
          </p>
          <p style={{ color: 'var(--ink-soft)', marginBottom: 0 }}>
            Current listed monthly price: Ksh {subscription.price}.
          </p>
        </div>
      </div>

      <div className="card">
        <h2>Performance by domain</h2>
        <table>
          <thead><tr><th>Domain</th><th>Average score</th><th>Attempts</th></tr></thead>
          <tbody>
            {progress.map((item) => (
              <tr key={item.domain}>
                <td style={{ textTransform: 'capitalize' }}>{item.domain}</td>
                <td className="num">{item.avg_score}%</td>
                <td className="num">{item.attempts}</td>
              </tr>
            ))}
            {progress.length === 0 && <tr><td colSpan="3" style={{ color: 'var(--ink-soft)' }}>No analytics recorded yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
