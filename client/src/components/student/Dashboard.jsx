import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Loading from '../shared/Loading';
import UiIcon from '../shared/UiIcon';

function formatDate(value, fallback = 'No due date') {
  return value ? new Date(value).toLocaleDateString('en-KE') : fallback;
}

function formatDateTime(value, fallback = 'Recent') {
  return value ? new Date(value).toLocaleString('en-KE') : fallback;
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [progress, setProgress] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [simulationResults, setSimulationResults] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api(`/analytics/students/${user.id}/progress`).then((data) => setProgress(data.progress)),
      api('/assessments/my-attempts').then((data) => setAttempts(data.attempts.slice(0, 8))),
      api('/assignment-workflow/student/assignments').then((data) => setAssignments(data.assignments.slice(0, 8))).catch(() => setAssignments([])),
      api('/simulations/my-results').then((data) => setSimulationResults(data.results.slice(0, 6))).catch(() => setSimulationResults([])),
    ]).catch((err) => setError(err.message));
  }, [user.id]);

  const readinessScore = useMemo(() => (
    progress?.length
      ? Math.round(progress.reduce((sum, item) => sum + Number(item.avg_score || 0), 0) / progress.length)
      : 0
  ), [progress]);

  const clinicalProgress = useMemo(() => (
    simulationResults.length
      ? Math.round(simulationResults.reduce((sum, item) => sum + Number(item.overall_competency_score || 0), 0) / simulationResults.length)
      : 0
  ), [simulationResults]);

  const practiceScore = useMemo(() => {
    const scored = attempts.filter((attempt) => attempt.score_pct != null);
    return scored.length
      ? Math.round(scored.reduce((sum, attempt) => sum + Number(attempt.score_pct || 0), 0) / scored.length)
      : 0;
  }, [attempts]);

  const firstName = user.name?.split(' ')?.[0] || 'Student';
  const kpis = useMemo(() => ([
    {
      title: 'Exam Readiness',
      value: `${clampPercent(readinessScore)}%`,
      meta: progress?.length ? 'Across completed topics' : 'Start your first practice set',
      progress: clampPercent(readinessScore),
      tone: 'accent',
      icon: 'exam',
    },
    {
      title: 'Practice Score',
      value: `${clampPercent(practiceScore)}%`,
      meta: `${attempts.length} question set${attempts.length === 1 ? '' : 's'} attempted`,
      progress: clampPercent(practiceScore),
      tone: 'accent',
      icon: 'result',
    },
    {
      title: 'Clinical Progress',
      value: `${clampPercent(clinicalProgress)}%`,
      meta: `${simulationResults.length} simulation${simulationResults.length === 1 ? '' : 's'} completed`,
      progress: clampPercent(clinicalProgress),
      tone: 'neutral',
      icon: 'activity',
    },
  ]), [attempts.length, clinicalProgress, practiceScore, progress?.length, readinessScore, simulationResults.length]);

  const continueLearning = useMemo(() => {
    const mcqCount = attempts.filter((attempt) => ['graded', 'submitted', 'completed'].includes(String(attempt.status || '').toLowerCase())).length;
    const latestSimulation = simulationResults[0];

    return [
      {
        title: 'Question Bank',
        meta: `${mcqCount} practice attempt${mcqCount === 1 ? '' : 's'}`,
        action: 'Practice',
        to: '/student/mcq-questions',
        icon: 'exam',
      },
      {
        title: 'Cheat Sheets',
        meta: 'Fast clinical revision',
        action: 'Review',
        to: '/student/reference-cards',
        icon: 'document',
      },
      {
        title: 'Mock Prep Tests',
        meta: latestSimulation ? `Latest focus | ${latestSimulation.category || 'Ready to start'}` : 'Timed exam preparation',
        action: 'Start',
        to: '/student/mock-prep-tests',
        icon: 'simulation',
      },
      {
        title: 'Clinical Cases',
        meta: 'Decision-making practice',
        action: 'Open',
        to: '/student/learn/kenya-ems',
        icon: 'cases',
      },
    ];
  }, [attempts, simulationResults]);

  const upcomingTasks = useMemo(() => ([
    {
      title: 'Complete cardiology practice',
      area: 'Exam Center',
      due: attempts[0]?.submitted_at ? formatDate(attempts[0].submitted_at) : 'Due this week',
      to: '/student/exam-center',
    },
    {
      title: 'Run a clinical scenario',
      area: 'Skill Simulation',
      due: simulationResults[0]?.completed_at ? `Last attempt ${formatDate(simulationResults[0].completed_at)}` : 'Ready to start',
      to: '/student/simulations',
    },
  ]), [attempts, simulationResults]);

  const recentActivity = useMemo(() => {
    const examItems = attempts.slice(0, 3).map((attempt) => ({
      id: `exam-${attempt.attempt_id}`,
      title: attempt.title || 'Assessment attempt',
      detail: attempt.score_pct != null ? `${attempt.score_pct}%` : String(attempt.status || 'In progress').replace(/_/g, ' '),
      at: attempt.submitted_at || attempt.completed_at || attempt.started_at,
      to: '/student/assessments',
    }));

    const simItems = simulationResults.slice(0, 2).map((result, index) => ({
      id: `sim-${result.simulation_attempt_id || index}`,
      title: result.title || 'Skill simulation',
      detail: result.overall_competency_score != null ? `${result.overall_competency_score}% competency` : 'Completed',
      at: result.completed_at || result.created_at,
      to: '/student/simulations',
    }));

    const assignmentItems = assignments
      .filter((assignment) => assignment.submission_status)
      .slice(0, 3)
      .map((assignment) => ({
        id: `assignment-${assignment.assignment_id}`,
        title: assignment.title,
        detail: String(assignment.submission_status || 'Submitted').replace(/_/g, ' '),
        at: assignment.updated_at || assignment.submitted_at || assignment.due_date,
        to: `/student/assignments/${assignment.assignment_id}`,
      }));

    return [...examItems, ...simItems, ...assignmentItems]
      .sort((a, b) => new Date(b.at || 0).getTime() - new Date(a.at || 0).getTime())
      .slice(0, 8);
  }, [assignments, attempts, simulationResults]);

  if (error) return <div className="alert">{error}</div>;
  if (!progress) return <Loading label="Loading your revision workspace..." />;

  return (
    <>
      <div className="page-head dashboard-head">
        <div>
          <h1>Welcome back, {firstName}</h1>
          <div className="sub">Pick up your next revision session.</div>
        </div>
      </div>

      <section className="student-dashboard-hero">
        <div>
          <span className="platform-eyebrow">{user?.program || 'EMT'} revision workspace</span>
          <h2>Welcome back, Future {user?.program === 'Paramedic' ? 'Paramedic' : 'EMT'}.</h2>
          <p>Small steps. Big progress. Pick up where you left off and keep building exam confidence.</p>
          <div className="student-dashboard-hero-actions">
            <Link className="dashboard-hero-primary" to="/student/question-bank">Continue learning <span aria-hidden="true">→</span></Link>
            <Link className="dashboard-hero-secondary" to="/student/mock-prep-tests">Take a practice exam</Link>
          </div>
        </div>
        <div className="student-dashboard-hero-art" aria-hidden="true"><UiIcon name="cases" /><span>Learn<br />Practice<br />Pass</span></div>
      </section>

      <div className="dashboard-kpi-grid">
        {kpis.map((item) => (
          <div key={item.title} className="card dashboard-kpi-card">
            <div className="dashboard-kpi-top">
              <span className={`dashboard-kpi-icon ${item.tone}`}><UiIcon name={item.icon} /></span>
              <span className="dashboard-kpi-title">{item.title}</span>
            </div>
            <div className="dashboard-kpi-value">{item.value}</div>
            <div className="dashboard-kpi-meta">{item.meta}</div>
            <div className="progress-bar dashboard-progress">
              <div style={{ width: `${item.progress}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="dashboard-section-head">
            <div>
              <h2>Continue Revision</h2>
            </div>
          </div>
          <div className="dashboard-stack">
            {continueLearning.map((item) => (
              <Link key={`${item.title}-${item.to}`} to={item.to} className="dashboard-list-card">
                <span className="dashboard-list-icon"><UiIcon name={item.icon} /></span>
                <div>
                  <div className="dashboard-list-title">{item.title}</div>
                  <div className="dashboard-list-meta">{item.meta}</div>
                </div>
                <div className="dashboard-list-cta">{item.action}</div>
              </Link>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="dashboard-section-head">
            <div>
              <h2>Recommended Next</h2>
            </div>
          </div>
          <div className="dashboard-stack">
            {upcomingTasks.map((task) => (
              <Link key={`${task.title}-${task.to}`} to={task.to} className="dashboard-list-card">
                <span className="dashboard-list-icon"><UiIcon name="calendar" /></span>
                <div>
                  <div className="dashboard-list-title">{task.title}</div>
                  <div className="dashboard-list-meta">{task.area}</div>
                </div>
                <div className="dashboard-task-side">{task.due}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="dashboard-section-head">
          <div>
            <h2>Recent Activity</h2>
          </div>
        </div>
        <div className="dashboard-stack">
          {recentActivity.map((activity) => (
            <Link key={activity.id} to={activity.to} className="dashboard-list-card">
              <span className="dashboard-list-icon"><UiIcon name="activity" /></span>
              <div>
                <div className="dashboard-list-title">{activity.title}</div>
                <div className="dashboard-list-meta">{activity.detail}</div>
              </div>
              <div className="dashboard-time">{formatDateTime(activity.at)}</div>
            </Link>
          ))}
          {recentActivity.length === 0 && <div className="dashboard-empty">No recent activity yet.</div>}
        </div>
      </div>
    </>
  );
}
