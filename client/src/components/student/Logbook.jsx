import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Loading from '../shared/Loading';

export default function Logbook() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ patientScenario: '', skillsPerformed: '', reflection: '' });
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  function load() {
    api('/logbook').then(setData).catch((e) => setError(e.message));
  }
  useEffect(load, []);

  async function submitEntry() {
    setBusy(true); setStatus('');
    try {
      await api('/logbook/entries', {
        method: 'POST',
        body: { ...form, skillsPerformed: form.skillsPerformed.split(',').map((s) => s.trim()).filter(Boolean) },
      });
      setStatus('Entry submitted for teacher review.');
      setForm({ patientScenario: '', skillsPerformed: '', reflection: '' });
      load();
    } catch (e) { setStatus(e.message); } finally { setBusy(false); }
  }

  if (error) return <div className="alert">{error}</div>;
  if (!data) return <Loading label="Loading your logbook…" />;

  const pct = Math.min(100, Math.round((data.progress.approved_count / data.progress.required_entries) * 100));

  return (
    <>
      <div className="page-head">
        <div><h1>Clinical logbook</h1><div className="sub">{data.progress.approved_count} of {data.progress.required_entries} entries approved</div></div>
      </div>

      <div className="card">
        <div className="progress-bar"><div style={{ width: `${pct}%` }} /></div>
      </div>

      <div className="card">
        <h2>New entry</h2>
        <div className="field">
          <label htmlFor="scenario">Patient scenario</label>
          <textarea id="scenario" rows="3" value={form.patientScenario} onChange={(e) => setForm({ ...form, patientScenario: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="skills">Skills performed (comma separated)</label>
          <input id="skills" value={form.skillsPerformed} onChange={(e) => setForm({ ...form, skillsPerformed: e.target.value })} placeholder="12-lead ECG, IV access, Aspirin administration" />
        </div>
        <div className="field">
          <label htmlFor="reflection">Reflection</label>
          <textarea id="reflection" rows="3" value={form.reflection} onChange={(e) => setForm({ ...form, reflection: e.target.value })} />
        </div>
        <button className="primary" onClick={submitEntry} disabled={busy || !form.patientScenario}>
          {busy ? 'Submitting…' : 'Submit entry'}
        </button>
        {status && <div className="ok-note">{status}</div>}
      </div>

      <div className="card">
        <h2>Entries</h2>
        <table>
          <thead><tr><th>Scenario</th><th>Skills</th><th>Status</th><th>Submitted</th></tr></thead>
          <tbody>
            {data.entries.map((e) => (
              <tr key={e.entry_id}>
                <td>{e.patient_scenario.slice(0, 60)}{e.patient_scenario.length > 60 ? '…' : ''}</td>
                <td>{(e.skills_performed || []).join(', ')}</td>
                <td><span className={`badge ${e.status}`}>{e.status.replace('_', ' ')}</span></td>
                <td className="num">{new Date(e.submitted_at).toLocaleDateString('en-KE')}</td>
              </tr>
            ))}
            {data.entries.length === 0 && <tr><td colSpan="4" style={{ color: 'var(--ink-soft)' }}>No entries yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
