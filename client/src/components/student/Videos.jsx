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
          <h1>Podcasts</h1>
          <div className="sub">Short audio reviews for EMT and Paramedic revision.</div>
        </div>
      </div>

      <section className="podcast-feature" aria-labelledby="toddler-airway-title">
        <div className="podcast-feature-art" aria-hidden="true"><span>01</span><strong>EMS<br />Audio Review</strong></div>
        <div className="podcast-feature-content">
          <div className="podcast-kicker">Airway management · Pediatrics</div>
          <h2 id="toddler-airway-title">Airway Management in Toddlers</h2>
          <p>Scene priorities, foreign-body obstruction, oxygenation, and rapid reassessment in a deteriorating toddler.</p>
          <audio className="podcast-player" controls preload="metadata">
            <source src="/audio/airway-management-toddlers.wav" type="audio/wav" />
            Your browser does not support audio playback.
          </audio>
          <details className="podcast-transcript"><summary>Open transcript and key takeaways</summary><p>Start with scene safety and assess responsiveness. Call for help early and use the pediatric assessment triangle: appearance, work of breathing, and circulation to skin. Keep the child with the caregiver where possible and avoid unnecessary agitation. Assess breathing and oxygen saturation, then provide oxygen according to the child&apos;s condition and local protocol.</p><p>For a responsive child with a suspected foreign body, encourage an effective cough. If the cough becomes ineffective, use age-appropriate back blows and chest thrusts for an infant, or back blows and abdominal thrusts for a child older than one year. Do not perform blind finger sweeps. If the child becomes unresponsive, begin CPR and inspect the mouth only when opening the airway for ventilation.</p><ul><li>Use appropriately sized equipment and gentle ventilations.</li><li>Remember toddlers have smaller airways and limited respiratory reserve.</li><li>Reassess continuously and transport rapidly when the child remains unstable.</li></ul></details>
        </div>
      </section>

      {status && <div className="ok-note">{status}</div>}

      {assignments.length > 0 && <h2 className="podcast-assignment-heading">Clinical video assignments</h2>}

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
