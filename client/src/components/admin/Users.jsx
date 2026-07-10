import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Loading from '../shared/Loading';

export default function Users() {
  const [users, setUsers] = useState(null);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState('');

  function load() {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (role) params.set('role', role);
    api(`/users?${params}`).then((d) => setUsers(d.users)).catch((e) => setError(e.message));
  }
  useEffect(load, []);

  async function toggleStatus(u) {
    try {
      await api(`/users/${u.user_id}/${u.status === 'active' ? 'suspend' : 'reactivate'}`, { method: 'PATCH' });
      load();
    } catch (e) { setError(e.message); }
  }

  if (error) return <div className="alert">{error}</div>;
  if (!users) return <Loading label="Loading users…" />;

  return (
    <>
      <div className="page-head"><div><h1>Users</h1><div className="sub">Students and teachers at your institution</div></div></div>

      <div className="card">
        <div className="form-grid" style={{ alignItems: 'end' }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="search">Search</label>
            <input id="search" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} placeholder="Name, email, or reg number" />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="role">Role</label>
            <select id="role" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="">All roles</option>
              <option value="student">Students</option>
              <option value="teacher">Teachers</option>
            </select>
          </div>
          <button onClick={load}>Apply filters</button>
        </div>
      </div>

      <div className="card">
        <h2>{users.length} user{users.length === 1 ? '' : 's'}</h2>
        <table>
          <thead><tr><th>Name</th><th>Reg no.</th><th>Role</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.user_id}>
                <td>{u.full_name}<br /><span style={{ color: 'var(--ink-soft)', fontSize: 12 }}>{u.email}</span></td>
                <td className="num">{u.reg_number || '—'}</td>
                <td>{u.role.replace('_', ' ')}</td>
                <td><span className={`badge ${u.status}`}>{u.status}</span></td>
                <td>
                  <button className="ghost" onClick={() => toggleStatus(u)}>{u.status === 'active' ? 'Suspend' : 'Reactivate'}</button>
                </td>
              </tr>
            ))}
            {users.length === 0 && <tr><td colSpan="5" style={{ color: 'var(--ink-soft)' }}>No users match these filters.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
