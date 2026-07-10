import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { kes, kesShort } from '../format';
import Loading from '../shared/Loading';

export default function Revenue() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/analytics/revenue').then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="alert">{error}</div>;
  if (!data) return <Loading label="Loading revenue…" />;

  const total = data.byStream.reduce((s, r) => s + Number(r.total), 0);

  return (
    <>
      <div className="page-head"><div><h1>Revenue</h1><div className="sub">Your institution's revenue by stream</div></div></div>
      <div className="card">
        <h2>Total: {kesShort(total)}</h2>
        <table>
          <thead><tr><th>Month</th><th>Type</th><th>Total</th></tr></thead>
          <tbody>
            {data.byStream.map((r, i) => (
              <tr key={i}>
                <td className="num">{new Date(r.month).toLocaleDateString('en-KE', { month: 'short', year: 'numeric' })}</td>
                <td>{String(r.transaction_type).replace(/_/g, ' ')}</td>
                <td className="num">{kes(r.total)}</td>
              </tr>
            ))}
            {data.byStream.length === 0 && <tr><td colSpan="3" style={{ color: 'var(--ink-soft)' }}>No revenue yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
