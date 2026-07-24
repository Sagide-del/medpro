import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Loading from '../shared/Loading';

export default function ProgressAnalytics() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api('/analytics/student-readiness'),
      api('/analytics/students/me/progress').catch(() => ({ progress: [] })),
    ])
      .then(([readiness, progress]) => setData({ readiness: readiness.readiness, progress: progress.progress }))
      .catch((issue) => setError(issue.message));
  }, []);

  if (error) return <div className="alert">{error}</div>;
  if (!data) return <Loading label="Loading analytics..." />;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Progress analytics</h1>
          <div className="sub">Exam readiness, weak topics, simulation performance, assignments, and clinical competency.</div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><strong>{data.readiness.examReadiness}</strong><span>Exam readiness</span></div>
        <div className="stat-card"><strong>{data.readiness.simulationScore}</strong><span>Simulation score</span></div>
        <div className="stat-card"><strong>{data.readiness.caseCompetency}</strong><span>Kenya EMS cases</span></div>
        <div className="stat-card"><strong>{data.readiness.clinicalCompetency.completed_hours}</strong><span>Clinical hours</span></div>
      </div>

      <div className="card">
        <h2>Weak topics and competency progress</h2>
        <table>
          <thead><tr><th>Domain</th><th>Average score</th><th>Attempts</th></tr></thead>
          <tbody>
            {data.progress.map((row) => (
              <tr key={row.domain}>
                <td>{row.domain}</td>
                <td>{row.avg_score}%</td>
                <td>{row.attempts}</td>
              </tr>
            ))}
            {data.progress.length === 0 && <tr><td colSpan="3" style={{ color: 'var(--ink-soft)' }}>No progress data available yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
