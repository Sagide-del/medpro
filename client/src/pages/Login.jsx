import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { homeForRole } from '../services/auth';
import PulseLine from '../components/PulseLine';

const ROLES = [
  { value: 'student', label: 'Student', placeholder: 'you@student.ac.ke' },
  { value: 'teacher', label: 'Teacher', placeholder: 'teacher@institution.ac.ke' },
  { value: 'institution_admin', label: 'Institution Admin', placeholder: 'admin@institution.ac.ke' },
  { value: 'super_admin', label: 'Super Admin', placeholder: 'admin@satechnologies.co.ke' },
];

const roleLabel = (value) => ROLES.find((r) => r.value === value)?.label || value;

export default function Login() {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit() {
    setError('');
    setBusy(true);
    try {
      const user = await login(email, password);
      if (user.role !== role) {
        logout();
        setError(`That account is registered as ${roleLabel(user.role)}, not ${roleLabel(role)}. Select the correct tab above and try again.`);
        return;
      }
      navigate(homeForRole(user.role));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const active = ROLES.find((r) => r.value === role);

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <Link to="/" className="back-link">&larr; Back to home</Link>
        <h1>Med<span>Pro</span></h1>
        <div className="tag">EMS &amp; paramedicine education platform</div>
        <PulseLine color="#cc0000" width={330} />

        <div className="role-tabs">
          {ROLES.map((r) => (
            <button
              key={r.value}
              type="button"
              className={`role-tab${role === r.value ? ' active' : ''}`}
              onClick={() => { setRole(r.value); setError(''); }}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div className="field" style={{ marginTop: 18 }}>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder={active.placeholder} />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} />
        </div>
        <button className="primary" onClick={handleSubmit} disabled={busy} style={{ width: '100%' }}>
          {busy ? 'Signing in…' : `Sign in as ${active.label}`}
        </button>
        {error && <div className="error-note">{error}</div>}
        <div className="switch">
          New student? <Link to="/register">Create an account</Link>
        </div>
        <div style={{ marginTop: 22, fontSize: 11, color: 'var(--ink-soft)' }}>
          MedPro — developed by SA Technologies &middot; Nairobi
        </div>
      </div>
    </div>
  );
}
