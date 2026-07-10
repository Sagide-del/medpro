import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { api } from '../../services/api';
import Vital from '../Vital';
import { kes, kesShort } from '../format';
import Loading from '../shared/Loading';

export default function RevenueAnalytics() {
  const [revenue, setRevenue] = useState(null);
  const [topContent, setTopContent] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/analytics/revenue').then(setRevenue).catch((e) => setError(e.message));
    api('/analytics/content').then((d) => setTopContent(d.topContent)).catch(() => {});
  }, []);

  if (error) return <div className="alert">{error}</div>;
  if (!revenue) return <Loading label="Loading revenue analytics…" />;

  const total = revenue.byStream.reduce((s, r) => s + Number(r.total), 0);
  const byMonth = {};
  for (const r of revenue.byStream) {
    const key = new Date(r.month).toLocaleDateString('en-KE', { month: 'short', year: '2-digit' });
    byMonth[key] = (byMonth[key] || 0) + Number(r.total);
  }
  const monthly = Object.entries(byMonth).map(([month, total]) => ({ month, total }));

  return (
    <>
      <div className="page-head"><div><h1>Revenue analytics</h1><div className="sub">Streams, institutions, and monthly trend</div></div></div>

      <div className="vitals">
        <Vital label="Total revenue" value={kesShort(total)} money />
        <Vital label="Institutions generating revenue" value={revenue.byInstitution.filter((i) => Number(i.total) > 0).length} />
      </div>

      <div className="card">
        <h2>Monthly trend</h2>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={monthly}>
            <CartesianGrid stroke="#e2e2e2" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono' }} />
            <YAxis tickFormatter={kesShort} tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono' }} width={80} />
            <Tooltip formatter={(v) => kes(v)} />
            <Line type="monotone" dataKey="total" stroke="#cc0000" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h2>By institution</h2>
        <table>
          <thead><tr><th>Institution</th><th>Revenue</th></tr></thead>
          <tbody>
            {revenue.byInstitution.map((r) => (
              <tr key={r.institution_id}><td>{r.name}</td><td className="num">{kes(r.total)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>Top content</h2>
        <table>
          <thead><tr><th>Title</th><th>Type</th><th>Purchases</th></tr></thead>
          <tbody>
            {topContent.map((c) => (
              <tr key={`${c.type}-${c.id}`}><td>{c.title}</td><td>{c.type.replace('_', ' ')}</td><td className="num">{c.purchase_count}</td></tr>
            ))}
            {topContent.length === 0 && <tr><td colSpan="3" style={{ color: 'var(--ink-soft)' }}>No purchases yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
