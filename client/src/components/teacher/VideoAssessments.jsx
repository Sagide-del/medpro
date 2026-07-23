import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Loading from '../shared/Loading';

const emptyForm = {
  title: '',
  instructions: '',
  dueDate: '',
  checklist: '',
  studentIds: '',
  groupIds: '',
  status: 'draft',
};

export default function VideoAssessments() {
  const [data, setData] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [reviewState, setReviewState] = useState({});

  async function load() {
    const [assignments, queue] = await Promise.all([
      api('/practical-videos'),
      api('/practical-videos/review-queue/all'),
    ]);
    setData({ assignments: assignments.assignments, submissions: queue.submissions });
  }

  useEffect(() => {
    load().catch((error) => setStatus(error.message));
  }, []);

  async function createAssignment() {
    setBusy(true);
    setStatus('');
    try {
      await api('/practical-videos', {
        method: 'POST',
        body: {
          title: form.title,
          instructions: form.instructions,
          dueDate: form.dueDate || null,
          status: form.status,
          markingChecklist: form.checklist.split('\n').map((line) => line.trim()).filter(Boolean).map((label) => ({ label, checked: false })),
          studentIds: form.studentIds.split(',').map((item) => item.trim()).filter(Boolean),
          groupIds: form.groupIds.split(',').map((item) => item.trim()).filter(Boolean),
        },
      });
      setForm(emptyForm);
      setStatus('Practical video assignment created.');
      await load();
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function updateAssignment(assignmentId, nextStatus) {
    await api(`/practical-videos/${assignmentId}`, { method: 'PATCH', body: { status: nextStatus } });
    await load();
  }

  async function removeAssignment(assignmentId) {
    await api(`/practical-videos/${assignmentId}`, { method: 'DELETE' });
    await load();
  }

  async function submitReview(submissionId) {
    const current = reviewState[submissionId] || {};
    await api(`/practical-videos/submissions/${submissionId}/review`, {
      method: 'PATCH',
      body: {
        status: current.status || 'approved',
        teacherFeedback: current.feedback || '',
        releaseResult: true,
        checklistResults: (current.checklist || '').split('\n').map((line) => line.trim()).filter(Boolean).map((label) => ({
          label,
          checked: true,
        })),
      },
    });
    await load();
  }

  if (!data) return <Loading label="Loading practical video workflow..." />;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Practical video assessments</h1>
          <div className="sub">Create instructor-requested demonstration tasks and release reviewed results.</div>
        </div>
      </div>

      <div className="card">
        <h2>Create practical video assignment</h2>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="video-title">Title</label>
            <input id="video-title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="video-due">Due date</label>
            <input id="video-due" type="datetime-local" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="video-instructions">Instructions</label>
          <textarea id="video-instructions" rows="3" value={form.instructions} onChange={(event) => setForm({ ...form, instructions: event.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="video-checklist">Marking checklist (one item per line)</label>
          <textarea id="video-checklist" rows="4" value={form.checklist} onChange={(event) => setForm({ ...form, checklist: event.target.value })} />
        </div>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="video-students">Student IDs (comma separated)</label>
            <input id="video-students" value={form.studentIds} onChange={(event) => setForm({ ...form, studentIds: event.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="video-groups">Group IDs (comma separated)</label>
            <input id="video-groups" value={form.groupIds} onChange={(event) => setForm({ ...form, groupIds: event.target.value })} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="video-status">Publish status</label>
          <select id="video-status" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
        <button className="primary" onClick={createAssignment} disabled={busy || !form.title}>
          {busy ? 'Saving...' : 'Create assignment'}
        </button>
        {status && <div className="ok-note">{status}</div>}
      </div>

      <div className="card">
        <h2>Assignments</h2>
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Targets</th>
              <th>Submissions</th>
              <th>Due</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.assignments.map((assignment) => (
              <tr key={assignment.assignment_id}>
                <td>{assignment.title}</td>
                <td><span className={`badge ${assignment.status}`}>{assignment.status}</span></td>
                <td>{assignment.target_count}</td>
                <td>{assignment.submission_count}</td>
                <td>{assignment.due_date ? new Date(assignment.due_date).toLocaleString('en-KE') : 'Open'}</td>
                <td style={{ display: 'flex', gap: 8 }}>
                  <button className="ghost" onClick={() => updateAssignment(assignment.assignment_id, assignment.status === 'published' ? 'draft' : 'published')}>
                    {assignment.status === 'published' ? 'Unpublish' : 'Publish'}
                  </button>
                  <button className="ghost" onClick={() => removeAssignment(assignment.assignment_id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {data.assignments.length === 0 && (
              <tr>
                <td colSpan="6" style={{ color: 'var(--ink-soft)' }}>No practical video assignments yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>Review queue</h2>
        {data.submissions.map((submission) => (
          <div key={submission.submission_id} style={{ borderTop: '1px solid var(--line)', padding: '16px 0' }}>
            <h3 style={{ marginBottom: 6 }}>{submission.assignment_title}</h3>
            <div className="sub">{submission.student_name} • {submission.student_email}</div>
            <p style={{ marginTop: 10 }}><a href={submission.file_url} target="_blank" rel="noreferrer">View uploaded video</a></p>
            <div className="field">
              <label>Status</label>
              <select
                value={reviewState[submission.submission_id]?.status || submission.status}
                onChange={(event) => setReviewState({
                  ...reviewState,
                  [submission.submission_id]: { ...reviewState[submission.submission_id], status: event.target.value },
                })}
              >
                <option value="approved">Approved</option>
                <option value="revision_requested">Revision requested</option>
                <option value="rejected">Rejected</option>
                <option value="released">Released</option>
              </select>
            </div>
            <div className="field">
              <label>Marked checklist (one approved item per line)</label>
              <textarea
                rows="3"
                value={reviewState[submission.submission_id]?.checklist || ''}
                onChange={(event) => setReviewState({
                  ...reviewState,
                  [submission.submission_id]: { ...reviewState[submission.submission_id], checklist: event.target.value },
                })}
              />
            </div>
            <div className="field">
              <label>Feedback</label>
              <textarea
                rows="3"
                value={reviewState[submission.submission_id]?.feedback || ''}
                onChange={(event) => setReviewState({
                  ...reviewState,
                  [submission.submission_id]: { ...reviewState[submission.submission_id], feedback: event.target.value },
                })}
              />
            </div>
            <button className="primary" onClick={() => submitReview(submission.submission_id)}>Release result</button>
          </div>
        ))}
        {data.submissions.length === 0 && <div className="sub">No submissions pending review.</div>}
      </div>
    </>
  );
}
