import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Vital from '../Vital';
import { kesShort, timeAgo } from '../format';
import Loading from '../shared/Loading';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/admin/dashboard').then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="alert">{error}</div>;
  if (!data) return <Loading label="Loading dashboard…" />;

  const studentCount = data.usersByRole.find((r) => r.role === 'student')?.count || 0;
  const teacherCount = data.usersByRole.find((r) => r.role === 'teacher')?.count || 0;

  return (
    <>
      <div className="page-head"><div><h1>{user.institution || 'Institution'} overview</h1><div className="sub">Your institution's students, teachers, and revenue</div></div></div>

      <div className="vitals">
        <Vital label="Students" value={studentCount} />
        <Vital label="Teachers" value={teacherCount} />
        <Vital label="Total revenue" value={kesShort(data.revenue.total)} money />
        <Vital label="Completed purchases" value={data.revenue.count} />
      </div>

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
