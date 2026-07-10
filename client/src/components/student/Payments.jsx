import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { kes } from '../format';
import Loading from '../shared/Loading';

const typeLabel = {
  worksheet: 'Worksheet',
  flashcard_deck: 'Flashcard deck',
  graphic: 'Graphic',
  assessment: 'Assessment',
  student_subscription: 'Subscription',
};

function SubscriptionCard() {
  const [sub, setSub] = useState(null);
  const [error, setError] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  function load() {
    api('/payments/subscription').then((d) => setSub(d)).catch((e) => setError(e.message));
  }

  useEffect(load, []);

  async function subscribe() {
    setBusy(true); setStatus('');
    try {
      const res = await api('/payments/subscribe', { method: 'POST', body: { phone } });
      setStatus(res.simulated ? 'Subscription activated (dev mode).' : 'Check your phone to complete the M-Pesa payment.');
      if (res.simulated) load();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  if (error) return <div className="alert">{error}</div>;
  if (!sub) return <Loading label="Loading subscription status…" />;

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <h2>Assessment subscription</h2>
      {sub.active ? (
        <>
          <span className="badge published" style={{ marginBottom: 8 }}>Active</span>
          <p style={{ color: 'var(--ink-soft)', fontSize: 13 }}>
            {sub.source === 'institution'
              ? 'Covered by your institution’s MedPro site-license — no personal payment needed.'
              : `Personal subscription${sub.expiresAt ? ` — renews/expires ${new Date(sub.expiresAt).toLocaleDateString('en-KE')}` : ''}.`}
          </p>
        </>
      ) : (
        <>
          <p style={{ color: 'var(--ink-soft)', fontSize: 13, marginBottom: 10 }}>
            Not subscribed — Ksh {sub.price}/month unlocks every published assessment.
          </p>
          <div className="field">
            <label htmlFor="sub-phone">M-Pesa phone number</label>
            <input id="sub-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XX XXX XXX" />
          </div>
          <button className="primary" onClick={subscribe} disabled={busy || !phone} style={{ marginTop: 10 }}>
            {busy ? 'Processing…' : `Subscribe — Ksh ${sub.price}/month`}
          </button>
          {status && <p style={{ marginTop: 10, fontSize: 13 }}>{status}</p>}
        </>
      )}
    </div>
  );
}

export default function Payments() {
  const [transactions, setTransactions] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/payments/history').then((d) => setTransactions(d.transactions)).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="alert">{error}</div>;
  if (!transactions) return <Loading label="Loading purchase history…" />;

  const total = transactions.filter((t) => t.status === 'completed').reduce((s, t) => s + Number(t.amount), 0);

  return (
    <>
      <div className="page-head"><div><h1>Purchase history</h1><div className="sub">Total spent: {kes(total)}</div></div></div>
      <SubscriptionCard />
      <div className="card">
        <table>
          <thead><tr><th>Item</th><th>Amount</th><th>Method</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.transaction_id}>
                <td>{typeLabel[t.item_type] || t.item_type}</td>
                <td className="num">{kes(t.amount)}</td>
                <td>{t.payment_method}</td>
                <td><span className={`badge ${t.status}`}>{t.status}</span></td>
                <td className="num">{new Date(t.transaction_date).toLocaleDateString('en-KE')}</td>
              </tr>
            ))}
            {transactions.length === 0 && <tr><td colSpan="5" style={{ color: 'var(--ink-soft)' }}>No purchases yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
