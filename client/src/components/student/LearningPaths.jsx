import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Loading from '../shared/Loading';
import UiIcon from '../shared/UiIcon';

function statusLabel(status) {
  if (status === 'completed') return 'Completed';
  if (status === 'available') return 'Available';
  return 'Locked';
}

export default function LearningPaths() {
  const { user } = useAuth();
  const [modules, setModules] = useState(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const program = user?.program || 'EMT';

  useEffect(() => {
    api(`/assessments/modules?program=${encodeURIComponent(program)}`)
      .then((data) => setModules(data.modules || []))
      .catch((err) => setError(err.message));
  }, [program]);

  const completed = useMemo(() => (modules || []).filter((module) => module.status === 'completed').length, [modules]);
  const progress = modules?.length ? Math.round((completed / modules.length) * 100) : 0;
  const visibleModules = modules?.filter((module) => filter === 'all' || module.status === filter) || [];

  if (error) return <div className="alert">{error}</div>;
  if (!modules) return <Loading label={`Loading ${program} learning paths...`} />;

  return (
    <div className="new-page new-learning-page">
      <header className="new-learning-header">
        <div className="new-learning-title"><span className="new-learning-icon"><UiIcon name="result" /></span><div><div className="new-eyebrow">{program} curriculum</div><h1>Learning Paths</h1></div></div>
        <div className="new-learning-progress"><strong>{completed} / {modules.length}</strong><span>paths completed</span></div>
      </header>
      <div className="new-learning-rule" />
      <section className="new-learning-overview"><div><h2>{program} exam preparation</h2><p>Follow each path in order to build a complete revision base.</p></div><div className="new-learning-progress-bar"><span style={{ width: `${progress}%` }} /></div></section>
      <div className="new-learning-tabs" role="tablist" aria-label="Learning path filters">{[['all', 'All paths'], ['available', 'Available'], ['completed', 'Completed']].map(([value, label]) => <button key={value} className={filter === value ? 'is-active' : ''} type="button" onClick={() => setFilter(value)}>{label}</button>)}</div>
      <section className="new-learning-grid" aria-label={`${program} learning paths`}>
        {visibleModules.map((module) => {
          const locked = module.status === 'locked';
          return (
            <article className={`new-learning-card ${locked ? 'is-locked' : ''}`} key={module.id}>
              <div className="new-learning-card-art"><UiIcon name={module.status === 'completed' ? 'result' : 'learn'} /><span>{program}</span></div>
              <div className="new-learning-card-body"><div className="new-learning-card-kicker">Path {module.order_number}</div><h2>{module.title}</h2><div className="new-learning-card-meta"><span>{module.total_questions} questions</span><span>{module.passing_score}% pass mark</span></div><div className="new-learning-card-status"><span className={`new-status-dot ${module.status}`} />{statusLabel(module.status)}</div><Link className={`new-button ${locked ? 'new-button-disabled' : ''}`} to={locked ? '#' : `/student/mcq-questions/${module.id}`} aria-disabled={locked} onClick={(event) => locked && event.preventDefault()}>{locked ? 'Locked' : module.status === 'completed' ? 'Review path' : 'Start path'}</Link></div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
