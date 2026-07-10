import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Vital from '../Vital';
import Loading from '../shared/Loading';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [progress, setProgress] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [logbook, setLogbook] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api(`/analytics/students/${user.id}/progress`).then((d) => setProgress(d.progress)),
      api('/assessments/my-attempts').then((d) => setAttempts(d.attempts.slice(0, 5))),
      api('/logbook').then((d) => setLogbook(d)),
    ]).catch((e) => setError(e.message));
  }, [user.id]);

  if (error) return <div className="alert">{error}</div>;
  if (!progress) return <Loading label="Loading your dashboard…" />;

  const avgScore = progress.length
    ? Math.round(progress.reduce((s, p) => s + Number(p.avg_score), 0) / progress.length)
    : 0;
  const logbookPct = logbook?.progress
    ? Math.round((logbook.progress.approved_count / logbook.progress.required_entries) * 100)
    : 0;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Welcome back, {user.name?.split(' ')[0]}</h1>
          <div className="sub">{user.program || 'Student portal'} &middot; {user.institution || 'MedPro'}</div>
        </div>
      </div>

      <div className="vitals">
        <Vital label="Average score" value={`${avgScore}%`} />
        <Vital label="Assessments taken" value={attempts.length} />
        <Vital label="Logbook progress" value={`${logbookPct}%`} />
        <Vital label="Required entries" value={logbook?.progress?.required_entries ?? '—'} />
      </div>

      <div className="card">
        <h2>Recent assessment attempts</h2>
        <table>
          <thead><tr><th>Assessment</th><th>Type</th><th>Status</th><th>Score</th></tr></thead>
          <tbody>
            {attempts.map((a) => (
              <tr key={a.attempt_id}>
                <td>{a.title}</td>
                <td>{a.type}</td>
                <td><span className={`badge ${a.status}`}>{a.status}</span></td>
                <td className="num">{a.score_pct != null ? `${a.score_pct}%` : '—'}</td>
              </tr>
            ))}
            {attempts.length === 0 && <tr><td colSpan="4" style={{ color: 'var(--ink-soft)' }}>No attempts yet — visit Assessments to get started.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>Performance by domain</h2>
        <table>
          <thead><tr><th>Domain</th><th>Avg score</th><th>Attempts</th></tr></thead>
          <tbody>
            {progress.map((p) => (
              <tr key={p.domain}>
                <td style={{ textTransform: 'capitalize' }}>{p.domain}</td>
                <td className="num">{p.avg_score}%</td>
                <td className="num">{p.attempts}</td>
              </tr>
            ))}
            {progress.length === 0 && <tr><td colSpan="3" style={{ color: 'var(--ink-soft)' }}>No performance data yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="form-grid">
        <Link to="/student/assessments"><div className="card" style={{ cursor: 'pointer' }}><h2>Take an assessment</h2><p style={{ color: 'var(--ink-soft)', fontSize: 13 }}>Quizzes, exams, and clinical judgment scenarios.</p></div></Link>
        <Link to="/student/flashcards"><div className="card" style={{ cursor: 'pointer' }}><h2>Study flashcards</h2><p style={{ color: 'var(--ink-soft)', fontSize: 13 }}>Spaced repetition keeps due cards front and center.</p></div></Link>
      </div>
    </>
  );
}
