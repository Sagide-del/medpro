import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Loading from '../shared/Loading';

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
  const [logbook, setLogbook] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [simulationResults, setSimulationResults] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api(`/analytics/students/${user.id}/progress`).then((data) => setProgress(data.progress)),
      api('/assessments/my-attempts').then((data) => setAttempts(data.attempts.slice(0, 8))),
      api('/logbook').then((data) => setLogbook(data)),
      api('/payments/subscription').then((data) => setSubscription(data)),
      api('/assignment-workflow/student/assignments').then((data) => setAssignments(data.assignments.slice(0, 8))).catch(() => setAssignments([])),
      api('/simulations/my-results').then((data) => setSimulationResults(data.results.slice(0, 6))).catch(() => setSimulationResults([])),
    ]).catch((err) => setError(err.message));
  }, [user.id]);

  const readinessScore = useMemo(() => (
    progress?.length
      ? Math.round(progress.reduce((sum, item) => sum + Number(item.avg_score || 0), 0) / progress.length)
      : 62
  ), [progress]);

  const logbookCounts = useMemo(() => {
    const approved = Number(logbook?.progress?.approved_count || 0);
    const required = Number(logbook?.progress?.required_entries || 0);
    return { approved, required };
  }, [logbook]);

  const logbookPct = useMemo(() => (
    logbookCounts.required ? Math.round((logbookCounts.approved / logbookCounts.required) * 100) : 0
  ), [logbookCounts]);

  const clinicalProgress = useMemo(() => (
    simulationResults.length
      ? Math.round(simulationResults.reduce((sum, item) => sum + Number(item.overall_competency_score || 0), 0) / simulationResults.length)
      : 35
  ), [simulationResults]);

  const firstName = user.name?.split(' ')?.[0] || 'Student';
  const renewalDate = subscription?.subscription?.expiresAt
    ? new Date(subscription.subscription.expiresAt).toLocaleDateString('en-KE')
    : 'Not active';

  const kpis = useMemo(() => ([
    {
      title: 'Subscription',
      value: subscription?.active ? 'ACTIVE' : 'INACTIVE',
      meta: `Renewal date ${renewalDate}`,
      progress: subscription?.active ? 100 : 20,
      tone: subscription?.active ? 'success' : 'danger',
      icon: 'SB',
    },
    {
      title: 'Exam Readiness',
      value: `${clampPercent(readinessScore)}%`,
      meta: 'Based on assessments and practice',
      progress: clampPercent(readinessScore),
      tone: 'accent',
      icon: 'EX',
    },
    {
      title: 'Clinical Progress',
      value: `${clampPercent(clinicalProgress)}%`,
      meta: 'Based on simulations and logbook',
      progress: clampPercent(clinicalProgress),
      tone: 'accent',
      icon: 'CP',
    },
    {
      title: 'Logbook Completion',
      value: `${logbookCounts.approved}/${logbookCounts.required}`,
      meta: 'Clinical entries completed',
      progress: clampPercent(logbookPct),
      tone: 'neutral',
      icon: 'LG',
    },
  ]), [clinicalProgress, logbookCounts, logbookPct, readinessScore, renewalDate, subscription?.active]);

  const continueLearning = useMemo(() => {
    const mcqCount = attempts.filter((attempt) => ['graded', 'submitted', 'completed'].includes(String(attempt.status || '').toLowerCase())).length;
    const nextAssignment = assignments.find((assignment) => !['submitted', 'graded', 'released'].includes(String(assignment.submission_status || '').toLowerCase()));
    const latestSimulation = simulationResults[0];

    return [
      {
        title: 'Trauma Assessment MCQs',
        meta: `MCQ Practice • ${mcqCount || 12} questions completed`,
        action: 'Continue',
        to: '/student/mcq-questions',
      },
      {
        title: 'Airway Management',
        meta: 'Clinical Reference Card',
        action: 'Review',
        to: '/student/reference-cards',
      },
      {
        title: 'Cardiac Emergencies Mock Test',
        meta: latestSimulation ? `Mock Prep Test • ${latestSimulation.category || '100 questions'}` : 'Mock Prep Test • 100 questions',
        action: 'Continue',
        to: '/student/mock-prep-tests',
      },
      {
        title: nextAssignment?.title || 'Patient Assessment Assignment',
        meta: nextAssignment?.due_date ? `Assignment • Due ${formatDate(nextAssignment.due_date)}` : 'Assignment • Due in 2 days',
        action: 'Open',
        to: nextAssignment ? `/student/assignments/${nextAssignment.assignment_id}` : '/student/assignments',
      },
    ];
  }, [assignments, attempts, simulationResults]);

  const upcomingTasks = useMemo(() => ([
    {
      title: 'Complete Cardiology Module',
      area: 'Exam Center',
      due: attempts[0]?.submitted_at ? formatDate(attempts[0].submitted_at) : 'Due this week',
      to: '/student/exam-center',
    },
    {
      title: 'Log Clinical Cases',
      area: 'Clinical Logbook',
      due: logbookCounts.required > logbookCounts.approved ? `${logbookCounts.required - logbookCounts.approved} entries pending` : 'All required entries complete',
      to: '/student/logbook',
    },
    {
      title: 'Trauma Practical Assignment',
      area: 'Assignments',
      due: assignments[0]?.due_date ? formatDate(assignments[0].due_date) : 'Due soon',
      to: '/student/assignments',
    },
    {
      title: 'Practice Airway Scenario',
      area: 'Skill Simulation',
      due: simulationResults[0]?.completed_at ? `Last attempt ${formatDate(simulationResults[0].completed_at)}` : 'Ready to start',
      to: '/student/simulations',
    },
  ]), [assignments, attempts, logbookCounts, simulationResults]);

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
  if (!progress || !subscription || !logbook) return <Loading label="Loading your dashboard..." />;

  return (
    <>
      <div className="page-head dashboard-head">
        <div>
          <h1>Welcome back, {firstName}</h1>
          <div className="sub">Continue building your EMS expertise.</div>
        </div>
      </div>

      <div className="dashboard-kpi-grid">
        {kpis.map((item) => (
          <div key={item.title} className="card dashboard-kpi-card">
            <div className="dashboard-kpi-top">
              <span className={`dashboard-kpi-icon ${item.tone}`}>{item.icon}</span>
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
              <h2>Continue Learning</h2>
            </div>
          </div>
          <div className="dashboard-stack">
            {continueLearning.map((item) => (
              <Link key={`${item.title}-${item.to}`} to={item.to} className="dashboard-list-card">
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
              <h2>Upcoming Tasks</h2>
            </div>
          </div>
          <div className="dashboard-stack">
            {upcomingTasks.map((task) => (
              <Link key={`${task.title}-${task.to}`} to={task.to} className="dashboard-list-card">
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
