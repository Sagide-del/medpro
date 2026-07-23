import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { api } from '../../services/api';
import Vital from '../Vital';
import { kes, kesShort } from '../format';
import Loading from '../shared/Loading';

export default function RevenueAnalytics() {
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/subscriptions/admin/overview').then(setOverview).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="alert">{error}</div>;
  if (!overview) return <Loading label="Loading subscription management…" />;

  const totalRevenue = overview.recentPayments
    .filter((payment) => payment.status === 'completed')
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const activeSubscriptions = overview.subscriptionSummary
    .filter((item) => item.status === 'completed' || item.status === 'active')
    .reduce((sum, item) => sum + Number(item.count || 0), 0);
  const monthly = [...(overview.revenueSummary || [])]
    .reverse()
    .map((row) => ({
      month: new Date(row.month).toLocaleDateString('en-KE', { month: 'short', year: '2-digit' }),
      total: Number(row.total),
    }));

  return (
    <>
      <div className="page-head"><div><h1>Subscription management</h1><div className="sub">Plans, subscribers, revenue, and payment history.</div></div></div>

      <div className="vitals">
        <Vital label="Plans" value={overview.plans.length} />
        <Vital label="Active subscribers" value={activeSubscriptions} />
        <Vital label="Subscription revenue" value={kesShort(totalRevenue)} money />
      </div>

      <div className="card">
        <h2>Revenue trend</h2>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={monthly}>
            <CartesianGrid stroke="#e2e2e2" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono' }} />
            <YAxis tickFormatter={kesShort} tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono' }} width={80} />
            <Tooltip formatter={(value) => kes(value)} />
            <Line type="monotone" dataKey="total" stroke="#cc0000" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h2>Plans</h2>
        <table>
          <thead><tr><th>Name</th><th>Type</th><th>Price</th><th>Duration</th><th>Status</th></tr></thead>
          <tbody>
            {overview.plans.map((plan) => (
              <tr key={plan.plan_id}>
                <td>{plan.name}</td>
                <td>{plan.type}</td>
                <td>{kes(plan.price)}</td>
                <td>{plan.duration_days} days</td>
                <td>{plan.is_active ? 'active' : 'inactive'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>Subscribers</h2>
        <table>
          <thead><tr><th>Transaction type</th><th>Status</th><th>Count</th><th>Total</th></tr></thead>
          <tbody>
            {overview.subscriptionSummary.map((item, index) => (
              <tr key={`${item.transaction_type}-${item.status}-${index}`}>
                <td>{item.transaction_type}</td>
                <td>{item.status}</td>
                <td>{item.count}</td>
                <td>{kes(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>Payment history</h2>
        <table>
          <thead><tr><th>Date</th><th>Type</th><th>Amount</th><th>Status</th><th>Method</th></tr></thead>
          <tbody>
            {overview.recentPayments.map((payment) => (
              <tr key={payment.transaction_id}>
                <td>{new Date(payment.transaction_date || payment.created_at).toLocaleDateString('en-KE')}</td>
                <td>{payment.transaction_type}</td>
                <td>{kes(payment.amount)}</td>
                <td>{payment.status}</td>
                <td>{payment.payment_method}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
