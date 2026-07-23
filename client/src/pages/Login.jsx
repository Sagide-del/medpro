import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { homeForRole } from '../services/auth';
import PulseLine from '../components/PulseLine';

const LOGIN_MODES = {
  student: {
    title: 'Student Login',
    subtitle: 'For MedProHub student accounts only.',
    button: 'Sign in as Student',
    placeholder: 'you@student.ac.ke',
  },
  staff: {
    title: 'Staff Login',
    subtitle: 'For teachers and institution staff. Role routing happens automatically after sign-in.',
    button: 'Sign in as Staff',
    placeholder: 'staff@institution.ac.ke',
  },
};

export default function Login() {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit() {
    setError('');
    setBusy(true);
    try {
      const user = await login(email, password);
      const studentMode = mode === 'student';
      const isStudent = user.role === 'student';
      if (studentMode && !isStudent) {
        logout();
        setError('This login is for student accounts only. Use Staff Login for teacher or admin access.');
        return;
      }
      if (!studentMode && isStudent) {
        logout();
        setError('This login is for staff accounts only. Students should use Student Login.');
        return;
      }
      navigate(homeForRole(user.role));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const active = LOGIN_MODES[mode];

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <Link to="/" className="back-link">&larr; Back to home</Link>
        <h1>Med<span>Pro</span>Hub</h1>
        <div className="tag">Secure EMS platform access</div>
        <PulseLine color="#cc0000" width={330} />

        <div className="role-tabs">
          <button type="button" className={`role-tab${mode === 'student' ? ' active' : ''}`} onClick={() => { setMode('student'); setError(''); }}>
            Student Login
          </button>
          <button type="button" className={`role-tab${mode === 'staff' ? ' active' : ''}`} onClick={() => { setMode('staff'); setError(''); }}>
            Staff Login
          </button>
        </div>

        <div className="field" style={{ marginTop: 18 }}>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder={active.placeholder} />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && handleSubmit()} />
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginBottom: 14 }}>{active.subtitle}</div>
        <button className="primary" onClick={handleSubmit} disabled={busy} style={{ width: '100%' }}>
          {busy ? 'Signing in...' : active.button}
        </button>
        {error && <div className="error-note">{error}</div>}
        {mode === 'student' && (
          <div className="switch">
            New student? <Link to="/register">Create an account</Link>
          </div>
        )}
        <div style={{ marginTop: 22, fontSize: 11, color: 'var(--ink-soft)' }}>
          MedProHub © 2026. All rights reserved.
        </div>
      </div>
    </div>
  );
}
