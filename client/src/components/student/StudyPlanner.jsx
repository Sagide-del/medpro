import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import UiIcon from '../shared/UiIcon';

const PLANS = [
  { title: 'EMT 4-Week Plan', text: 'Build core knowledge and test readiness with 4 focused weeks.', icon: 'calendar', tone: 'blue', to: '/student/question-bank', action: 'View Plan' },
  { title: 'EMT 8-Week Plan', text: 'In-depth coverage of all major topics with practice exams.', icon: 'learn', tone: 'violet', to: '/student/question-bank', action: 'View Plan' },
  { title: 'Custom Plan', text: 'Set your own goals and timeline.', icon: 'progress', tone: 'green', to: '/student/notes', action: 'Create Plan' },
];
const WEEKS = [
  ['Week 1 - Fundamentals', 'Anatomy, physiology, Medical Terminology', 80],
  ['Week 2 - Airway & Breathing', 'Airway management, ventilation, oxygen therapy', 50],
  ['Week 3 - Cardiology & Trauma', 'ECG, ACS, arrhythmias, trauma assessment', 0],
  ['Week 4 - Medical, Pediatrics & OB/GYN', 'Common illnesses, medications, special populations', 0],
];

export default function StudyPlanner() {
  const { user } = useAuth();
  return <div className="new-reference-page new-study-plans"><header><h1>Study Plans</h1><p>Follow structured study plans designed for {user?.program || 'EMT'} and Paramedic students.</p></header><div className="new-track-tabs"><button type="button" className="is-active">EMT</button><button type="button">Paramedic</button></div><div className="new-plan-cards">{PLANS.map((plan, index) => <article className={`new-plan-card ${plan.tone}`} key={plan.title}><span className="new-plan-icon"><UiIcon name={plan.icon} /></span>{index === 0 && <b>Recommended</b>}<h2>{plan.title}</h2><p>{plan.text}</p><Link to={plan.to}>{plan.action} <UiIcon name="arrowRight" /></Link></article>)}</div><section className="new-plan-overview"><h2>Plan Overview</h2>{WEEKS.map(([title, text, progress], index) => <div className="new-week-row" key={title}><span className="new-week-number">{index + 1}</span><div><strong>{title}</strong><small>{text}</small></div><span className="new-week-bar"><i style={{ width: `${progress}%` }} /></span><em>{progress}%</em></div>)}</section></div>;
}
