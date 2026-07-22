import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { kes } from '../format';
import Loading from '../shared/Loading';

const typeLabel = {
  worksheet: 'Worksheet',
  flashcard_deck: 'Clinical recall card deck',
  graphic: 'Clinical reference card',
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
    api('/payments/subscription').then((data) => setSub(data)).catch((err) => setError(err.message));
  }

  useEffect(load, []);

  async function subscribe() {
    setBusy(true);
    setStatus('');
    try {
      const response = await api('/payments/subscribe', { method: 'POST', body: { phone } });
      setStatus(response.simulated ? 'Subscription activated (dev mode).' : 'Check your phone to complete the M-Pesa payment.');
      if (response.simulated) load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (error) return <div className="alert">{error}</div>;
  if (!sub) return <Loading label="Loading subscription status..." />;

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <h2>Assessment subscription</h2>
      {sub.active ? (
        <>
          <span className="badge published" style={{ marginBottom: 8 }}>Active</span>
          <p style={{ color: 'var(--ink-soft)', fontSize: 13 }}>
            {sub.source === 'institution'
              ? 'Covered by your institution site-license - no personal payment needed.'
              : `Personal subscription${sub.expiresAt ? ` - renews/expires ${new Date(sub.expiresAt).toLocaleDateString('en-KE')}` : ''}.`}
          </p>
        </>
      ) : (
        <>
          <p style={{ color: 'var(--ink-soft)', fontSize: 13, marginBottom: 10 }}>
            Not subscribed - Ksh {sub.price}/month unlocks every published assessment.
          </p>
          <div className="field">
            <label htmlFor="sub-phone">M-Pesa phone number</label>
            <input id="sub-phone" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="07XX XXX XXX" />
          </div>
          <button className="primary" onClick={subscribe} disabled={busy || !phone} style={{ marginTop: 10 }}>
            {busy ? 'Processing...' : `Subscribe - Ksh ${sub.price}/month`}
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
    api('/payments/history').then((data) => setTransactions(data.transactions)).catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="alert">{error}</div>;
  if (!transactions) return <Loading label="Loading purchase history..." />;

  const total = transactions.filter((transaction) => transaction.status === 'completed').reduce((sum, transaction) => sum + Number(transaction.amount), 0);

  return (
    <>
      <div className="page-head"><div><h1>Subscription &amp; Billing</h1><div className="sub">Total spent: {kes(total)}</div></div></div>
      <SubscriptionCard />
      <div className="card">
        <table>
          <thead><tr><th>Item</th><th>Amount</th><th>Method</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr key={transaction.transaction_id}>
                <td>{typeLabel[transaction.item_type] || transaction.item_type}</td>
                <td className="num">{kes(transaction.amount)}</td>
                <td>{transaction.payment_method}</td>
                <td><span className={`badge ${transaction.status}`}>{transaction.status}</span></td>
                <td className="num">{new Date(transaction.transaction_date).toLocaleDateString('en-KE')}</td>
              </tr>
            ))}
            {transactions.length === 0 && <tr><td colSpan="5" style={{ color: 'var(--ink-soft)' }}>No purchases yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
