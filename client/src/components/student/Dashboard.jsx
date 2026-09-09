import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Loading from '../shared/Loading';
import UiIcon from '../shared/UiIcon';
import heroImage from '../../assets/hero-paramedics.png';

function scoreFrom(attempts) {
  const scored = attempts.filter((item) => item.score_pct != null);
  return scored.length ? Math.round(scored.reduce((sum, item) => sum + Number(item.score_pct), 0) / scored.length) : 0;
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [attempts, setAttempts] = useState([]);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([api('/assessments/my-attempts'), api(`/analytics/students/${user.id}/progress`)]).then(([attemptResult, progressResult]) => {
      setAttempts(attemptResult.status === 'fulfilled' ? attemptResult.value.attempts || [] : []);
      setProgress(progressResult.status === 'fulfilled' ? progressResult.value.progress || [] : []);
    }).finally(() => setLoading(false));
  }, [user.id]);

  const accuracy = scoreFrom(attempts);
  const completed = attempts.filter((item) => ['graded', 'submitted', 'completed'].includes(String(item.status || '').toLowerCase())).length;
  const recent = attempts.slice(0, 3);
  const firstName = user?.name?.split(' ')?.[0] || 'Student';
  const stats = useMemo(() => [
    { value: '1,248', label: 'Total Questions', icon: 'exam', tone: 'blue' },
    { value: String(completed || 0), label: 'Practice Exams', icon: 'practice', tone: 'mint' },
    { value: `${accuracy}%`, label: 'Avg. Score', icon: 'result', tone: 'green' },
    { value: '0', label: 'Day Streak', icon: 'activity', tone: 'orange' },
  ], [accuracy, completed]);

  if (loading) return <Loading label="Loading your dashboard..." />;

  return (
    <div className="new-dashboard">
      <section className="new-dashboard-hero" style={{ '--new-dashboard-hero-image': `url(${heroImage})` }}><div><span className="new-dashboard-kicker">{user?.program || 'EMT'} revision workspace</span><h1>Welcome back, Future {user?.program === 'Paramedic' ? 'Paramedic' : firstName}!</h1><p>Small steps. Big progress. You&apos;ve got this.</p></div></section>
      <div className="new-dashboard-stats">{stats.map((stat) => <div className="new-dashboard-stat" key={stat.label}><span className={`new-dashboard-stat-icon ${stat.tone}`}><UiIcon name={stat.icon} /></span><div><strong>{stat.value}</strong><span>{stat.label}</span></div></div>)}</div>
      <div className="new-dashboard-grid">
        <section className="new-dashboard-panel new-dashboard-continue"><div className="new-dashboard-panel-head"><h2>Continue Learning</h2><Link to="/student/question-bank">View all <UiIcon name="arrowRight" /></Link></div><Link className="new-dashboard-learning-item" to="/student/question-bank"><span className="new-dashboard-round-icon"><UiIcon name="progress" /></span><div><strong>{recent[0]?.title || 'Start your first revision session'}</strong><span>{recent[0]?.score_pct != null ? `${recent[0].score_pct}% complete` : 'Choose a topic to begin'}</span><span className="new-dashboard-learning-progress"><i style={{ width: `${recent[0]?.score_pct || 0}%` }} /></span></div><span className="new-dashboard-action">Continue <UiIcon name="arrowRight" /></span></Link></section>
        <section className="new-dashboard-panel"><div className="new-dashboard-panel-head"><h2>Quick Actions</h2></div><div className="new-dashboard-actions"><Link to="/student/mock-prep-tests"><UiIcon name="practice" /> Take a Practice Exam <UiIcon name="arrowRight" /></Link><Link to="/student/question-bank"><UiIcon name="exam" /> Browse Question Bank <UiIcon name="arrowRight" /></Link><Link to="/student/study-planner"><UiIcon name="calendar" /> View Study Plan <UiIcon name="arrowRight" /></Link><Link to="/student/progress-analytics"><UiIcon name="progress" /> Track My Progress <UiIcon name="arrowRight" /></Link></div></section>
        <section className="new-dashboard-panel"><div className="new-dashboard-panel-head"><h2>Recent Activity</h2><Link to="/student/progress-analytics">View all <UiIcon name="arrowRight" /></Link></div><div className="new-dashboard-activity">{recent.length ? recent.map((item, index) => <Link to="/student/question-bank" key={item.attempt_id || index}><span className={`new-dashboard-activity-dot tone-${index + 1}`}><UiIcon name={index === 1 ? 'practice' : 'exam'} /></span><span>{item.title || 'Practice session'}<small>{item.score_pct != null ? `${item.score_pct}% score` : 'In progress'}</small></span><time>{index === 0 ? 'Recent' : `${index + 1}h ago`}</time></Link>) : <div className="new-dashboard-empty">Your completed revision activity will appear here.</div>}</div></section>
        <section className="new-dashboard-panel new-dashboard-featured"><div className="new-dashboard-panel-head"><h2>Featured</h2></div><div className="new-dashboard-featured-content"><span className="new-dashboard-featured-icon"><UiIcon name="activity" /></span><div><strong>High-Yield Topics</strong><p>Focus on the most tested content areas for your EMT and Paramedic exams.</p><Link to="/student/learning-paths">View topics <UiIcon name="arrowRight" /></Link></div></div></section>
      </div>
    </div>
  );
}
