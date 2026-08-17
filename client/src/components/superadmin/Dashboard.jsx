import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import Vital from '../Vital';
import { kesShort, timeAgo } from '../format';
import Loading from '../shared/Loading';

export default function SuperAdminDashboard() {
  const [data, setData] = useState(null);
  const [expiring, setExpiring] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/admin/dashboard').then(setData).catch((e) => setError(e.message));
    api('/institutions/expiring?days=30').then((d) => setExpiring(d.expiring)).catch(() => {});
  }, []);

  if (error) return <div className="alert">{error}</div>;
  if (!data) return <Loading label="Loading system overview…" />;

  const roleCount = (role) => data.usersByRole.find((r) => r.role === role)?.count || 0;

  return (
    <>
      <div className="page-head"><div><h1>System overview</h1><div className="sub">Live vitals across all institutions</div></div></div>

      <div className="card" style={{ marginBottom: 18, borderLeft: '4px solid var(--accent-red)' }}>
        <div className="superadmin-panel-head">
          <div>
            <div className="superadmin-kicker">Workspace</div>
            <h2 style={{ marginTop: 0, marginBottom: 4 }}>Users & Communication</h2>
          </div>
        </div>
        <div className="logbook-actions">
          <Link className="primary" to="/superadmin/users">Open users</Link>
          <Link className="ghost" to="/superadmin/communications">Open communication center</Link>
          <Link className="ghost" to="/superadmin/ai-generator">AI generator</Link>
          <Link className="ghost" to="/superadmin/content">Content uploader</Link>
        </div>
      </div>

      <div className="vitals">
        <Vital label="Students" value={roleCount('student')} />
        <Vital label="Teachers" value={roleCount('teacher')} />
        <Vital label="Institution admins" value={roleCount('institution_admin')} />
        <Vital label="Total revenue" value={kesShort(data.revenue.total)} money />
      </div>

      {expiring.length > 0 && (
        <div className="card">
          <h2>Subscriptions expiring soon</h2>
          {expiring.map((e) => (
            <div className="alert" key={e.institution_id}>
              {e.name} — expires {new Date(e.expires_at).toLocaleDateString('en-KE')}
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <h2>Recent activity</h2>
        <table>
          <thead><tr><th>When</th><th>Action</th></tr></thead>
          <tbody>
            {data.recentActivity.map((a) => (
              <tr key={a.log_id}>
                <td className="num">{timeAgo(a.created_at)}</td>
                <td>{a.action_type.replace(/_/g, ' ')}</td>
              </tr>
            ))}
            {data.recentActivity.length === 0 && <tr><td colSpan="2" style={{ color: 'var(--ink-soft)' }}>No recent activity.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
