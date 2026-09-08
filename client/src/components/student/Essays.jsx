import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import Loading from '../shared/Loading';

export default function Essays() {
  const [assignments, setAssignments] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/assignment-workflow/student/assignments')
      .then((data) => setAssignments((data.assignments || []).filter((item) => String(item.assignment_type || '').toLowerCase() === 'essay')))
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="alert">{error}</div>;
  if (!assignments) return <Loading label="Loading essays..." />;

  return (
    <div className="new-page new-essays-page">
      <header className="new-page-header"><div><div className="new-eyebrow">Critical thinking practice</div><h1>Essays</h1><p className="new-muted">Work through clinical decisions in your own words.</p></div></header>
      <section className="new-essays-intro"><div><strong>Clinical reasoning</strong><span>Decision-making · prioritisation · time management</span></div><span className="new-date-label">{assignments.length} assigned</span></section>
      <section className="new-essay-list" aria-label="Essay assignments">
        {assignments.map((assignment) => <Link className="new-essay-row" to={`/student/assignments/${assignment.assignment_id}`} key={assignment.assignment_id}><div><span className="new-eyebrow">{assignment.program} · {assignment.topic}</span><h2>{assignment.title}</h2><span>{assignment.number_of_questions || 1} response{assignment.number_of_questions === 1 ? '' : 's'} · {assignment.time_limit_minutes || 'Untimed'}</span></div><span className="new-essay-action">Open</span></Link>)}
        {assignments.length === 0 && <div className="new-empty-panel"><h2>No essays assigned</h2><p>Published essay prompts will appear here.</p></div>}
      </section>
    </div>
  );
}
