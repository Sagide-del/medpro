import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { kes } from '../components/format';

export default function Institutions() {
  const [list, setList] = useState([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', shortCode: '', contactEmail: '', plan: 'trial' });
  const [ok, setOk] = useState('');

  const load = () => api('/institutions').then((d) => setList(d.institutions)).catch((e) => setError(e.message));
  useEffect(load, []);

  async function addInstitution() {
    setError(''); setOk('');
    try {
      await api('/institutions', { method: 'POST', body: form });
      setOk(`${form.name} registered.`);
      setForm({ name: '', shortCode: '', contactEmail: '', plan: 'trial' });
      load();
    } catch (e) { setError(e.message); }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Institutions</h1>
          <div className="sub">Subscriptions, seats, and revenue per institution</div>
        </div>
      </div>

      {error && <div className="alert">{error}</div>}

      <div className="card">
        <h2>All institutions</h2>
        <table>
          <thead>
            <tr><th>Institution</th><th>Plan</th><th>Students</th><th>Revenue</th><th>Status</th><th>Expires</th></tr>
          </thead>
          <tbody>
            {list.map((i) => (
              <tr key={i.institution_id}>
                <td>{i.name}<br /><span style={{ color: '#5c6b68', fontSize: 12 }}>{i.short_code}</span></td>
                <td>{i.plan || '—'}</td>
                <td className="num">{i.students}</td>
                <td className="num">{kes(i.revenue)}</td>
                <td><span className={`badge ${i.status || 'expired'}`}>{i.status || 'none'}</span></td>
                <td className="num">{i.expires_at ? new Date(i.expires_at).toLocaleDateString('en-KE') : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>Register a new institution</h2>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="iname">Institution name</label>
            <input id="iname" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="icode">Short code</label>
            <input id="icode" value={form.shortCode} onChange={(e) => setForm({ ...form, shortCode: e.target.value })} placeholder="e.g. KMTC" />
          </div>
          <div className="field">
            <label htmlFor="iemail">Contact email</label>
            <input id="iemail" type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="iplan">Plan</label>
            <select id="iplan" value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })}>
              <option value="trial">Trial (14 days)</option>
              <option value="basic">Basic</option>
              <option value="professional">Professional</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
        </div>
        <button onClick={addInstitution} disabled={!form.name || !form.shortCode}>Register institution</button>
        {ok && <div className="ok-note">{ok}</div>}
      </div>
    </>
  );
}
