import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Loading from '../shared/Loading';

export default function GradeSubmissions() {
  const [assessments, setAssessments] = useState(null);
  const [selected, setSelected] = useState('');
  const [attempts, setAttempts] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(null);

  useEffect(() => {
    api('/assessments').then((d) => setAssessments(d.assessments)).catch((e) => setError(e.message));
  }, []);

  function loadAttempts(assessmentId) {
    setSelected(assessmentId);
    api(`/assessments/${assessmentId}/attempts`).then((d) => setAttempts(d.attempts)).catch((e) => setError(e.message));
  }

  async function grade(attemptId, scorePct) {
    setBusy(attemptId);
    try {
      await api(`/assessments/attempts/${attemptId}/grade`, { method: 'PATCH', body: { scorePct: Number(scorePct) } });
      loadAttempts(selected);
    } catch (e) { setError(e.message); } finally { setBusy(null); }
  }

  if (error) return <div className="alert">{error}</div>;
  if (!assessments) return <Loading label="Loading assessments…" />;

  return (
    <>
      <div className="page-head"><div><h1>Grade submissions</h1><div className="sub">Review scenario steps and finalize scores</div></div></div>

      <div className="card">
        <div className="field" style={{ maxWidth: 360 }}>
          <label htmlFor="assessment">Assessment</label>
          <select id="assessment" value={selected} onChange={(e) => loadAttempts(e.target.value)}>
            <option value="">Select an assessment</option>
            {assessments.map((a) => <option key={a.assessment_id} value={a.assessment_id}>{a.title}</option>)}
          </select>
        </div>
      </div>

      {selected && (
        <div className="card">
          <h2>Attempts</h2>
          <table>
            <thead><tr><th>Student</th><th>Status</th><th>Score</th><th>Update score</th></tr></thead>
            <tbody>
              {attempts.map((a) => (
                <tr key={a.attempt_id}>
                  <td>{a.full_name}<br /><span style={{ color: 'var(--ink-soft)', fontSize: 12 }}>{a.email}</span></td>
                  <td><span className={`badge ${a.status}`}>{a.status}</span></td>
                  <td className="num">{a.score_pct != null ? `${a.score_pct}%` : '—'}</td>
                  <td>
                    <input
                      type="number" defaultValue={a.score_pct || ''} style={{ width: 80, display: 'inline-block' }}
                      disabled={busy === a.attempt_id}
                      onKeyDown={(e) => { if (e.key === 'Enter') grade(a.attempt_id, e.target.value); }}
                    />
                  </td>
                </tr>
              ))}
              {attempts.length === 0 && <tr><td colSpan="4" style={{ color: 'var(--ink-soft)' }}>No attempts yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
