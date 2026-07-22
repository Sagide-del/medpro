import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Loading from '../shared/Loading';

export default function Groups() {
  const [groups, setGroups] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/groups/mine').then((data) => setGroups(data.groups)).catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="alert">{error}</div>;
  if (!groups) return <Loading label="Loading your community..." />;

  return (
    <>
      <div className="page-head"><div><h1>Community</h1><div className="sub">Cohorts and learning groups your teachers have added you to</div></div></div>
      <div className="form-grid">
        {groups.map((group) => (
          <div className="card" key={group.group_id}>
            <h2>{group.name}</h2>
            <p style={{ color: 'var(--ink-soft)', fontSize: 13 }}>{group.description}</p>
          </div>
        ))}
        {groups.length === 0 && <p style={{ color: 'var(--ink-soft)' }}>You have not been added to any learning groups yet.</p>}
      </div>
    </>
  );
}
