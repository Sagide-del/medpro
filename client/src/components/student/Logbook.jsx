import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Loading from '../shared/Loading';

const initialForm = {
  rotationAssignmentId: '',
  activityDate: '',
  hospital: '',
  department: '',
  activityPerformed: '',
  clinicalSkill: '',
  hoursCompleted: '',
  supervisor: '',
  comments: '',
};

export default function Logbook() {
  const [data, setData] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    const details = await api('/clinical-rotations/my-logbook');
    setData(details);
    if (!form.rotationAssignmentId && details.assignments[0]?.assignment_id) {
      setForm((current) => ({ ...current, rotationAssignmentId: details.assignments[0].assignment_id }));
    }
  }

  useEffect(() => {
    load().catch((error) => setStatus(error.message));
  }, []);

  async function submitActivity() {
    setBusy(true);
    setStatus('');
    try {
      await api('/clinical-rotations/activities', {
        method: 'POST',
        body: {
          ...form,
          hoursCompleted: Number(form.hoursCompleted || 0),
        },
      });
      setForm((current) => ({ ...initialForm, rotationAssignmentId: current.rotationAssignmentId }));
      setStatus('Clinical activity submitted for supervisor verification.');
      await load();
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function exportPdf() {
    const token = sessionStorage.getItem('medpro_token');
    const base = import.meta.env.VITE_API_BASE_URL || '/api';
    const response = await fetch(`${base}/clinical-rotations/my-logbook/export.pdf`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'medprohub-clinical-logbook.pdf';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (!data) return <Loading label="Loading digital logbook..." />;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Clinical rotation logbook</h1>
          <div className="sub">Verified digital records with hospital, department, supervisor, hours, and approval history.</div>
        </div>
      </div>

      {status && <div className={data.access?.activated ? 'ok-note' : 'alert'}>{status}</div>}

      <div className="stats-grid">
        <div className="stat-card"><strong>{data.summary.approved}</strong><span>Approved entries</span></div>
        <div className="stat-card"><strong>{data.summary.pending}</strong><span>Pending review</span></div>
        <div className="stat-card"><strong>{data.summary.totalHours}</strong><span>Hours completed</span></div>
        <div className="stat-card"><strong>{data.assignments.length}</strong><span>Rotation assignments</span></div>
      </div>

      <div className="card">
        <h2>Assigned rotations</h2>
        <table>
          <thead>
            <tr>
              <th>Rotation</th>
              <th>Hospital</th>
              <th>Supervisor</th>
              <th>Logbook</th>
            </tr>
          </thead>
          <tbody>
            {data.assignments.map((assignment) => (
              <tr key={assignment.assignment_id}>
                <td>{assignment.rotation_title}</td>
                <td>{assignment.hospital_name || assignment.site_name || '—'}</td>
                <td>{assignment.supervisor_name || 'Pending assignment'}</td>
                <td>{assignment.logbook_enabled ? 'Active' : 'Locked'}</td>
              </tr>
            ))}
            {data.assignments.length === 0 && <tr><td colSpan="4" style={{ color: 'var(--ink-soft)' }}>No clinical rotations assigned yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>Log clinical activity</h2>
        {!data.access?.activated ? (
          <div className="alert">Your digital logbook stays locked until your institution activates your clinical rotation assignment.</div>
        ) : (
          <>
            <div className="form-grid">
              <div className="field"><label>Rotation assignment</label><input value={form.rotationAssignmentId} onChange={(event) => setForm({ ...form, rotationAssignmentId: event.target.value })} /></div>
              <div className="field"><label>Date</label><input type="date" value={form.activityDate} onChange={(event) => setForm({ ...form, activityDate: event.target.value })} /></div>
              <div className="field"><label>Hospital</label><input value={form.hospital} onChange={(event) => setForm({ ...form, hospital: event.target.value })} /></div>
              <div className="field"><label>Department</label><input value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} /></div>
              <div className="field"><label>Activity performed</label><input value={form.activityPerformed} onChange={(event) => setForm({ ...form, activityPerformed: event.target.value })} /></div>
              <div className="field"><label>Clinical skill</label><input value={form.clinicalSkill} onChange={(event) => setForm({ ...form, clinicalSkill: event.target.value })} /></div>
              <div className="field"><label>Hours completed</label><input type="number" min="0" step="0.5" value={form.hoursCompleted} onChange={(event) => setForm({ ...form, hoursCompleted: event.target.value })} /></div>
              <div className="field"><label>Supervisor</label><input value={form.supervisor} onChange={(event) => setForm({ ...form, supervisor: event.target.value })} /></div>
            </div>
            <div className="field"><label>Comments</label><textarea rows="3" value={form.comments} onChange={(event) => setForm({ ...form, comments: event.target.value })} /></div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="primary" onClick={submitActivity} disabled={busy || !form.rotationAssignmentId || !form.activityDate || !form.hospital || !form.activityPerformed || !form.clinicalSkill}>
                {busy ? 'Submitting...' : 'Submit activity'}
              </button>
              <button className="ghost" onClick={exportPdf}>Download logbook PDF</button>
            </div>
          </>
        )}
      </div>

      <div className="card">
        <h2>Verified records</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Hospital</th>
              <th>Skill</th>
              <th>Hours</th>
              <th>Status</th>
              <th>Supervisor</th>
            </tr>
          </thead>
          <tbody>
            {data.activities.map((activity) => (
              <tr key={activity.activity_id}>
                <td>{activity.activity_date}</td>
                <td>{activity.hospital}</td>
                <td>{activity.clinical_skill}</td>
                <td>{activity.hours_completed}</td>
                <td>{activity.status}</td>
                <td>{activity.supervisor || activity.verification_comments || 'Pending review'}</td>
              </tr>
            ))}
            {data.activities.length === 0 && <tr><td colSpan="6" style={{ color: 'var(--ink-soft)' }}>No activities logged yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
