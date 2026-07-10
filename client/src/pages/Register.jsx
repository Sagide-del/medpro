import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { homeForRole } from '../services/auth';
import PulseLine from '../components/PulseLine';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', program: '', regNumber: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function set(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function handleSubmit() {
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
    <div className="auth-wrap">
      <div className="auth-card">
        <Link to="/" className="back-link">&larr; Back to home</Link>
        <h1>Med<span>Pro</span></h1>
        <div className="tag">Create your student account</div>
        <PulseLine color="#cc0000" width={330} />
        <div className="field" style={{ marginTop: 18 }}>
          <label htmlFor="fullName">Full name</label>
          <input id="fullName" value={form.fullName} onChange={set('fullName')} />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={form.email} onChange={set('email')} />
        </div>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="phone">Phone (M-Pesa)</label>
            <input id="phone" value={form.phone} onChange={set('phone')} placeholder="07XX XXX XXX" />
          </div>
          <div className="field">
            <label htmlFor="regNumber">Registration number</label>
            <input id="regNumber" value={form.regNumber} onChange={set('regNumber')} placeholder="Optional" />
          </div>
        </div>
        <div className="field">
          <label htmlFor="program">Program</label>
          <input id="program" value={form.program} onChange={set('program')} placeholder="e.g. Diploma in Paramedicine" />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" value={form.password} onChange={set('password')}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} />
        </div>
        <button className="primary" onClick={handleSubmit} disabled={busy} style={{ width: '100%' }}>
          {busy ? 'Creating account…' : 'Create account'}
        </button>
        {error && <div className="error-note">{error}</div>}
        <div className="switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
