import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Loading from '../shared/Loading';

const CHANNELS = [
  { value: 'app', label: 'In-app only' },
  { value: 'sms', label: 'SMS' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'all', label: 'App + SMS + WhatsApp' },
];

export default function SendAlerts() {
  const [groups, setGroups] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [form, setForm] = useState({ groupId: '', title: '', message: '', channel: 'app' });
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function loadAlerts() {
    api('/alerts').then((d) => setAlerts(d.alerts)).catch(() => {});
  }

  useEffect(() => {
    api('/groups').then((d) => {
      setGroups(d.groups);
      if (d.groups.length) setForm((f) => ({ ...f, groupId: d.groups[0].group_id }));
    }).catch((e) => setError(e.message));
    loadAlerts();
  }, []);

  async function send() {
    setBusy(true); setStatus(null);
    try {
      const res = await api('/alerts', { method: 'POST', body: form });
      const simulatedNote = res.deliveries?.some((d) => d.status === 'simulated')
        ? ' (SMS/WhatsApp simulated — no real provider credentials configured)'
        : '';
      setStatus({ kind: 'ok', text: `Sent to ${res.recipientCount} student${res.recipientCount === 1 ? '' : 's'}.${simulatedNote}` });
      setForm((f) => ({ ...f, title: '', message: '' }));
      loadAlerts();
    } catch (e) {
      setStatus({ kind: 'err', text: e.message });
    } finally {
      setBusy(false);
    }
  }

  if (error) return <div className="alert">{error}</div>;
  if (!groups) return <Loading label="Loading your groups…" />;

  return (
    <>
      <div className="page-head"><div><h1>Send alerts</h1><div className="sub">Notify a group about discussions, reminders, or updates</div></div></div>

      {groups.length === 0 ? (
        <div className="card"><p style={{ color: 'var(--ink-soft)' }}>Create a group first before sending alerts.</p></div>
      ) : (
        <div className="card">
          <h2>New alert</h2>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="group">Group</label>
              <select id="group" value={form.groupId} onChange={(e) => setForm({ ...form, groupId: e.target.value })}>
                {groups.map((g) => <option key={g.group_id} value={g.group_id}>{g.name} ({g.member_count} students)</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="channel">Send via</label>
              <select id="channel" value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })}>
                {CHANNELS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div className="field">
            <label htmlFor="title">Title</label>
            <input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Group discussion Thursday" />
          </div>
          <div className="field">
            <label htmlFor="message">Message</label>
            <textarea id="message" rows="3" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          </div>
          <button className="primary" onClick={send} disabled={busy || !form.title || !form.message}>
            {busy ? 'Sending…' : 'Send alert'}
          </button>
          {status && <div className={status.kind === 'ok' ? 'ok-note' : 'error-note'}>{status.text}</div>}
        </div>
      )}

      <div className="card">
        <h2>Recent alerts</h2>
        <table>
          <thead><tr><th>Group</th><th>Title</th><th>Channel</th><th>Recipients</th><th>Sent</th></tr></thead>
          <tbody>
            {alerts.map((a) => (
              <tr key={a.alert_id}>
                <td>{a.group_name}</td>
                <td>{a.title}</td>
                <td>{a.channel}</td>
                <td className="num">{a.recipient_count}</td>
                <td className="num">{new Date(a.created_at).toLocaleString('en-KE')}</td>
              </tr>
            ))}
            {alerts.length === 0 && <tr><td colSpan="5" style={{ color: 'var(--ink-soft)' }}>No alerts sent yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
