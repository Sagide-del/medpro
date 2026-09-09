import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import UiIcon from '../shared/UiIcon';

const PLANS = [
  { title: 'EMT 4-Week Plan', text: 'Build core knowledge and test readiness with focused weekly blocks.', icon: 'calendar', tone: 'blue', action: 'Use plan' },
  { title: 'EMT 8-Week Plan', text: 'Cover major topics with deliberate practice and clinical review.', icon: 'learn', tone: 'violet', action: 'Use plan' },
  { title: 'Custom Plan', text: 'Set your own exam date, study hours, and revision priorities.', icon: 'progress', tone: 'green', action: 'Create plan' },
];
const FALLBACK_BLOCKS = [
  { topic: 'Preparatory', detail: 'Anatomy, physiology, medical terminology', mastery: 0 },
  { topic: 'Airway & Breathing', detail: 'Airway management, ventilation, oxygen therapy', mastery: 0 },
  { topic: 'Cardiology & Trauma', detail: 'ECG, ACS, arrhythmias, trauma assessment', mastery: 0 },
  { topic: 'Medical, Pediatrics & OB/GYN', detail: 'Common illnesses, medications, special populations', mastery: 0 },
];
const plannerEnabled = import.meta.env.VITE_PLANNER_PREDICTION_ENABLED === 'true';

function daysRemaining(date) {
  if (!date) return 'Set an exam date';
  return `${Math.max(0, Math.ceil((new Date(date).getTime() - Date.now()) / 86400000))} days remaining`;
}

export default function StudyPlanner() {
  const { user } = useAuth();
  const [program, setProgram] = useState(user?.program || 'EMT');
  const [examDate, setExamDate] = useState('');
  const [hours, setHours] = useState('1');
  const [plan, setPlan] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!plannerEnabled) return;
    Promise.allSettled([api('/planner/today'), api('/planner/predictions')]).then(([today, prediction]) => {
      if (today.status === 'fulfilled') setPlan(today.value.plan || null);
      if (prediction.status === 'fulfilled') setPredictions(prediction.value.predictions || []);
    });
  }, []);

  const blocks = plan?.blocks?.length ? plan.blocks : FALLBACK_BLOCKS.map((item, index) => ({ ...item, id: `${item.topic}-${index}`, minutes: 30, reason: index === 0 ? 'Recommended starting point' : 'Next in your pathway', completed: false, target: 70 }));
  const weakTopics = useMemo(() => predictions.slice().sort((a, b) => a.mastery - b.mastery).slice(0, 3), [predictions]);

  async function generatePlan() {
    if (!plannerEnabled) { setMessage('Your planner is ready. Add an exam date when prediction mode is enabled.'); return; }
    setBusy(true); setMessage('');
    try { const data = await api('/planner/generate', { method: 'POST', body: { examDate: examDate || null, dailyStudyHours: Number(hours) } }); setPlan(data.plan); setPredictions(data.predictions || []); setMessage('Today’s plan has been updated.'); } catch (error) { setMessage(error.message); } finally { setBusy(false); }
  }

  async function completeBlock(block) {
    if (!plannerEnabled) { setMessage('Complete this block from the linked learning activity.'); return; }
    try { await api('/planner/update', { method: 'POST', body: { topic: block.topic, durationMinutes: block.minutes, performance: block.mastery || 0, rating: 2 } }); setPlan((current) => current ? { ...current, blocks: current.blocks.map((item) => item.id === block.id ? { ...item, completed: true } : item) } : current); } catch (error) { setMessage(error.message); }
  }

  return <div className="new-reference-page new-study-plans planner-dashboard"><header className="planner-dashboard-head"><div><span className="platform-eyebrow">Personal learning workspace</span><h1>Study Plans</h1><p>Structured revision for {program} learners, shaped around your exam readiness.</p></div><div className="planner-countdown"><span>Exam countdown</span><strong>{daysRemaining(examDate)}</strong></div></header>
    <div className="new-track-tabs" role="tablist" aria-label="Certification track">{['EMT', 'Paramedic'].map((item) => <button type="button" role="tab" aria-selected={program === item} className={program === item ? 'is-active' : ''} onClick={() => setProgram(item)} key={item}>{item}</button>)}</div>
    <section className="planner-controls"><label>Exam date<input type="date" value={examDate} onChange={(event) => setExamDate(event.target.value)} /></label><label>Daily study hours<select value={hours} onChange={(event) => setHours(event.target.value)}><option value="0.5">30 minutes</option><option value="1">1 hour</option><option value="2">2 hours</option><option value="3">3 hours</option></select></label><button type="button" className="new-button new-button-primary" onClick={generatePlan} disabled={busy}>{busy ? 'Updating...' : 'Generate today’s plan'} <UiIcon name="arrowRight" /></button></section>
    {message && <div className="planner-message" role="status">{message}</div>}
    <div className="new-plan-cards">{PLANS.map((item, index) => <article className={`new-plan-card ${item.tone}`} key={item.title}><span className="new-plan-icon"><UiIcon name={item.icon} /></span>{index === 0 && <b>Recommended</b>}<h2>{item.title}</h2><p>{item.text}</p><button type="button" onClick={generatePlan}>{item.action} <UiIcon name="arrowRight" /></button></article>)}</div>
    <div className="planner-dashboard-grid"><section className="new-plan-overview planner-schedule"><div className="planner-section-head"><div><span className="platform-eyebrow">Today</span><h2>Your study schedule</h2></div><span>{blocks.filter((item) => item.completed).length}/{blocks.length} complete</span></div>{blocks.map((item, index) => <div className={`new-week-row planner-block ${item.completed ? 'is-complete' : ''}`} key={item.id}><span className="new-week-number">{index + 1}</span><div><strong>{item.topic}</strong><small>{item.detail || `${item.reason || 'Focused review'} · ${item.minutes || 30} minutes`}</small></div><span className="planner-block-progress"><i style={{ width: `${Math.min(100, Number(item.mastery || 0))}%` }} /></span><button type="button" onClick={() => completeBlock(item)} aria-label={`Mark ${item.topic} complete`}>{item.completed ? 'Done' : 'Start'}</button></div>)}</section><aside className="planner-weak-topics"><span className="platform-eyebrow">Focus next</span><h2>Topics needing attention</h2>{(weakTopics.length ? weakTopics : [{ topic: 'Airway & Breathing', mastery: 0 }, { topic: 'Trauma', mastery: 0 }, { topic: 'Medical emergencies', mastery: 0 }]).map((item) => <Link to="/student/question-bank" key={item.topic}><span><strong>{item.topic}</strong><small>{item.mastery}% mastery · target 70%</small></span><UiIcon name="arrowRight" /></Link>)}</aside></div></div>;
}
