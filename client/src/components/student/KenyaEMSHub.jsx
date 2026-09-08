import { Link } from 'react-router-dom';
import UiIcon from '../shared/UiIcon';

const CASES = [
  ['DusitD2 terror attack', 'Nairobi County', 'Mass casualty'],
  ['Utumishi Girls Academy fire', 'Nakuru County', 'Multi-patient incident'],
  ['Kakamega school stampede', 'Kakamega County', 'Paediatric emergency'],
];

export default function KenyaEMSHub() {
  return (
    <div className="new-page new-kenya-page">
      <header className="new-page-header"><div><div className="new-eyebrow">Local clinical revision</div><h1>Kenya EMS Cases</h1><p className="new-muted">Casework, protocols, and exam comparison for Kenyan practice.</p></div></header>
      <div className="new-hub-grid">
        <section className="new-section new-hub-primary"><div className="new-section-heading"><h2>Local Case Studies</h2><span className="new-date-label">15 cases</span></div><div className="new-case-list">{CASES.map(([title, location, category]) => <Link className="new-case-row" to="/student/learn/kenya-ems" key={title}><span className="new-schedule-icon"><UiIcon name="cases" /></span><span><strong>{title}</strong><small>{location} · {category}</small></span><UiIcon name="arrowRight" /></Link>)}</div><Link className="new-button new-button-secondary" to="/student/learn/kenya-ems">View all cases</Link></section>
        <section className="new-section"><div className="new-section-heading"><h2>Regional Protocols</h2></div><p className="new-muted">Reference materials organised for Kenyan EMS practice and county contexts.</p><Link className="new-button new-button-secondary" to="/student/reference-cards">Open reference library</Link></section>
        <section className="new-section"><div className="new-section-heading"><h2>KEMS / NREMT Comparison</h2></div><p className="new-muted">Compare exam topics and focus your preparation on local priorities.</p><Link className="new-button new-button-secondary" to="/student/mcq-questions">Practice questions</Link></section>
        <section className="new-section new-resource-panel"><div className="new-section-heading"><h2>Emergency resources</h2></div><div className="new-resource-row"><strong>999 / 112</strong><span>National emergency numbers</span></div><div className="new-resource-row"><strong>County referral directory</strong><span>Keep local facilities in your revision notes</span></div></section>
      </div>
    </div>
  );
}
