import UiIcon from '../shared/UiIcon';
import { useNavigate } from 'react-router-dom';

const SECTIONS = [
  {
    number: '01',
    title: 'Clinical Judgment',
    simulatorTitle: 'Written Exam Simulator',
    tag: 'PROMETRIC-STYLE CBT',
    format: 'Adaptive assessment',
    detail: 'Clinical reasoning and decision-making across emergency basics, trauma, and medical emergencies.',
    icon: 'exam',
    tone: 'blue',
    meta: ['75 questions', '90 min', 'Mark for review'],
    action: 'Resume simulator',
  },
  {
    number: '02',
    title: 'Situational Judgment',
    simulatorTitle: 'Practical Skills Simulator',
    tag: 'SCENARIO-BASED',
    format: 'Scenario assessment',
    detail: 'Ethics, leadership, professionalism, patient safety, and communication in EMS situations.',
    icon: 'cases',
    tone: 'violet',
    meta: ['Dynamic vitals', '4 decision points'],
    action: 'Start scenario',
  },
  {
    number: '03',
    title: 'Psychological Readiness',
    simulatorTitle: 'Psychometric & Ethics Lab',
    tag: 'SJT + STRUCTURED WRITING',
    format: 'Scale and scenarios',
    detail: 'Emotional stability, empathy, resilience, stress management, and readiness for EMS work.',
    icon: 'activity',
    tone: 'green',
    meta: ['600 words', '45 min', 'Real-world dilemmas'],
    action: 'Open lab',
  },
];

export default function PsychometricTest() {
  const navigate = useNavigate();
  const destinations = ['/student/mcq/mock-pretest', '/student/learn/kenya-ems', '/student/assessments'];
  return (
    <div className="psychometric-page psychometric-simulator-page">
      <header className="psychometric-simulator-head"><div><span className="platform-eyebrow">Assessment workspace</span><h1>Choose your simulation</h1><p>Train across all assessment formats used in the EMT and Paramedic process.</p></div><span className="psychometric-simulator-count"><UiIcon name="practice" />3 formats</span></header>
      <div className="psychometric-card-grid">
        {SECTIONS.map((section) => (
          <article className={`psychometric-card ${section.tone}`} key={section.number}>
            <div className="psychometric-card-top"><span className="psychometric-card-icon"><UiIcon name={section.icon} /></span><span className="psychometric-card-tag">{section.tag}</span></div><span className="psychometric-card-area">{section.number} · {section.title}</span><h2>{section.simulatorTitle}</h2><strong>{section.format}</strong><p>{section.detail}</p>{section.number === '02' && <div className="psychometric-scenario-steps">{['Scene', 'Primary', 'Treatment', 'Transport'].map((step, index) => <span key={step}><b>{index + 1}</b>{step}</span>)}</div>}{section.number === '03' && <div className="psychometric-framework"><span>S</span><span>A</span><span>R</span></div>}<div className="psychometric-card-meta">{section.meta.map((item) => <span key={item}><UiIcon name={item.includes('question') || item.includes('words') ? 'document' : item.includes('review') || item.includes('vitals') ? 'activity' : 'simulation'} />{item}</span>)}</div><button type="button" onClick={() => navigate(destinations[Number(section.number) - 1])}>{section.action} <UiIcon name="arrowRight" /></button>
          </article>
        ))}
      </div>
      <section className="psychometric-scheduled"><span className="psychometric-scheduled-icon"><UiIcon name="calendar" /></span><div><strong>Next scheduled session</strong><small>Get back on track and keep your momentum.</small></div><div className="psychometric-scheduled-detail"><strong>Written exam · 50 questions · 90 min</strong><small><UiIcon name="simulation" /> Tomorrow, 10:00 AM</small></div><button type="button" onClick={() => navigate('/student/mcq/mock-pretest')}>Begin focused session <UiIcon name="arrowRight" /></button><button type="button" className="psychometric-more" aria-label="More session options">...</button></section>
    </div>
  );
}
