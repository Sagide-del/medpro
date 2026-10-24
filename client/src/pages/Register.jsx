import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { homeForRole } from '../services/auth';
import AuthShell from '../components/AuthShell';

export default function Register() {
  const { register } = useAuth();
  const [searchParams] = useSearchParams();
  const requestedProgram = searchParams.get('program');
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', program: ['EMT', 'Paramedic', 'Nursing'].includes(requestedProgram) ? requestedProgram : '', regNumber: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function set(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (busy) return;
    setError('');
    setBusy(true);
    try {
      const user = await register(form);
      navigate(homeForRole(user.role));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell title="Your next chapter starts here" subtitle="Create your student account and build a consistent study routine.">
      <form className="auth-fields" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="fullName">Full name</label>
          <input required name="name" autoComplete="name" placeholder="Your full name" id="fullName" value={form.fullName} onChange={set('fullName')} />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input required name="email" autoComplete="email" placeholder="you@example.com" id="email" type="email" value={form.email} onChange={set('email')} />
        </div>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="phone">Phone (M-Pesa)</label>
            <input type="tel" name="phone" autoComplete="tel" id="phone" value={form.phone} onChange={set('phone')} placeholder="07XX XXX XXX" />
          </div>
          <div className="field">
            <label htmlFor="regNumber">Registration number</label>
            <input name="regNumber" autoComplete="off" id="regNumber" value={form.regNumber} onChange={set('regNumber')} placeholder="Optional" />
          </div>
        </div>
        <div className="field">
          <label htmlFor="program">Program</label>
          <select id="program" name="program" required value={form.program} onChange={set('program')}>
            <option value="" disabled>Select your study track</option>
            <option value="EMT">EMT</option><option value="Paramedic">Paramedic</option><option value="Nursing">Nursing</option>
          </select>
          <small>Choose EMT, Paramedic, or Nursing revision.</small>
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <div className="auth-password">
            <input id="password" name="password" autoComplete="new-password" required minLength={8} type={showPassword ? 'text' : 'password'} value={form.password} onChange={set('password')} aria-describedby="password-help" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} aria-pressed={showPassword}>{showPassword ? 'Hide' : 'Show'}</button>
          </div>
          <small id="password-help">Use at least 8 characters.</small>
        </div>
        {error && <div className="error-note" role="alert">{error}</div>}
        <button className="primary" type="submit" disabled={busy}>
          {busy ? 'Creating account…' : 'Create student account →'}
        </button>
      </form>
        <div className="switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
    </AuthShell>
  );
}
