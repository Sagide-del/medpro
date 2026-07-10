import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import Loading from '../shared/Loading';

function AssessmentList() {
  const [assessments, setAssessments] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/assessments').then((d) => setAssessments(d.assessments)).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="alert">{error}</div>;
  if (!assessments) return <Loading label="Loading assessments…" />;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Assessments</h1>
          <div className="sub">Quizzes, exams, and clinical judgment scenarios</div>
        </div>
      </div>
      <div className="form-grid">
        {assessments.map((a) => (
          <Link key={a.assessment_id} to={`/student/assessments/${a.assessment_id}`} style={{ textDecoration: 'none' }}>
            <div className="card">
              <h2>{a.title}</h2>
              <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 8 }}>{a.description}</p>
              <span className="badge draft" style={{ marginRight: 6 }}>{a.type}</span>
              <span className="badge draft">{a.difficulty}</span>
              <div style={{ marginTop: 10, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-soft)' }}>
                {a.total_points} pts &middot; {a.time_limit_minutes ? `${a.time_limit_minutes} min` : 'untimed'}
              </div>
            </div>
          </Link>
        ))}
        {assessments.length === 0 && <p style={{ color: 'var(--ink-soft)' }}>No assessments published yet.</p>}
      </div>
    </>
  );
}

function TakeAssessment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [unlocked, setUnlocked] = useState(true);
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [phone, setPhone] = useState('');
  const [subStatus, setSubStatus] = useState('');

  useEffect(() => {
    api(`/assessments/${id}`).then((d) => { setAssessment(d.assessment); setQuestions(d.questions); setUnlocked(d.unlocked !== false); }).catch((e) => setError(e.message));
  }, [id]);

  async function subscribe() {
    setBusy(true); setSubStatus('');
    try {
      const res = await api('/payments/subscribe', { method: 'POST', body: { phone } });
      setSubStatus(res.simulated ? 'Subscription activated (dev mode) — reloading…' : 'Check your phone to complete the M-Pesa payment.');
      if (res.simulated) {
        const d = await api(`/assessments/${id}`);
        setQuestions(d.questions);
        setUnlocked(d.unlocked !== false);
      }
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  async function begin() {
    setBusy(true);
    try {
      const { attempt } = await api(`/assessments/${id}/attempts`, { method: 'POST' });
      setAttempt(attempt);
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  async function submit() {
    setBusy(true); setError('');
    try {
      const payload = { answers: Object.entries(answers).map(([questionId, response]) => ({ questionId, response })) };
      const { attempt: graded, needsManualReview } = await api(`/assessments/${id}/attempts/${attempt.attempt_id}/submit`, { method: 'POST', body: payload });
      setResult({ ...graded, needsManualReview });
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  if (error) return <div className="alert">{error}</div>;
  if (!assessment) return <Loading />;

  if (result) {
    return (
      <div className="card">
        <h2>Results — {assessment.title}</h2>
        <p style={{ fontSize: 28, fontFamily: 'var(--font-mono)', color: 'var(--red)', margin: '10px 0' }}>{result.score_pct}%</p>
        {result.needsManualReview && <div className="alert info">Scenario steps in this assessment are pending teacher review — your final score may change.</div>}
        <button onClick={() => navigate('/student/assessments')}>Back to assessments</button>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="card">
        <h1>{assessment.title}</h1>
        <p style={{ color: 'var(--ink-soft)', margin: '10px 0' }}>{assessment.description}</p>
        <div className="alert info" style={{ marginBottom: 14 }}>
          This assessment requires an active subscription — Ksh 500/month unlocks every published assessment. Institutions with a MedPro site-license cover this automatically for their students.
        </div>
        <div className="field">
          <label htmlFor="phone">M-Pesa phone number</label>
          <input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XX XXX XXX" />
        </div>
        <button className="primary" onClick={subscribe} disabled={busy || !phone} style={{ marginTop: 10 }}>
          {busy ? 'Processing…' : 'Subscribe — Ksh 500/month'}
        </button>
        {subStatus && <p style={{ marginTop: 10, fontSize: 13 }}>{subStatus}</p>}
        {error && <div className="error-note">{error}</div>}
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="card">
        <h1>{assessment.title}</h1>
        <p style={{ color: 'var(--ink-soft)', margin: '10px 0' }}>{assessment.description}</p>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>
          {questions.length} questions &middot; {assessment.total_points} pts &middot; pass at {assessment.passing_score_pct}%
        </p>
        <button className="primary" onClick={begin} disabled={busy} style={{ marginTop: 14 }}>
          {busy ? 'Starting…' : 'Start attempt'}
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="page-head"><h1>{assessment.title}</h1></div>
      {questions.map((q, i) => (
        <div className="card" key={q.question_id}>
          <h2>Question {i + 1} {q.clinical_step && <span className="badge draft">{q.clinical_step.replace(/_/g, ' ')}</span>}</h2>
          <p style={{ marginBottom: 10 }}>{q.prompt}</p>
          {q.question_type === 'mcq' && q.options ? (
            <div>
              {JSON.parse(typeof q.options === 'string' ? q.options : JSON.stringify(q.options)).map((opt) => (
                <label key={opt} style={{ display: 'block', fontWeight: 400, marginBottom: 6 }}>
                  <input type="radio" name={q.question_id} value={opt} style={{ width: 'auto', marginRight: 8 }}
                    checked={answers[q.question_id] === opt}
                    onChange={() => setAnswers((a) => ({ ...a, [q.question_id]: opt }))} />
                  {opt}
                </label>
              ))}
            </div>
          ) : (
            <textarea rows="3" value={answers[q.question_id] || ''} onChange={(e) => setAnswers((a) => ({ ...a, [q.question_id]: e.target.value }))} />
          )}
        </div>
      ))}
      {error && <div className="error-note">{error}</div>}
      <button className="primary" onClick={submit} disabled={busy}>{busy ? 'Submitting…' : 'Submit assessment'}</button>
    </>
  );
}

export default function Assessments() {
  const { id } = useParams();
  return id ? <TakeAssessment /> : <AssessmentList />;
}
