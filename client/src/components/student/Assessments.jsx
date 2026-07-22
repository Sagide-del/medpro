import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { api } from '../../services/api';
import Loading from '../shared/Loading';

const VIEW_META = {
  '/student/question-bank': {
    title: 'Question Bank',
    subtitle: 'Browse published EMS question sets, quizzes, and clinical judgment items.',
  },
  '/student/mock-exams': {
    title: 'Mock Exams',
    subtitle: 'Use the current assessment catalogue as realistic exam-preparation practice.',
  },
  '/student/cats': {
    title: 'CATs',
    subtitle: 'Continuous assessment practice powered by the live MedProHub assessment engine.',
  },
  '/student/assessments': {
    title: 'Assessments',
    subtitle: 'Quizzes, exams, and clinical judgment scenarios.',
  },
};

function AssessmentList() {
  const location = useLocation();
  const [assessments, setAssessments] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/assessments').then((data) => setAssessments(data.assessments)).catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="alert">{error}</div>;
  if (!assessments) return <Loading label="Loading assessments..." />;

  const meta = VIEW_META[location.pathname] || VIEW_META['/student/assessments'];

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{meta.title}</h1>
          <div className="sub">{meta.subtitle}</div>
        </div>
      </div>
      <div className="form-grid">
        {assessments.map((assessment) => (
          <Link key={assessment.assessment_id} to={`/student/assessments/${assessment.assessment_id}`} style={{ textDecoration: 'none' }}>
            <div className="card">
              <h2>{assessment.title}</h2>
              <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 8 }}>{assessment.description}</p>
              <span className="badge draft" style={{ marginRight: 6 }}>{assessment.type}</span>
              <span className="badge draft">{assessment.difficulty}</span>
              <div style={{ marginTop: 10, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-soft)' }}>
                {assessment.total_points} pts &middot; {assessment.time_limit_minutes ? `${assessment.time_limit_minutes} min` : 'untimed'}
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
  const [subscriptionMeta, setSubscriptionMeta] = useState(null);

  useEffect(() => {
    api(`/assessments/${id}`).then((data) => {
      setAssessment(data.assessment);
      setQuestions(data.questions);
      setUnlocked(data.unlocked !== false);
    }).catch((err) => setError(err.message));
    api('/payments/subscription').then((data) => setSubscriptionMeta(data)).catch(() => {});
  }, [id]);

  async function subscribe() {
    setBusy(true);
    setSubStatus('');
    try {
      const res = await api('/payments/subscribe', { method: 'POST', body: { phone } });
      setSubStatus(res.simulated ? 'Subscription activated (dev mode) - reloading...' : 'Check your phone to complete the M-Pesa payment.');
      if (res.simulated) {
        const data = await api(`/assessments/${id}`);
        setQuestions(data.questions);
        setUnlocked(data.unlocked !== false);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function begin() {
    setBusy(true);
    try {
      const response = await api(`/assessments/${id}/attempts`, { method: 'POST' });
      setAttempt(response.attempt);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    setBusy(true);
    setError('');
    try {
      const payload = { answers: Object.entries(answers).map(([questionId, response]) => ({ questionId, response })) };
      const response = await api(`/assessments/${id}/attempts/${attempt.attempt_id}/submit`, { method: 'POST', body: payload });
      setResult({ ...response.attempt, needsManualReview: response.needsManualReview });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (error) return <div className="alert">{error}</div>;
  if (!assessment) return <Loading />;

  if (result) {
    return (
      <div className="card">
        <h2>Results - {assessment.title}</h2>
        <p style={{ fontSize: 28, fontFamily: 'var(--font-mono)', color: 'var(--red)', margin: '10px 0' }}>{result.score_pct}%</p>
        {result.needsManualReview && <div className="alert info">Scenario steps in this assessment are pending teacher review - your final score may change.</div>}
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
          This assessment requires an active subscription - Ksh {subscriptionMeta?.price ?? 500}/month unlocks every
          published assessment. Institutions with a MedPro site-license cover this automatically for their students.
        </div>
        <div className="field">
          <label htmlFor="phone">M-Pesa phone number</label>
          <input id="phone" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="07XX XXX XXX" />
        </div>
        <button className="primary" onClick={subscribe} disabled={busy || !phone} style={{ marginTop: 10 }}>
          {busy ? 'Processing...' : `Subscribe - Ksh ${subscriptionMeta?.price ?? 500}/month`}
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
          {busy ? 'Starting...' : 'Start attempt'}
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="page-head"><h1>{assessment.title}</h1></div>
      {questions.map((question, index) => (
        <div className="card" key={question.question_id}>
          <h2>Question {index + 1} {question.clinical_step && <span className="badge draft">{question.clinical_step.replace(/_/g, ' ')}</span>}</h2>
          <p style={{ marginBottom: 10 }}>{question.prompt}</p>
          {question.question_type === 'mcq' && question.options ? (
            <div>
              {JSON.parse(typeof question.options === 'string' ? question.options : JSON.stringify(question.options)).map((option) => (
                <label key={option} style={{ display: 'block', fontWeight: 400, marginBottom: 6 }}>
                  <input
                    type="radio"
                    name={question.question_id}
                    value={option}
                    style={{ width: 'auto', marginRight: 8 }}
                    checked={answers[question.question_id] === option}
                    onChange={() => setAnswers((current) => ({ ...current, [question.question_id]: option }))}
                  />
                  {option}
                </label>
              ))}
            </div>
          ) : (
            <textarea rows="3" value={answers[question.question_id] || ''} onChange={(event) => setAnswers((current) => ({ ...current, [question.question_id]: event.target.value }))} />
          )}
        </div>
      ))}
      {error && <div className="error-note">{error}</div>}
      <button className="primary" onClick={submit} disabled={busy}>{busy ? 'Submitting...' : 'Submit assessment'}</button>
    </>
  );
}

export default function Assessments() {
  const { id } = useParams();
  return id ? <TakeAssessment /> : <AssessmentList />;
}
