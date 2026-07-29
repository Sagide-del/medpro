import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Loading from '../shared/Loading';
import UiIcon from '../shared/UiIcon';

const today = () => new Date().toISOString().slice(0, 10);

const initialForm = {
  rotationAssignmentId: '',
  activityDate: today(),
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
  const [uploading, setUploading] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);

  async function load() {
    const details = await api('/clinical-rotations/my-logbook');
    setData(details);
    setForm((current) => ({
      ...current,
      rotationAssignmentId: current.rotationAssignmentId || details.assignments[0]?.assignment_id || '',
    }));
  }

  useEffect(() => {
    load().catch((error) => setStatus(error.message));
  }, []);

  const currentLogbookUrl = data?.logbook?.file_url || '';

  async function uploadPdf() {
    if (!pdfFile) {
      setStatus('Choose a PDF file first.');
      return;
    }

    setUploading(true);
    setStatus('');
    try {
      const formData = new FormData();
      formData.append('file', pdfFile);
      const response = await api('/clinical-rotations/my-logbook/upload', {
        method: 'POST',
        body: formData,
      });
      setStatus(response.message || 'Logbook PDF uploaded successfully.');
      setPdfFile(null);
      await load();
    } catch (error) {
      setStatus(error.message);
    } finally {
      setUploading(false);
    }
  }

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
      setForm((current) => ({ ...initialForm, rotationAssignmentId: current.rotationAssignmentId, activityDate: today() }));
      setStatus('Clinical activity recorded.');
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

  const pdfReady = Boolean(currentLogbookUrl);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Clinical rotation logbook</h1>
        </div>
      </div>

      {status && <div className={data.access?.activated ? 'ok-note' : 'alert'}>{status}</div>}

      <div className="stats-grid">
        <div className="stat-card"><strong>{data.summary.approved}</strong><span>Approved</span></div>
        <div className="stat-card"><strong>{data.summary.pending}</strong><span>Pending</span></div>
        <div className="stat-card"><strong>{data.summary.totalHours}</strong><span>Hours</span></div>
        <div className="stat-card"><strong>{data.assignments.length}</strong><span>Assignments</span></div>
      </div>

      <div className="logbook-layout">
        <section className="card logbook-upload-card">
          <div className="section-head">
            <div>
              <h2>PDF logbook</h2>
            </div>
            <UiIcon name="document" />
          </div>

          {!data.access?.activated ? (
            <div className="alert">Your digital logbook stays locked until your institution activates your clinical rotation assignment.</div>
          ) : (
            <>
              <div className="logbook-upload-panel">
                <label className="upload-dropzone">
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(event) => setPdfFile(event.target.files?.[0] || null)}
                  />
                  <span className="upload-dropzone-title">Choose PDF file</span>
                  <span className="upload-dropzone-sub">{pdfFile ? pdfFile.name : 'No file selected'}</span>
                </label>
                <div className="logbook-upload-actions">
                  <button type="button" className="primary" onClick={uploadPdf} disabled={uploading || !pdfFile}>
                    {uploading ? 'Uploading...' : 'Upload PDF'}
                  </button>
                  <button type="button" className="ghost" onClick={exportPdf}>Download PDF</button>
                </div>
              </div>

              <div className="logbook-upload-status">
                <div className={`logbook-status-pill ${pdfReady ? 'ready' : ''}`}>
                  {pdfReady ? 'PDF uploaded' : 'PDF not uploaded'}
                </div>
                {pdfReady && (
                  <a className="logbook-open-link" href={currentLogbookUrl} target="_blank" rel="noreferrer">
                    Open PDF
                  </a>
                )}
                {data.logbook?.file_uploaded_at && (
                  <div className="logbook-status-meta">{new Date(data.logbook.file_uploaded_at).toLocaleString('en-KE')}</div>
                )}
              </div>
            </>
          )}
        </section>

        <section className="card logbook-activity-card">
          <div className="section-head">
            <div>
              <h2>Activity record</h2>
            </div>
            <UiIcon name="activity" />
          </div>

          {!data.access?.activated ? (
            <div className="alert">Your digital logbook stays locked until your institution activates your clinical rotation assignment.</div>
          ) : (
            <>
              <div className="form-grid">
                <div className="field">
                  <label>Rotation assignment</label>
                  <select value={form.rotationAssignmentId} onChange={(event) => setForm({ ...form, rotationAssignmentId: event.target.value })}>
                    <option value="">Select assignment</option>
                    {data.assignments.map((assignment) => (
                      <option key={assignment.assignment_id} value={assignment.assignment_id}>
                        {assignment.rotation_title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field"><label>Date</label><input type="date" value={form.activityDate} onChange={(event) => setForm({ ...form, activityDate: event.target.value })} /></div>
                <div className="field"><label>Hospital</label><input value={form.hospital} onChange={(event) => setForm({ ...form, hospital: event.target.value })} /></div>
                <div className="field"><label>Department</label><input value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} /></div>
                <div className="field"><label>Activity performed</label><input value={form.activityPerformed} onChange={(event) => setForm({ ...form, activityPerformed: event.target.value })} /></div>
                <div className="field"><label>Clinical skill learnt</label><input value={form.clinicalSkill} onChange={(event) => setForm({ ...form, clinicalSkill: event.target.value })} /></div>
                <div className="field"><label>Hours completed</label><input type="number" min="0" step="0.5" value={form.hoursCompleted} onChange={(event) => setForm({ ...form, hoursCompleted: event.target.value })} /></div>
                <div className="field"><label>Supervisor</label><input value={form.supervisor} onChange={(event) => setForm({ ...form, supervisor: event.target.value })} /></div>
              </div>
              <div className="field">
                <label>Comments</label>
                <textarea rows="3" value={form.comments} onChange={(event) => setForm({ ...form, comments: event.target.value })} />
              </div>
              <div className="logbook-actions">
                <button
                  type="button"
                  className="primary"
                  onClick={submitActivity}
                  disabled={busy || !form.rotationAssignmentId || !form.activityDate || !form.hospital || !form.activityPerformed || !form.clinicalSkill}
                >
                  {busy ? 'Submitting...' : 'Submit activity'}
                </button>
              </div>
            </>
          )}
        </section>
      </div>

      <div className="card">
        <div className="section-head">
          <div>
            <h2>Verified records</h2>
          </div>
          <UiIcon name="result" />
        </div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Hospital</th>
              <th>Skill learnt</th>
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
