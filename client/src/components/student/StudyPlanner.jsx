import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import UiIcon from '../shared/UiIcon';

const SCHEDULE = [
  { time: '08:00', title: 'Airway assessment', type: 'Review', icon: 'learn', to: '/student/learning-paths' },
  { time: '10:00', title: 'Preparatory question bank', type: 'Practice', icon: 'exam', to: '/student/question-bank' },
  { time: '14:00', title: 'Kenya EMS case study', type: 'Clinical case', icon: 'cases', to: '/student/learn/kenya-ems' },
];

export default function StudyPlanner() {
  const { user } = useAuth();
  const program = user?.program || 'EMT';
  const [editing, setEditing] = useState(false);
  const [target, setTarget] = useState(5);

  return (
    <div className="new-page new-planner-page">
      <header className="new-page-header">
        <div>
          <div className="new-eyebrow">Today&apos;s study plan</div>
          <h1>Study Planner</h1>
          <p className="new-muted">{program} revision plan</p>
        </div>
        <button type="button" className="new-button new-button-secondary" onClick={() => setEditing((value) => !value)}>{editing ? 'Close settings' : 'Edit plan'}</button>
      </header>

      <section className="new-planner-summary" aria-label="Study progress">
        <div><span>Streak</span><strong>0 days</strong></div>
        <div><span>This week</span><strong>0 / 5 sessions</strong></div>
        <div><span>Next exam</span><strong>Not set</strong></div>
      </section>

      <section className="new-section">
        <div className="new-section-heading"><h2>Today</h2><span className="new-date-label">Revision schedule</span></div>
        <div className="new-schedule-list">
          {SCHEDULE.map((item) => (
            <div className="new-schedule-row" key={item.time}>
              <time>{item.time}</time>
              <span className="new-schedule-icon"><UiIcon name={item.icon} /></span>
              <div className="new-schedule-copy"><strong>{item.title}</strong><span>{item.type}</span></div>
              <Link to={item.to} className="new-button new-button-link">Open</Link>
            </div>
          ))}
        </div>
      </section>

      {editing && <section className="new-planner-settings new-section"><div className="new-section-heading"><h2>Plan settings</h2><span className="new-date-label">Personalise your week</span></div><label>Weekly sessions<input type="number" min="1" max="14" value={target} onChange={(event) => setTarget(event.target.value)} /></label><p className="new-muted">Your target is {target} sessions this week.</p></section>}
      {!editing && <section className="new-empty-panel">
        <div className="new-empty-icon"><UiIcon name="calendar" /></div>
        <div><h2>Build a plan that fits your week</h2><p>Choose your exam date, county, and weekly target to personalise revision.</p></div>
        <button type="button" className="new-button">Set up plan</button>
      </section>}
    </div>
  );
}
