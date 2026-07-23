import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { kes } from '../format';
import Loading from '../shared/Loading';

export default function Institutions() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  function load() {
    Promise.all([
      api(`/institutions/${user.institutionId}`),
      api('/subscriptions/institution/current'),
    ])
      .then(([institutionData, subscriptionData]) => setData({ institution: institutionData.institution, ...subscriptionData }))
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    if (user.institutionId) load();
  }, [user.institutionId]);

  async function renew() {
    setBusy(true);
    setStatus('');
    setError('');
    try {
      const response = await api('/subscriptions/institution/renew', { method: 'POST', body: { phone } });
      setStatus(response.simulated ? 'Institution licence renewed in dev mode.' : 'Check the payment phone to complete the licence renewal.');
      if (response.simulated) load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (error) return <div className="alert">{error}</div>;
  if (!data) return <Loading label="Loading institution licence…" />;

  const expiry = data.subscription?.expiresAt ? new Date(data.subscription.expiresAt).toLocaleDateString('en-KE') : 'Not active';
  const plan = data.subscription?.plan;
  const counts = data.subscription?.counts || {};

  return (
    <>
      <div className="page-head"><div><h1>{data.institution.name}</h1><div className="sub">Institution profile and annual licence management</div></div></div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h2>Institution Annual Licence</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '10px 0 14px' }}>
          <span className={`badge ${data.subscription?.allowed ? 'approved' : data.subscription?.status === 'pending' ? 'draft' : 'rejected'}`}>
            {data.subscription?.status || 'expired'}
          </span>
          <span className="badge draft">{plan?.currency || 'KES'} {Number(plan?.price || 15000).toLocaleString('en-KE')}/year</span>
          <span className="badge draft">Expiry: {expiry}</span>
        </div>
        <div className="form-grid">
          <div><label>Students covered</label><p>{counts.students_covered ?? 0}</p></div>
          <div><label>Teachers covered</label><p>{counts.teachers_covered ?? 0}</p></div>
          <div><label>Short code</label><p>{data.institution.short_code}</p></div>
          <div><label>Contact email</label><p>{data.institution.contact_email || '—'}</p></div>
          <div><label>Contact phone</label><p>{data.institution.contact_phone || '—'}</p></div>
          <div><label>Address</label><p>{data.institution.address || '—'}</p></div>
        </div>

        <p style={{ color: 'var(--ink-soft)', margin: '12px 0' }}>
          Renewal amount: {kes(plan?.price || 15000)} for 365 days of premium institutional access.
        </p>

        <div className="field">
          <label htmlFor="licence-phone">Renew licence with M-Pesa</label>
          <input id="licence-phone" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="07XX XXX XXX" />
        </div>
        <button className="primary" onClick={renew} disabled={busy || !phone}>
          {busy ? 'Processing...' : 'Renew licence'}
        </button>
        {status && <div className="ok-note" style={{ marginTop: 12 }}>{status}</div>}
      </div>

      <div className="card">
        <h2>Recent licence payments</h2>
        <table>
          <thead><tr><th>Date</th><th>Amount</th><th>Status</th><th>Method</th></tr></thead>
          <tbody>
            {(data.transactions || []).map((transaction) => (
              <tr key={transaction.transaction_id}>
                <td>{new Date(transaction.transaction_date || transaction.created_at).toLocaleDateString('en-KE')}</td>
                <td>{kes(transaction.amount)}</td>
                <td>{transaction.status}</td>
                <td>{transaction.payment_method}</td>
              </tr>
            ))}
            {(data.transactions || []).length === 0 && <tr><td colSpan="4" style={{ color: 'var(--ink-soft)' }}>No licence payments recorded yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
