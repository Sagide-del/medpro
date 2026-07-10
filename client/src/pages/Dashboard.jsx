import { useEffect, useState } from 'react';
import { api } from '../api/client';
import Vital from '../components/Vital';
import { kes, kesShort, timeAgo } from '../components/format';

const streamLabel = {
  institution_subscription: 'Institution subscription',
  student_subscription: 'Student subscription',
  flashcard: 'Flashcard deck',
  worksheet: 'Worksheet',
  scenario: 'Scenario',
  graphic: 'Graphic',
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [expiring, setExpiring] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/analytics/overview').then(setData).catch((e) => setError(e.message));
    api('/institutions/expiring?days=30').then((d) => setExpiring(d.expiring)).catch(() => {});
  }, []);

  if (error) return <div className="alert">{error}</div>;
  if (!data) return <p>Loading system overview…</p>;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>System overview</h1>
          <div className="sub">Live vitals across all institutions</div>
        </div>
      </div>

      <div className="vitals">
        <Vital label="Institutions" value={data.counts.institutions} />
        <Vital label="Active students" value={Number(data.counts.students).toLocaleString()} />
        <Vital label="Teachers" value={data.counts.teachers} />
        <Vital label="Published content" value={data.counts.published_content} />
        <Vital label="Total revenue" value={kesShort(data.revenue.total)} money
          delta={`+${kesShort(data.revenue.last_30_days)} this month`} />
      </div>

      {expiring.length > 0 && (
        <div className="card">
          <h2>Subscriptions expiring soon</h2>
          {expiring.map((e) => (
            <div className="alert" key={e.short_code}>
              {e.name} ({e.short_code}) — expires in {e.days_left} day{e.days_left === 1 ? '' : 's'}
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <h2>Recent activity</h2>
        <table>
          <thead>
            <tr><th>When</th><th>Who</th><th>Institution</th><th>What</th><th>Amount</th></tr>
          </thead>
          <tbody>
            {data.recentActivity.map((a, i) => (
              <tr key={i}>
                <td className="num">{timeAgo(a.transaction_date)}</td>
                <td>{a.full_name || '—'}</td>
                <td>{a.short_code || '—'}</td>
                <td>{a.title ? `${streamLabel[a.transaction_type]}: ${a.title}` : streamLabel[a.transaction_type]}</td>
                <td className="num">{kes(a.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
