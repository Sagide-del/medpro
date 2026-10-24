import { Link } from 'react-router-dom';
import heroImage from '../assets/hero-paramedics.png';

export default function AuthShell({ title, subtitle, children }) {
  return <main className="auth-wrap public-auth">
    <div className="auth-card">
      <aside className="auth-brand-panel" style={{ '--auth-hero-image': `url(${heroImage})` }}>
        <Link to="/" className="auth-brand-link" aria-label="MedProHub home"><img src="/medpro-logo.png" alt="MedProHub" /></Link>
        <div className="auth-brand-copy"><span>LEARN. PRACTISE. BE READY.</span><h2>Knowledge for the moments that matter.</h2><p>Build your EMT and paramedic knowledge, one focused study session at a time.</p><ul><li>Exam practice and clinical cases</li><li>Flashcards and revision resources</li><li>Your learning, at your pace</li></ul></div>
      </aside>
      <section className="auth-form-panel" aria-labelledby="auth-title">
        <Link to="/" className="back-link">← Back to home</Link>
        <h1 id="auth-title">{title}</h1><p className="auth-intro">{subtitle}</p>
        {children}
        <p className="auth-credit">MedProHub · Andolih EdTech Studios</p>
      </section>
    </div>
  </main>;
}
