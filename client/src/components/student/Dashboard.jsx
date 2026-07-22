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
  const [subscription, setSubscription] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api(`/analytics/students/${user.id}/progress`).then((data) => setProgress(data.progress)),
      api('/assessments/my-attempts').then((data) => setAttempts(data.attempts.slice(0, 5))),
      api('/logbook').then((data) => setLogbook(data)),
      api('/payments/subscription').then((data) => setSubscription(data)),
    ]).catch((err) => setError(err.message));
  }, [user.id]);

  if (error) return <div className="alert">{error}</div>;
  if (!progress || !subscription) return <Loading label="Loading your dashboard..." />;

  const readinessScore = progress.length
    ? Math.round(progress.reduce((sum, item) => sum + Number(item.avg_score), 0) / progress.length)
    : 0;
  const weakestArea = [...progress].sort((a, b) => Number(a.avg_score) - Number(b.avg_score))[0];
  const completedQuestions = attempts.filter((attempt) => attempt.status === 'graded' || attempt.status === 'submitted').length;
  const logbookPct = logbook?.progress
    ? Math.round((logbook.progress.approved_count / logbook.progress.required_entries) * 100)
    : 0;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Welcome back, {user.name?.split(' ')[0]}</h1>
          <div className="sub">{user.program || 'EMS competency dashboard'} &middot; {user.institution || 'MedProHub'}</div>
        </div>
      </div>

      <div className="vitals">
        <Vital label="Exam readiness" value={`${readinessScore}%`} />
        <Vital label="Questions completed" value={completedQuestions} />
        <Vital label="Competency score" value={`${readinessScore}%`} />
        <Vital label="Weak area" value={weakestArea ? weakestArea.domain : '-'} />
        <Vital label="Subscription" value={subscription.active ? 'Active' : 'Inactive'} />
        <Vital label="Logbook progress" value={`${logbookPct}%`} />
      </div>

      <div className="card">
        <h2>Recent exam activity</h2>
        <table>
          <thead><tr><th>Assessment</th><th>Type</th><th>Status</th><th>Score</th></tr></thead>
          <tbody>
            {attempts.map((attempt) => (
              <tr key={attempt.attempt_id}>
                <td>{attempt.title}</td>
                <td>{attempt.type}</td>
                <td><span className={`badge ${attempt.status}`}>{attempt.status}</span></td>
                <td className="num">{attempt.score_pct != null ? `${attempt.score_pct}%` : '-'}</td>
              </tr>
            ))}
            {attempts.length === 0 && <tr><td colSpan="4" style={{ color: 'var(--ink-soft)' }}>No attempts yet - visit Assessments to get started.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>Performance by domain</h2>
        <table>
          <thead><tr><th>Domain</th><th>Avg score</th><th>Attempts</th></tr></thead>
          <tbody>
            {progress.map((item) => (
              <tr key={item.domain}>
                <td style={{ textTransform: 'capitalize' }}>{item.domain}</td>
                <td className="num">{item.avg_score}%</td>
                <td className="num">{item.attempts}</td>
              </tr>
            ))}
            {progress.length === 0 && <tr><td colSpan="3" style={{ color: 'var(--ink-soft)' }}>No performance data yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="form-grid">
        <Link to="/student/exam-preparation"><div className="card" style={{ cursor: 'pointer' }}><h2>Exam preparation</h2><p style={{ color: 'var(--ink-soft)', fontSize: 13 }}>Question bank, mock exams, CATs, and assessment practice.</p></div></Link>
        <Link to="/student/flashcards"><div className="card" style={{ cursor: 'pointer' }}><h2>Clinical recall cards</h2><p style={{ color: 'var(--ink-soft)', fontSize: 13 }}>Spaced repetition for critical EMS knowledge points.</p></div></Link>
        <Link to="/student/reference-cards"><div className="card" style={{ cursor: 'pointer' }}><h2>Clinical reference cards</h2><p style={{ color: 'var(--ink-soft)', fontSize: 13 }}>Visual bedside references for anatomy, ECGs, and procedures.</p></div></Link>
        <Link to="/student/progress-analytics"><div className="card" style={{ cursor: 'pointer' }}><h2>Progress analytics</h2><p style={{ color: 'var(--ink-soft)', fontSize: 13 }}>Track readiness, weak areas, and competency trends.</p></div></Link>
      </div>
    </>
  );
}
