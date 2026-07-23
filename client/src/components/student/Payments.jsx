import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { kes } from '../format';
import Loading from '../shared/Loading';

const typeLabel = {
  student_subscription: 'Student subscription',
  institution_subscription: 'Institution licence',
  worksheet: 'Worksheet',
  flashcard_deck: 'Flashcard deck',
  graphic: 'Graphic',
  assessment: 'Assessment',
  elibrary_resource: 'E-Library',
};

export default function Payments() {
  const [data, setData] = useState(null);
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  function load() {
    Promise.all([
      api('/subscriptions/student/current'),
      api('/subscriptions/plans?type=student'),
    ])
      .then(([subscriptionData, plansData]) => setData({ ...subscriptionData, plans: plansData.plans }))
      .catch((err) => setError(err.message));
  }

  useEffect(load, []);

  async function renew() {
    setBusy(true);
    setStatus('');
    setError('');
    try {
      const response = await api('/subscriptions/student/renew', { method: 'POST', body: { phone } });
      setStatus(response.simulated ? 'Subscription activated in dev mode.' : 'Check your phone to complete the M-Pesa payment.');
      if (response.simulated) load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (error) return <div className="alert">{error}</div>;
  if (!data) return <Loading label="Loading subscription details..." />;

  const currentPlan = data.subscription?.plan || data.plans?.[0];
  const expiry = data.subscription?.expiresAt ? new Date(data.subscription.expiresAt).toLocaleDateString('en-KE') : 'Not active';
  const paymentStatus = data.subscription?.status || 'expired';
  const transactions = data.transactions || [];
  const totalSpent = transactions
    .filter((transaction) => transaction.status === 'completed')
    .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Subscription &amp; Billing</h1>
          <div className="sub">MedProHub Student Plan, renewal status, and payment history.</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h2>{currentPlan?.name || 'MedProHub Student Plan'}</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '10px 0 14px' }}>
          <span className={`badge ${data.subscription?.allowed ? 'approved' : paymentStatus === 'pending' ? 'draft' : 'rejected'}`}>
            {paymentStatus}
          </span>
          <span className="badge draft">{currentPlan?.currency || 'KES'} {Number(currentPlan?.price || 300).toLocaleString('en-KE')}/month</span>
          <span className="badge draft">Expiry: {expiry}</span>
        </div>

        <p style={{ color: 'var(--ink-soft)', marginBottom: 10 }}>
          Current plan: {currentPlan?.name || 'Student Monthly'}.
          {data.subscription?.source === 'institution' ? ' Your access is currently covered by an institution licence.' : ' Personal subscription renewals are billed monthly.'}
        </p>
        <p style={{ color: 'var(--ink-soft)', marginBottom: 12 }}>
          Payment status: {paymentStatus}. Benefits include Clinical Reference Cards, Skill Simulations, Practice Assessments, and Assignments.
        </p>

        <ul style={{ paddingLeft: 18, marginBottom: 16 }}>
          {(currentPlan?.features || []).map((feature) => <li key={feature}>{feature}</li>)}
        </ul>

        <div className="field">
          <label htmlFor="student-phone">Renew with M-Pesa</label>
          <input id="student-phone" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="07XX XXX XXX" />
        </div>
        <button className="primary" onClick={renew} disabled={busy || !phone}>
          {busy ? 'Processing...' : 'Renew subscription'}
        </button>
        {status && <div className="ok-note" style={{ marginTop: 12 }}>{status}</div>}
      </div>

      <div className="card">
        <h2>Payment history</h2>
        <p style={{ color: 'var(--ink-soft)', marginBottom: 12 }}>Total completed spend: {kes(totalSpent)}</p>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Method</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr key={transaction.transaction_id}>
                <td>{new Date(transaction.transaction_date || transaction.created_at).toLocaleDateString('en-KE')}</td>
                <td>{typeLabel[transaction.transaction_type] || transaction.transaction_type}</td>
                <td>{kes(transaction.amount)}</td>
                <td>{transaction.status}</td>
                <td>{transaction.payment_method}</td>
              </tr>
            ))}
            {transactions.length === 0 && <tr><td colSpan="5" style={{ color: 'var(--ink-soft)' }}>No payments recorded yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
