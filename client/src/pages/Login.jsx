import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { homeForRole } from '../services/auth';
import AuthShell from '../components/AuthShell';

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
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (busy) return;
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
      if (isStudent) {
        const subscription = await api('/subscriptions/student/current');
        navigate(subscription.subscription?.allowed ? '/student/dashboard' : '/student/subscription');
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
    <AuthShell title="Welcome back" subtitle="A little practice today. More confidence tomorrow.">
        <div className="role-tabs">
          <button type="button" aria-pressed={mode === 'student'} className={`role-tab${mode === 'student' ? ' active' : ''}`} onClick={() => { setMode('student'); setError(''); }}>
            Student Login
          </button>
          <button type="button" aria-pressed={mode === 'staff'} className={`role-tab${mode === 'staff' ? ' active' : ''}`} onClick={() => { setMode('staff'); setError(''); }}>
            Staff Login
          </button>
        </div>

        <form className="auth-fields" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input required name="email" autoComplete="username" id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder={active.placeholder} />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <div className="auth-password">
            <input required name="password" autoComplete="current-password" id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} aria-pressed={showPassword}>{showPassword ? 'Hide' : 'Show'}</button>
          </div>
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginBottom: 14 }}>{active.subtitle}</div>
        <button className="primary" type="submit" disabled={busy}>
          {busy ? 'Signing in...' : active.button}
        </button>
        {error && <div className="error-note" role="alert">{error}</div>}
        </form>
        {mode === 'student' && (
          <div className="switch">
            New student? <Link to="/register">Create an account</Link>
          </div>
        )}
    </AuthShell>
  );
}
