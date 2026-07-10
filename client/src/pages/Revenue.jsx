import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { api } from '../api/client';
import Vital from '../components/Vital';
import { kes, kesShort } from '../components/format';

const streamLabel = {
  institution_subscription: 'Institution subscriptions',
  student_subscription: 'Student subscriptions',
  flashcard: 'Flashcards',
  worksheet: 'Worksheets',
  scenario: 'Scenarios',
  graphic: 'Graphics',
};

export default function Revenue() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/analytics/revenue').then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="alert">{error}</div>;
  if (!data) return <p>Loading revenue analytics…</p>;

  const total = data.byStream.reduce((s, r) => s + Number(r.total), 0);
  const monthTotal = data.byStream.reduce((s, r) => s + Number(r.monthly), 0);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Revenue analytics</h1>
          <div className="sub">Streams, institutions, and 12-month trend</div>
        </div>
      </div>

      <div className="vitals">
        <Vital label="Total revenue" value={kesShort(total)} money />
        <Vital label="Last 30 days" value={kesShort(monthTotal)} money />
        <Vital label="Revenue streams" value={data.byStream.length} />
      </div>

      <div className="card">
        <h2>Monthly trend</h2>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data.monthly.map((m) => ({ ...m, revenue: Number(m.revenue) }))}>
            <CartesianGrid stroke="#e2e9e7" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono' }} />
            <YAxis tickFormatter={kesShort} tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono' }} width={80} />
            <Tooltip formatter={(v) => kes(v)} />
            <Line type="monotone" dataKey="revenue" stroke="#17544f" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h2>By revenue stream</h2>
        <table>
          <thead>
            <tr><th>Stream</th><th>Last 30 days</th><th>All time</th><th>Share</th></tr>
          </thead>
          <tbody>
            {data.byStream.map((r) => (
              <tr key={r.transaction_type}>
                <td>{streamLabel[r.transaction_type] || r.transaction_type}</td>
                <td className="num">{kes(r.monthly)}</td>
                <td className="num">{kes(r.total)}</td>
                <td className="num">{total ? Math.round((r.total / total) * 100) : 0}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>By institution</h2>
        <table>
          <thead>
            <tr><th>Institution</th><th>Students</th><th>Revenue</th></tr>
          </thead>
          <tbody>
            {data.byInstitution.map((r) => (
              <tr key={r.short_code}>
                <td>{r.name}</td>
                <td className="num">{r.students}</td>
                <td className="num">{kes(r.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
