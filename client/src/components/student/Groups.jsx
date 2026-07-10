import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Loading from '../shared/Loading';

export default function Groups() {
  const [groups, setGroups] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/groups/mine').then((d) => setGroups(d.groups)).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="alert">{error}</div>;
  if (!groups) return <Loading label="Loading your groups…" />;

  return (
    <>
      <div className="page-head"><div><h1>My groups</h1><div className="sub">Cohorts your teachers have added you to</div></div></div>
      <div className="form-grid">
        {groups.map((g) => (
          <div className="card" key={g.group_id}>
            <h2>{g.name}</h2>
            <p style={{ color: 'var(--ink-soft)', fontSize: 13 }}>{g.description}</p>
          </div>
        ))}
        {groups.length === 0 && <p style={{ color: 'var(--ink-soft)' }}>You haven't been added to any groups yet.</p>}
      </div>
    </>
  );
}
