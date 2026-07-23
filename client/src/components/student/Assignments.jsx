import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../services/api';
import Loading from '../shared/Loading';
import SubscriptionPrompt from './SubscriptionPrompt';

function AssignmentList() {
  const [assignments, setAssignments] = useState(null);
  const [error, setError] = useState('');
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    api('/assignment-workflow/student/assignments')
      .then((data) => setAssignments(data.assignments))
      .catch((err) => {
        if (err.code === 'SUBSCRIPTION_REQUIRED') {
          setSubscription(err.subscription);
          setAssignments([]);
          return;
        }
        setError(err.message);
      });
  }, []);

  if (error) return <div className="alert">{error}</div>;
  if (subscription) return <SubscriptionPrompt subscription={subscription} title="Subscription required for Assignments" />;
  if (!assignments) return <Loading label="Loading assignments..." />;

  return (
    <>
      <div className="page-head"><div><h1>Assignments</h1><div className="sub">New assignments, due dates, time limits, and submission status.</div></div></div>
      <div className="form-grid">
        {assignments.map((assignment) => (
          <Link key={assignment.assignment_id} to={`/student/assignments/${assignment.assignment_id}`} style={{ textDecoration: 'none' }}>
            <div className="card">
              <h2>{assignment.title}</h2>
              <p style={{ color: 'var(--ink-soft)', fontSize: 13 }}>{assignment.topic}</p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                <span className="badge draft">{assignment.program}</span>
                <span className="badge draft">{assignment.module}</span>
                <span className={`badge ${assignment.submission_status || 'draft'}`}>{assignment.submission_status || 'new'}</span>
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>
                Due: {assignment.due_date ? new Date(assignment.due_date).toLocaleString('en-KE') : 'No due date'}<br />
                Time limit: {assignment.time_limit_minutes || 'Untimed'} minutes
              </div>
            </div>
          </Link>
        ))}
        {assignments.length === 0 && <div className="card"><p style={{ color: 'var(--ink-soft)', marginBottom: 0 }}>No assignments have been assigned to you yet.</p></div>}
      </div>
    </>
  );
}

export default function StudentAssignments() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    if (!id) return;
    api(`/assignment-workflow/student/assignments/${id}`).then((data) => {
      setAssignment(data.assignment);
      setQuestions(data.questions);
    }).catch((err) => {
      if (err.code === 'SUBSCRIPTION_REQUIRED') {
        setSubscription(err.subscription);
        return;
      }
      setError(err.message);
    });
  }, [id]);

  useEffect(() => {
    if (!id || !assignment?.released_at) return;
    api(`/assignment-workflow/student/assignments/${id}/results`).then(setResult).catch(() => {});
  }, [id, assignment?.released_at]);

  async function start() {
    setBusy(true);
    try {
      await api(`/assignment-workflow/student/assignments/${id}/start`, { method: 'POST' });
      setStatus('Assignment started. Complete your responses and submit when ready.');
    } catch (err) {
      if (err.code === 'SUBSCRIPTION_REQUIRED') {
        setSubscription(err.subscription);
      } else {
        setError(err.message);
      }
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    setBusy(true);
    try {
      await api(`/assignment-workflow/student/assignments/${id}/submit`, {
        method: 'POST',
        body: {
          answers: questions.map((question) => ({
            assignmentQuestionId: question.assignment_question_id,
            response: answers[question.assignment_question_id] || '',
          })),
        },
      });
      setStatus('Assignment submitted. Your teacher will release feedback when marking is complete.');
      navigate('/student/assignments');
    } catch (err) {
      if (err.code === 'SUBSCRIPTION_REQUIRED') {
        setSubscription(err.subscription);
      } else {
        setError(err.message);
      }
    } finally {
      setBusy(false);
    }
  }

  if (!id) return <AssignmentList />;
  if (error) return <div className="alert">{error}</div>;
  if (subscription) return <SubscriptionPrompt subscription={subscription} title="Subscription required for Assignments" />;
  if (!assignment) return <Loading label="Loading assignment..." />;

  if (result && result.submission?.released_at) {
    return (
      <>
        <div className="page-head"><div><h1>{result.assignment.title}</h1><div className="sub">Released feedback and recommendations</div></div></div>
        <div className="card">
          <p><strong>Score:</strong> {result.submission.score_pct != null ? `${result.submission.score_pct}%` : '-'}</p>
          <p><strong>Teacher comments:</strong> {result.submission.teacher_comments || result.feedback?.teacher_comments || 'No comments yet.'}</p>
          <p><strong>Weak topics:</strong> {(result.feedback?.weak_topics || []).join(', ') || 'None recorded.'}</p>
          <p><strong>Recommended Clinical Reference Cards:</strong></p>
          <ul>
            {(result.feedback?.recommended_cards || []).map((card) => <li key={card.clinical_card_id}>{card.title} ({card.topic})</li>)}
          </ul>
          <p><strong>Recommended Simulations:</strong></p>
          <ul>
            {(result.feedback?.recommended_simulations || []).map((item, index) => <li key={index}>{item}</li>)}
          </ul>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="page-head"><div><h1>{assignment.title}</h1><div className="sub">{assignment.topic} &middot; Due {assignment.due_date ? new Date(assignment.due_date).toLocaleString('en-KE') : 'No due date'}</div></div></div>
      <div className="card">
        <p><strong>Status:</strong> {assignment.submission_status || 'new'}</p>
        <p><strong>Time limit:</strong> {assignment.time_limit_minutes || 'Untimed'} minutes</p>
        {!assignment.submission_status && <button className="primary" onClick={start} disabled={busy}>{busy ? 'Starting...' : 'Start assignment'}</button>}
        {status && <div className="ok-note">{status}</div>}
      </div>
      {questions.map((question, index) => (
        <div className="card" key={question.assignment_question_id}>
          <h2>Question {index + 1}</h2>
          <p>{question.prompt}</p>
          {question.question_type === 'mcq' && question.options ? (
            JSON.parse(typeof question.options === 'string' ? question.options : JSON.stringify(question.options)).map((option) => (
              <label key={option} style={{ display: 'block', fontWeight: 400, marginBottom: 6 }}>
                <input
                  type="radio"
                  name={question.assignment_question_id}
                  value={option}
                  style={{ width: 'auto', marginRight: 8 }}
                  checked={answers[question.assignment_question_id] === option}
                  onChange={() => setAnswers({ ...answers, [question.assignment_question_id]: option })}
                />
                {option}
              </label>
            ))
          ) : (
            <textarea rows="3" value={answers[question.assignment_question_id] || ''} onChange={(event) => setAnswers({ ...answers, [question.assignment_question_id]: event.target.value })} />
          )}
        </div>
      ))}
      <button className="primary" onClick={submit} disabled={busy}>{busy ? 'Submitting...' : 'Submit assignment'}</button>
    </>
  );
}
