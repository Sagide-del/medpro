import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../../services/api';
import ProgressBar from '../../common/ProgressBar';
import Loading from '../../shared/Loading';
import UiIcon from '../../shared/UiIcon';

function statusLabel(status) {
  const value = String(status || '').toUpperCase();
  if (value === 'COMPLETED') return 'Completed';
  if (value === 'IN_PROGRESS') return 'In progress';
  if (value === 'AVAILABLE') return 'Available';
  return 'Not started';
}

export default function EmsAssignments() {
  const [assignments, setAssignments] = useState(null);
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api('/v1/student/medprohub/ems/assignments')
      .then((data) => setAssignments(Array.isArray(data?.assignments) ? data.assignments : []))
      .catch((error) => setMessage(error.message));
  }, []);

  const filtered = useMemo(() => {
    return (assignments || []).filter((item) => {
      if (filter === 'all') return true;
      if (filter === 'completed') return String(item.status || '').toUpperCase() === 'COMPLETED';
      if (filter === 'active') return ['AVAILABLE', 'IN_PROGRESS'].includes(String(item.status || '').toUpperCase());
      return true;
    });
  }, [assignments, filter]);

  if (assignments === null) return <Loading label="Loading EMS assignments..." />;

  return (
    <section className="page-stack">
      <div className="page-head">
        <div>
          <h1>MedProHub EMS Cases</h1>
          <div className="sub">Assigned cases, progress, and stage-by-stage completion.</div>
        </div>
        <div className="logbook-actions">
          <label className="field" style={{ minWidth: 180 }}>
            <span>Filter</span>
            <select value={filter} onChange={(event) => setFilter(event.target.value)}>
              <option value="all">All cases</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </label>
        </div>
      </div>

      <div className="card">
        <ProgressBar
          label="Assignments"
          status={`${filtered.length} visible`}
          value={filtered.length ? Math.round((filtered.filter((item) => String(item.status || '').toUpperCase() === 'COMPLETED').length / filtered.length) * 100) : 0}
        />
        {message ? <div className="ok-note" style={{ marginTop: 12 }}>{message}</div> : null}
      </div>

      <div className="grid-auto">
        {filtered.map((assignment) => (
          <article key={`${assignment.content_from}-${assignment.id}`} className="card">
            <div className="page-head" style={{ marginBottom: 10 }}>
              <div>
                <h3 style={{ marginTop: 0 }}>{assignment.title}</h3>
                <div className="sub">{assignment.event_type} · {assignment.location}</div>
              </div>
              <span className="chip">{statusLabel(assignment.status)}</span>
            </div>

            <div className="form-grid">
              <div className="field"><span>Level</span><input readOnly value={assignment.level || ''} /></div>
              <div className="field"><span>Difficulty</span><input readOnly value={assignment.difficulty || ''} /></div>
              <div className="field"><span>Current stage</span><input readOnly value={assignment.current_stage || 1} /></div>
              <div className="field"><span>Score</span><input readOnly value={`${Number(assignment.score || 0)}%`} /></div>
            </div>

            <div className="logbook-actions">
              <Link className="primary" to={`/student/medprohub/cases/${assignment.id}`}>
                <UiIcon name="arrowRight" /> {assignment.status === 'COMPLETED' ? 'Review case' : 'Open case'}
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

