import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Vital from '../Vital';
import Loading from '../shared/Loading';

function formatDateTime(value) {
  return value ? new Date(value).toLocaleString('en-KE') : 'No date';
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
      api('/assessments/my-attempts').then((data) => setAttempts(data.attempts.slice(0, 6))),
      api('/logbook').then((data) => setLogbook(data)),
      api('/payments/subscription').then((data) => setSubscription(data)),
      api('/assignment-workflow/student/assignments').then((data) => setAssignments(data.assignments.slice(0, 6))).catch(() => setAssignments([])),
      api('/simulations/my-results').then((data) => setSimulationResults(data.results.slice(0, 4))).catch(() => setSimulationResults([])),
    ]).catch((err) => setError(err.message));
  }, [user.id]);

  const readinessScore = useMemo(() => (
    progress?.length
      ? Math.round(progress.reduce((sum, item) => sum + Number(item.avg_score), 0) / progress.length)
      : 0
  ), [progress]);

  const logbookPct = useMemo(() => (
    logbook?.progress
      ? Math.round((logbook.progress.approved_count / logbook.progress.required_entries) * 100)
      : 0
  ), [logbook]);

  const clinicalProgress = useMemo(() => (
    simulationResults.length
      ? Math.round(simulationResults.reduce((sum, item) => sum + Number(item.overall_competency_score || 0), 0) / simulationResults.length)
      : 0
  ), [simulationResults]);

  const continueItems = useMemo(() => {
    const items = [];
    const inProgressAssignment = assignments.find((assignment) => ['started', 'in_progress', 'draft', 'new'].includes(String(assignment.submission_status || 'new')));
    if (inProgressAssignment) {
      items.push({
        title: inProgressAssignment.title,
        meta: `Assignment • ${inProgressAssignment.topic || inProgressAssignment.module || 'Continue where you left off'}`,
        cta: 'Resume assignment',
        to: `/student/assignments/${inProgressAssignment.assignment_id}`,
      });
    }
    if (logbook?.progress && logbook.progress.approved_count < logbook.progress.required_entries) {
      items.push({
        title: 'Clinical Logbook',
        meta: `${logbook.progress.approved_count}/${logbook.progress.required_entries} approved`,
        cta: 'Update logbook',
        to: '/student/logbook',
      });
    }
    if (simulationResults[0]) {
      items.push({
        title: simulationResults[0].title,
        meta: `Simulation • ${simulationResults[0].category}`,
        cta: 'Continue practice',
        to: '/student/simulations',
      });
    }
    return items.slice(0, 3);
  }, [assignments, logbook, simulationResults]);

  const upcomingTasks = useMemo(() => {
    const assignmentCount = assignments.filter((assignment) => !['submitted', 'graded', 'released'].includes(String(assignment.submission_status || '').toLowerCase())).length;
    const nextAssignment = assignments.find((assignment) => assignment.due_date);
    const logbookPending = logbook?.progress ? Math.max(0, logbook.progress.required_entries - logbook.progress.approved_count) : 0;
    const examPending = Math.max(0, 5 - attempts.filter((attempt) => attempt.status === 'graded' || attempt.status === 'submitted').length);

    return [
      {
        title: 'Assignments',
        count: assignmentCount,
        meta: nextAssignment ? `Next due ${formatDateTime(nextAssignment.due_date)}` : 'No due dates scheduled',
        to: '/student/assignments',
      },
      {
        title: 'Clinical Logbook',
        count: logbookPending,
        meta: logbook?.progress ? `${logbook.progress.approved_count} approved entries` : 'Waiting for logbook data',
        to: '/student/logbook',
      },
      {
        title: 'Exams',
        count: examPending,
        meta: `${attempts.length} recent attempts`,
        to: '/student/assessments',
      },
    ];
  }, [assignments, attempts, logbook]);

  const recentActivity = useMemo(() => {
    const examItems = attempts.slice(0, 3).map((attempt) => ({
      id: `exam-${attempt.attempt_id}`,
      type: 'Exam attempt',
      title: attempt.title,
      status: attempt.status,
      detail: attempt.score_pct != null ? `${attempt.score_pct}%` : 'Pending score',
      at: attempt.submitted_at || attempt.completed_at || attempt.started_at,
      to: '/student/assessments',
    }));

    const simItems = simulationResults.slice(0, 2).map((result, index) => ({
      id: `sim-${result.simulation_attempt_id || index}`,
      type: 'Simulation',
      title: result.title,
      status: 'saved',
      detail: `${result.overall_competency_score}% competency`,
      at: result.completed_at || result.created_at,
      to: '/student/simulations',
    }));

    const submissionItems = assignments
      .filter((assignment) => assignment.submission_status)
      .slice(0, 3)
      .map((assignment) => ({
        id: `assignment-${assignment.assignment_id}`,
        type: 'Submission',
        title: assignment.title,
        status: assignment.submission_status,
        detail: assignment.topic || assignment.module || 'Assignment update',
        at: assignment.updated_at || assignment.submitted_at || assignment.due_date,
        to: `/student/assignments/${assignment.assignment_id}`,
      }));

    return [...examItems, ...simItems, ...submissionItems]
      .sort((a, b) => new Date(b.at || 0).getTime() - new Date(a.at || 0).getTime())
      .slice(0, 8);
  }, [attempts, assignments, simulationResults]);

  if (error) return <div className="alert">{error}</div>;
  if (!progress || !subscription || !logbook) return <Loading label="Loading your dashboard..." />;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{user.name?.split(' ')[0]}'s Dashboard</h1>
          <div className="sub">{user.program || 'EMS student'} • {user.institution || 'MedProHub'}</div>
        </div>
      </div>

      <div className="vitals">
        <Vital label="Subscription status" value={subscription.active ? 'Active' : 'Inactive'} />
        <Vital label="Exam readiness" value={`${readinessScore}%`} />
        <Vital label="Clinical progress" value={`${clinicalProgress}%`} />
        <Vital label="Logbook completion" value={`${logbookPct}%`} />
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="dashboard-section-head">
            <div>
              <h2>Continue Learning</h2>
              <div className="sub">Pick up active work</div>
            </div>
          </div>
          <div className="dashboard-stack">
            {continueItems.map((item) => (
              <Link key={item.to} to={item.to} className="dashboard-list-card">
                <div>
                  <div className="dashboard-list-title">{item.title}</div>
                  <div className="dashboard-list-meta">{item.meta}</div>
                </div>
                <div className="dashboard-list-cta">{item.cta}</div>
              </Link>
            ))}
            {continueItems.length === 0 && <div className="dashboard-empty">No active learning items right now.</div>}
          </div>
        </div>

        <div className="card">
          <div className="dashboard-section-head">
            <div>
              <h2>Upcoming Tasks</h2>
              <div className="sub">What needs attention next</div>
            </div>
          </div>
          <div className="dashboard-mini-grid">
            {upcomingTasks.map((task) => (
              <Link key={task.title} to={task.to} className="dashboard-metric-card">
                <div className="dashboard-metric-count">{task.count}</div>
                <div className="dashboard-metric-title">{task.title}</div>
                <div className="dashboard-metric-meta">{task.meta}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="dashboard-section-head">
          <div>
            <h2>Recent Activity</h2>
            <div className="sub">Latest attempts, simulation saves, and submissions</div>
          </div>
        </div>
        <div className="dashboard-stack">
          {recentActivity.map((activity) => (
            <Link key={activity.id} to={activity.to} className="dashboard-list-card">
              <div>
                <div className="dashboard-list-title">{activity.title}</div>
                <div className="dashboard-list-meta">{activity.type} • {activity.detail}</div>
              </div>
              <div className="dashboard-activity-side">
                <span className={`badge ${activity.status}`}>{String(activity.status).replace(/_/g, ' ')}</span>
                <span className="dashboard-time">{activity.at ? new Date(activity.at).toLocaleDateString('en-KE') : 'Recent'}</span>
              </div>
            </Link>
          ))}
          {recentActivity.length === 0 && <div className="dashboard-empty">No recent activity yet.</div>}
        </div>
      </div>
    </>
  );
}
