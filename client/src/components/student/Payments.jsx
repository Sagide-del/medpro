import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
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
  const location = useLocation();
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
      if (response.paymentUrl && !response.simulated) {
        setStatus('Redirecting you to IntaSend to complete your subscription payment...');
        window.location.href = response.paymentUrl;
        return;
      }
      setStatus(response.simulated ? 'Subscription activated in dev mode.' : 'Payment request created. Complete the IntaSend checkout to activate access.');
      load();
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
          <h1>Student Subscription</h1>
          <div className="sub">One plan. Full student access.</div>
        </div>
      </div>

      <div className="student-subscription-grid">
        <div className="card student-plan-card" style={{ marginBottom: 16 }}>
          <div className="student-plan-header">
            <div>
              <div className="student-plan-kicker">Student plan</div>
              <h2 style={{ marginBottom: 6 }}>MedProHub Student Plan</h2>
            </div>
            <div className="student-plan-price">KES {Number(currentPlan?.price || 300).toLocaleString('en-KE')}<small>/month</small></div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '10px 0 14px' }}>
          <span className={`badge ${data.subscription?.allowed ? 'approved' : paymentStatus === 'pending' ? 'draft' : 'rejected'}`}>
            {paymentStatus}
          </span>
          <span className="badge draft">Expiry: {expiry}</span>
          </div>

          {!data.subscription?.allowed && location.state?.from && (
            <div className="alert" style={{ marginBottom: 12 }}>
              Activate your plan to continue.
            </div>
          )}

          <div className="student-feature-list">
            {[
              'MCQ Questions',
              'Mock Prep Tests',
              'Clinical Reference Cards',
              'Assessments',
              'Assignments',
              'Skill Simulations',
            ].map((feature) => <div key={feature} className="student-feature-item">{feature}</div>)}
          </div>

          <div className="field">
            <label htmlFor="student-phone">Phone number</label>
            <input id="student-phone" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="07XX XXX XXX" />
          </div>
          <button className="primary student-cta" onClick={renew} disabled={busy || !phone}>
            {busy ? 'Processing...' : 'Pay with IntaSend'}
          </button>
          {status && <div className="ok-note" style={{ marginTop: 12 }}>{status}</div>}
        </div>

        <div className="card student-history-card">
          <h2>Payment history</h2>
          <div className="student-total-spend">{kes(totalSpent)}</div>
          <div className="sub" style={{ marginBottom: 12 }}>Completed spend</div>
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
      </div>
    </>
  );
}
