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
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [paymentRequest, setPaymentRequest] = useState(null);

  function load() {
    Promise.all([
      api('/subscriptions/student/current'),
      api('/subscriptions/plans?type=student'),
    ])
      .then(([subscriptionData, plansData]) => setData({ ...subscriptionData, plans: plansData.plans }))
      .catch((err) => setError(err.message));
  }

  useEffect(load, []);

  async function generateReference() {
    setBusy(true);
    setStatus('');
    setError('');
    try {
      const response = await api('/subscriptions/student/renew', { method: 'POST', body: {} });
      setPaymentRequest(response);
      setStatus('Reference created. Pay via Tatua and wait for automatic confirmation.');
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
  const tillNumber = paymentRequest?.tillNumber || '4382411';
  const totalSpent = transactions
    .filter((transaction) => transaction.status === 'completed')
    .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Student Subscription</h1>
          <div className="sub">Tatua subscription access for student accounts.</div>
        </div>
      </div>

      <div className="student-subscription-grid">
        <div className="card student-plan-card" style={{ marginBottom: 16 }}>
          <div className="student-plan-header">
            <div>
              <div className="student-plan-kicker">MedProHub Student Plan</div>
              <h2 style={{ marginBottom: 6 }}>MedProHub Student Plan</h2>
            </div>
            <div className="student-plan-price">KES {Number(currentPlan?.price || 150).toLocaleString('en-KE')}<small>/month</small></div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '10px 0 14px' }}>
            <span className={`badge ${data.subscription?.allowed ? 'approved' : paymentStatus === 'pending' ? 'draft' : 'rejected'}`}>
              {paymentStatus}
            </span>
            <span className="badge draft">Expiry: {expiry}</span>
            <span className="badge draft">Till: {tillNumber}</span>
          </div>

          {!data.subscription?.allowed && (
            <div className="alert" style={{ marginBottom: 12 }}>
              Generate a payment reference, then pay KES 150 to Tatua Till 4382411.
            </div>
          )}

          <div className="student-feature-list">
            {['Clinical Reference Cards', 'Assessments', 'Simulations', 'Assignments', 'Exam Preparation'].map((feature) => (
              <div key={feature} className="student-feature-item">{feature}</div>
            ))}
          </div>

          <button className="primary student-cta" onClick={generateReference} disabled={busy}>
            {busy ? 'Generating...' : 'Generate payment reference'}
          </button>

          {paymentRequest && (
            <div className="card" style={{ marginTop: 16, background: 'var(--panel-soft)' }}>
              <div className="student-plan-kicker">Payment reference</div>
              <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: 1, margin: '8px 0' }}>{paymentRequest.paymentReference}</div>
              <div style={{ color: 'var(--ink-soft)', marginBottom: 8 }}>{paymentRequest.instructions}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span className="badge draft">KES {Number(paymentRequest.amount || currentPlan?.price || 150).toLocaleString('en-KE')}</span>
                <span className="badge draft">Till {paymentRequest.tillNumber || tillNumber}</span>
                <span className="badge draft">Provider: Tatua</span>
              </div>
            </div>
          )}

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
