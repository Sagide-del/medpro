import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Loading from '../shared/Loading';

function getScriptFocus(assignment) {
  const title = (assignment.title || '').trim();
  if (!title) return 'Clinical skill demonstration';
  return title.replace(/^video\s*/i, '').replace(/\s+/g, ' ').trim();
}

export default function Videos() {
  const [assignments, setAssignments] = useState(null);
  const [status, setStatus] = useState('');
  const [files, setFiles] = useState({});
  const [notes, setNotes] = useState({});
  const [busyId, setBusyId] = useState('');

  async function load() {
    const data = await api('/practical-videos');
    setAssignments(data.assignments);
  }

  useEffect(() => {
    load().catch((error) => setStatus(error.message));
  }, []);

  async function upload(assignmentId) {
    const file = files[assignmentId];
    if (!file) return;
    setBusyId(assignmentId);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('notes', notes[assignmentId] || '');
      await api(`/practical-videos/${assignmentId}/submit`, { method: 'POST', body: formData });
      setStatus('Practical video uploaded successfully.');
      setFiles({ ...files, [assignmentId]: null });
      setNotes({ ...notes, [assignmentId]: '' });
      await load();
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusyId('');
    }
  }

  if (!assignments) return <Loading label="Loading clinical skills..." />;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Clinical skills videos</h1>
        </div>
      </div>

      {status && <div className="ok-note">{status}</div>}

      {assignments.map((assignment) => (
        <div className="card" key={assignment.assignment_id}>
          <div className="video-workflow-head">
            <div>
              <h2>{getScriptFocus(assignment)}</h2>
              <div className="sub">Record the assigned demonstration as a clean clinical performance video.</div>
            </div>
            <span className={`badge ${assignment.submission_status || 'submitted'}`}>{assignment.submission_status || 'not submitted'}</span>
          </div>

          <div className="video-script-card">
            <div className="video-script-label">Performance script</div>
            <div className="video-script-text">{assignment.instructions || 'Use the assigned clinical script and demonstrate the required steps clearly.'}</div>
          </div>

          <div className="video-meta-row">
            <span>Due: {assignment.due_date ? new Date(assignment.due_date).toLocaleString('en-KE') : 'Open submission'}</span>
            <span>Review: {assignment.released_at ? 'Released' : 'Pending teacher release'}</span>
            <span>Evaluation: transcript + skills</span>
          </div>

          <div className="field" style={{ marginTop: 16 }}>
            <label>Script notes</label>
            <textarea rows="3" value={notes[assignment.assignment_id] || ''} onChange={(event) => setNotes({ ...notes, [assignment.assignment_id]: event.target.value })} />
          </div>
          <div className="field">
            <label>Upload performance video</label>
            <input type="file" accept="video/*" onChange={(event) => setFiles({ ...files, [assignment.assignment_id]: event.target.files?.[0] || null })} />
          </div>
          <button type="button" className="primary" disabled={!files[assignment.assignment_id] || busyId === assignment.assignment_id} onClick={() => upload(assignment.assignment_id)}>
            {busyId === assignment.assignment_id ? 'Uploading...' : 'Upload submission'}
          </button>
          {assignment.file_url && (
            <p style={{ marginTop: 14 }}>
              <a href={assignment.file_url} target="_blank" rel="noreferrer">View your uploaded submission</a>
            </p>
          )}
          {assignment.teacher_feedback && <div className="ok-note">Teacher feedback: {assignment.teacher_feedback}</div>}
        </div>
      ))}

      {assignments.length === 0 && <div className="card"><div className="sub">No practical video assignments have been issued yet.</div></div>}
    </>
  );
}
