import UiIcon from '../shared/UiIcon';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import PublishedLibrary from './PublishedLibrary';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

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
  const { user } = useAuth();
  const program = user?.program || 'EMT';
  const [counts, setCounts] = useState({});
  const [error, setError] = useState('');
  const [area, setArea] = useState(null);
  const areas = ['psychometric_clinical', 'psychometric_situational', 'psychometric_readiness'];
  useEffect(() => {
    let active = true;
    setCounts({}); setError(''); setArea(null);
    api(`/published-content/summary?program=${program}`).then((data) => { if (active) setCounts(data.counts || {}); }).catch((err) => { if (active) setError(err.message); });
    return () => { active = false; };
  }, [program]);
  if (area) return <><button type="button" onClick={() => setArea(null)}>Back to assessment areas</button><PublishedLibrary destination={area} title={SECTIONS[areas.indexOf(area)].title} /></>;
  const destinations = areas;
  return (
    <div className="psychometric-page psychometric-simulator-page">
      <header className="psychometric-simulator-head"><div><span className="platform-eyebrow">Assessment workspace</span><h1>Choose your simulation</h1><p>Train across all assessment formats used in the EMT and Paramedic process.</p></div><span className="psychometric-simulator-count"><UiIcon name="practice" />3 formats</span></header>
      <div className="psychometric-card-grid">
        {error && <p role="alert">{error}</p>}
        {SECTIONS.map((definition, index) => {
          const section = { ...definition, meta: [`${counts[areas[index]] || 0} published activities`, `${program} pathway`, 'Saved responses'], action: 'Open activities' };
          return (
          <article className={`psychometric-card ${section.tone}`} key={section.number}>
            <div className="psychometric-card-top"><span className="psychometric-card-icon"><UiIcon name={section.icon} /></span><span className="psychometric-card-tag">{section.tag}</span></div><span className="psychometric-card-area">{section.number} · {section.title}</span><h2>{section.simulatorTitle}</h2><strong>{section.format}</strong><p>{section.detail}</p>{section.number === '02' && <div className="psychometric-scenario-steps">{['Scene', 'Primary', 'Treatment', 'Transport'].map((step, index) => <span key={step}><b>{index + 1}</b>{step}</span>)}</div>}{section.number === '03' && <div className="psychometric-framework"><span>S</span><span>A</span><span>R</span></div>}<div className="psychometric-card-meta">{section.meta.map((item) => <span key={item}><UiIcon name={item.includes('question') || item.includes('words') ? 'document' : item.includes('review') || item.includes('vitals') ? 'activity' : 'simulation'} />{item}</span>)}</div><button type="button" onClick={() => setArea(destinations[Number(section.number) - 1])}>{section.action} <UiIcon name="arrowRight" /></button>
          </article>
        ); })}
      </div>
      <section className="psychometric-scheduled"><span className="psychometric-scheduled-icon"><UiIcon name="calendar" /></span><div><strong>Your next practice session</strong><small>Choose a published activity or plan your study time.</small></div><div className="psychometric-scheduled-detail"><strong>{areas.reduce((sum, key) => sum + (counts[key] || 0), 0)} published activities</strong><small><UiIcon name="simulation" />{program} revision</small></div><button type="button" disabled={!areas.some((key) => counts[key])} onClick={() => setArea(areas.find((key) => counts[key]))}>Begin focused session <UiIcon name="arrowRight" /></button><button type="button" className="psychometric-more" aria-label="Open study planner" onClick={() => navigate('/student/study-planner')}>...</button></section>
    </div>
  );
}
