import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Loading from '../shared/Loading';

export default function Analytics() {
  const [groups, setGroups] = useState(null);
  const [selected, setSelected] = useState('');
  const [performance, setPerformance] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/groups').then((d) => setGroups(d.groups)).catch((e) => setError(e.message));
  }, []);

  function loadPerformance(groupId) {
    setSelected(groupId);
    api(`/analytics/groups/${groupId}/performance`).then((d) => setPerformance(d.performance)).catch((e) => setError(e.message));
  }

  if (error) return <div className="alert">{error}</div>;
  if (!groups) return <Loading label="Loading groups…" />;

  return (
    <>
      <div className="page-head"><div><h1>Class analytics</h1><div className="sub">Average score and attempts per student</div></div></div>

      <div className="card">
        <div className="field" style={{ maxWidth: 360 }}>
          <label htmlFor="group">Group</label>
          <select id="group" value={selected} onChange={(e) => loadPerformance(e.target.value)}>
            <option value="">Select a group</option>
            {groups.map((g) => <option key={g.group_id} value={g.group_id}>{g.name}</option>)}
          </select>
        </div>
      </div>

      {selected && (
        <div className="card">
          <table>
            <thead><tr><th>Student</th><th>Avg score</th><th>Attempts</th></tr></thead>
            <tbody>
              {performance.map((p) => (
                <tr key={p.user_id}>
                  <td>{p.full_name}</td>
                  <td className="num">{p.avg_score != null ? `${p.avg_score}%` : '—'}</td>
                  <td className="num">{p.attempts}</td>
                </tr>
              ))}
              {performance.length === 0 && <tr><td colSpan="3" style={{ color: 'var(--ink-soft)' }}>No graded attempts yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
