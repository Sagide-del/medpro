import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Loading from '../shared/Loading';

function SubmissionDetail({ submissionId, onBack, onSaved }) {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api(`/assignment-workflow/teacher/submissions/${submissionId}`).then(setData).catch((err) => setStatus({ kind: 'err', text: err.message }));
  }, [submissionId]);

  async function save(release) {
    setBusy(true);
    setStatus(null);
    try {
      await api(`/assignment-workflow/teacher/submissions/${submissionId}/grade`, {
        method: 'PATCH',
        body: {
          release,
          teacherComments: data.submission.teacher_comments || '',
          answers: data.answers.map((answer) => ({
            assignmentAnswerId: answer.assignment_answer_id,
            pointsAwarded: Number(answer.points_awarded || 0),
            feedback: answer.feedback || '',
          })),
        },
      });
      setStatus({ kind: 'ok', text: release ? 'Feedback released to the student.' : 'Marks saved.' });
      onSaved();
    } catch (err) {
      setStatus({ kind: 'err', text: err.message });
    } finally {
      setBusy(false);
    }
  }

  if (!data) return <Loading label="Loading submission..." />;

  return (
    <div className="card">
      <h2>{data.submission.title}</h2>
      <p style={{ color: 'var(--ink-soft)' }}>{data.submission.full_name} &middot; {data.submission.email}</p>
      {data.answers.map((answer, index) => (
        <div key={answer.assignment_answer_id} style={{ borderTop: '1px solid var(--line)', paddingTop: 16, marginTop: 16 }}>
          <strong>Question {index + 1}</strong>
          <p>{answer.prompt}</p>
          <p><strong>Student answer:</strong> {answer.response || '-'}</p>
          <p style={{ color: 'var(--ink-soft)' }}><strong>Model answer:</strong> {answer.correct_answer || '-'}</p>
          <div className="form-grid">
            <div className="field"><label>Points awarded</label><input type="number" value={answer.points_awarded || 0} onChange={(event) => setData({ ...data, answers: data.answers.map((item) => item.assignment_answer_id === answer.assignment_answer_id ? { ...item, points_awarded: event.target.value } : item) })} /></div>
            <div className="field"><label>Feedback</label><textarea rows="2" value={answer.feedback || ''} onChange={(event) => setData({ ...data, answers: data.answers.map((item) => item.assignment_answer_id === answer.assignment_answer_id ? { ...item, feedback: event.target.value } : item) })} /></div>
          </div>
          {data.suggestions[index] && <div className="alert info">AI suggestion: {data.suggestions[index].reasoning} Suggested feedback: {data.suggestions[index].feedback}</div>}
        </div>
      ))}
      <div className="field"><label>Teacher comments</label><textarea rows="3" value={data.submission.teacher_comments || ''} onChange={(event) => setData({ ...data, submission: { ...data.submission, teacher_comments: event.target.value } })} /></div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="primary" onClick={() => save(false)} disabled={busy}>{busy ? 'Saving...' : 'Save marks'}</button>
        <button className="ghost" onClick={() => save(true)} disabled={busy}>{busy ? 'Releasing...' : 'Release feedback'}</button>
        <button className="ghost" onClick={onBack}>Back</button>
      </div>
      {status && <div className={status.kind === 'ok' ? 'ok-note' : 'error-note'}>{status.text}</div>}
    </div>
  );
}

export default function MarkingQueue() {
  const [submissions, setSubmissions] = useState(null);
  const [selected, setSelected] = useState('');
  const [error, setError] = useState('');

  function load() {
    api('/assignment-workflow/teacher/submissions').then((data) => setSubmissions(data.submissions)).catch((err) => setError(err.message));
  }

  useEffect(load, []);

  if (error) return <div className="alert">{error}</div>;
  if (!submissions) return <Loading label="Loading marking queue..." />;
  if (selected) return <SubmissionDetail submissionId={selected} onBack={() => setSelected('')} onSaved={load} />;

  const pending = submissions.filter((submission) => submission.status === 'submitted');
  const completed = submissions.filter((submission) => submission.status === 'graded');

  return (
    <>
      <div className="page-head"><div><h1>Marking Queue</h1><div className="sub">Review submissions, assign marks, and release feedback.</div></div></div>
      <div className="vitals">
        <div className="vital"><div className="label">Pending</div><div className="value">{pending.length}</div></div>
        <div className="vital"><div className="label">Completed</div><div className="value">{completed.length}</div></div>
        <div className="vital"><div className="label">Average scores tracked</div><div className="value">{completed.length}</div></div>
      </div>
      <div className="card">
        <table>
          <thead><tr><th>Student</th><th>Assignment</th><th>Status</th><th>Submitted</th><th></th></tr></thead>
          <tbody>
            {submissions.map((submission) => (
              <tr key={submission.submission_id}>
                <td>{submission.full_name}<br /><span style={{ color: 'var(--ink-soft)', fontSize: 12 }}>{submission.email}</span></td>
                <td>{submission.title}<br /><span style={{ color: 'var(--ink-soft)', fontSize: 12 }}>{submission.group_name}</span></td>
                <td><span className={`badge ${submission.status}`}>{submission.status}</span></td>
                <td className="num">{submission.submitted_at ? new Date(submission.submitted_at).toLocaleString('en-KE') : '-'}</td>
                <td><button className="ghost" onClick={() => setSelected(submission.submission_id)}>Open</button></td>
              </tr>
            ))}
            {submissions.length === 0 && <tr><td colSpan="5" style={{ color: 'var(--ink-soft)' }}>No submissions yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
