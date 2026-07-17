import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Loading from '../shared/Loading';

export default function Users() {
  const { user } = useAuth();

  const [users, setUsers] = useState(null);
  const [institutions, setInstitutions] = useState([]);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'student',
    institutionId: '',
  });

  function load() {
    api('/users')
      .then((d) => setUsers(d.users))
      .catch((e) => setError(e.message));
  }

  useEffect(() => {
    load();

    if (user.role === 'super_admin') {
      api('/admin/institutions')
        .then((d) => setInstitutions(d.institutions))
        .catch((e) => setError(e.message));
    }
  }, []);

  async function createUser(e) {
    e.preventDefault();

    try {
      await api('/users', {
        method: 'POST',
        body: form,
      });

      setForm({
        fullName: '',
        email: '',
        password: '',
        role: 'student',
        institutionId: '',
      });

      load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function toggleStatus(u) {
    try {
      await api(
        `/users/${u.user_id}/${u.status === 'active' ? 'suspend' : 'reactivate'}`,
        { method: 'PATCH' }
      );
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  if (error) return <div className="alert">{error}</div>;
  if (!users) return <Loading label="Loading users..." />;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>User management</h1>
          <div className="sub">
            Create and manage MedPro users
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Create user</h2>

        <form onSubmit={createUser}>
          <div className="form-grid">

            <div className="field">
              <label>Name</label>
              <input
                value={form.fullName}
                onChange={(e) =>
                  setForm({ ...form, fullName: e.target.value })
                }
              />
            </div>

            <div className="field">
              <label>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
              />
            </div>

            <div className="field">
              <label>Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
              />
            </div>

            <div className="field">
              <label>Role</label>
              <select
                value={form.role}
                onChange={(e) =>
                  setForm({ ...form, role: e.target.value })
                }
              >
                {user.role === 'super_admin' && (
                  <option value="institution_admin">
                    Institution Admin
                  </option>
                )}

                <option value="teacher">
                  Teacher
                </option>

                <option value="student">
                  Student
                </option>
              </select>
            </div>

            {user.role === 'super_admin' && (
              <div className="field">
                <label>Institution</label>

                <select
                  value={form.institutionId}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      institutionId: e.target.value,
                    })
                  }
                >
                  <option value="">
                    Select institution
                  </option>

                  {institutions.map((i) => (
                    <option
                      key={i.institution_id}
                      value={i.institution_id}
                    >
                      {i.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

          </div>

          <button type="submit">
            Create user
          </button>

        </form>
      </div>


      <div className="card">
        <h2>{users.length} users</h2>

        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {users.map((u) => (
              <tr key={u.user_id}>
                <td>{u.full_name}</td>
                <td>{u.email}</td>
                <td>{u.role.replace('_', ' ')}</td>
                <td>{u.status}</td>

                <td>
                  <button
                    className="ghost"
                    onClick={() => toggleStatus(u)}
                  >
                    {u.status === 'active'
                      ? 'Suspend'
                      : 'Reactivate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>
    </>
  );
}