import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Loading from '../shared/Loading';

const PODCASTS = [
  ['01-preparatory', 'Preparatory Care for EMS', 'Foundations', 'Safety, communication, consent, documentation, and professional practice.'],
  ['02-airway-management', 'Airway Management Across Age Groups', 'Airway', 'Toddlers, adults, injured patients, suction, adjuncts, and nasopharyngeal airways.'],
  ['03-patient-assessment', 'Patient Assessment', 'Assessment', 'Scene size-up, primary assessment, history, examination, trends, and reassessment.'],
  ['04-medical-obstetric', 'Medical, Behavioral, and Obstetric Emergencies', 'Medical', 'Time-critical illness, behavioral safety, pregnancy, postpartum haemorrhage, and eclampsia.'],
  ['05-trauma', 'Trauma Care', 'Trauma', 'Bleeding control, road traffic injury, shock, spinal considerations, and handover.'],
  ['06-infants-children', 'Infants and Children', 'Paediatrics', 'Recognition, age-appropriate equipment, respiratory distress, and early escalation.'],
  ['07-operations', 'EMS Operations', 'Operations', 'Dispatch, communications, readiness, mass-casualty coordination, and patient tracking.'],
  ['08-advanced-airway', 'Advanced Airway Concepts', 'Airway', 'Preparation, oxygenation, backup plans, monitoring, and escalation within scope.'],
  ['09-additional-review', 'Integrated EMT Review', 'Exam readiness', 'Prioritisation, clinical reasoning, time pressure, and Kenya-specific context.'],
];

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
  const [selectedPodcast, setSelectedPodcast] = useState(PODCASTS[1]);

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

      <section className="podcast-feature" aria-labelledby="podcast-title">
        <div className="podcast-feature-art" aria-hidden="true"><span>{selectedPodcast[0].slice(0, 2)}</span><strong>EMS<br />Audio Review</strong></div>
        <div className="podcast-feature-content">
          <div className="podcast-kicker">{selectedPodcast[2]} · Module audio</div>
          <h2 id="podcast-title">{selectedPodcast[1]}</h2>
          <p>{selectedPodcast[3]}</p>
          <audio className="podcast-player" controls preload="metadata">
            <source src={`/audio/${selectedPodcast[0]}.wav`} type="audio/wav" />
            Your browser does not support audio playback.
          </audio>
          <details className="podcast-transcript"><summary>Open transcript and key takeaways</summary><p>Use the audio review as a focused revision aid, then return to the relevant Learning Path for deeper topic explanation and Bloom&apos;s activities.</p><ul><li>Listen once for the clinical sequence.</li><li>Pause and explain the reasoning in your own words.</li><li>Use the Question Bank separately to test recall after review.</li></ul></details>
        </div>
      </section>

      <section className="podcast-library" aria-labelledby="podcast-library-title"><div className="podcast-library-head"><div><div className="podcast-kicker">Module library</div><h2 id="podcast-library-title">Audio revision by module</h2></div><span>{PODCASTS.length} episodes</span></div><div className="podcast-list">{PODCASTS.map((podcast, index) => <button type="button" className={selectedPodcast[0] === podcast[0] ? 'is-selected' : ''} key={podcast[0]} onClick={() => setSelectedPodcast(podcast)}><span className="podcast-list-number">{String(index + 1).padStart(2, '0')}</span><span><strong>{podcast[1]}</strong><small>{podcast[2]} · {podcast[3]}</small></span><span className="podcast-list-action">Listen</span></button>)}</div></section>

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
