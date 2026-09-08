import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Loading from '../shared/Loading';
import UiIcon from '../shared/UiIcon';

function statusLabel(status) {
  if (status === 'completed') return 'Completed';
  if (status === 'available') return 'Available';
  return 'Locked';
}

const DEFAULT_TOPICS = ['Foundations', 'Assessment', 'Clinical management', 'Complications', 'Practice scenarios'];

function topicSlug(topic) {
  return encodeURIComponent(String(topic).toLowerCase().replace(/[^a-z0-9]+/g, '-'));
}

function moduleTopics(module) {
  if (Array.isArray(module.topics) && module.topics.length) return module.topics;
  return DEFAULT_TOPICS.map((title) => ({ title }));
}

function TopicStudy({ module, program, topic }) {
  const topicTitle = topic?.title || topic;
  const keyConcepts = topic?.key_concepts || topic?.keyConcepts || [];
  const recallPrompts = topic?.recall_prompts || topic?.recallPrompts || [];
  const bloomActivities = topic?.bloom_activities || topic?.bloomActivities || [];
  return (
    <div className="new-page new-topic-study">
      <div className="new-breadcrumb"><Link to="/student/learning-paths"><UiIcon name="result" /> Learning Paths</Link><span>/</span><Link to={`/student/learning-paths/${module.id}`}>{module.title}</Link><span>/</span><strong>{topicTitle}</strong></div>
      <header className="new-topic-header"><div><div className="new-eyebrow">{program} · topic mastery</div><h1>{topicTitle}</h1><p className="new-muted">Study the concept, test your recall, then apply it at the next level.</p></div><Link className="new-button new-button-secondary" to="/student/study-planner"><UiIcon name="calendar" /> Add to planner</Link></header>
      <section className="new-topic-layout">
        <main className="new-topic-content">
          <section className="new-topic-panel"><div className="new-section-heading"><h2>Deep review</h2><span className="new-date-label">Core concepts</span></div><p>{topic?.overview || topic?.description || module.description || 'Review the essential concepts for this topic before moving to recall practice.'}</p>{keyConcepts.length > 0 && <ul>{keyConcepts.map((item) => <li key={item}>{item}</li>)}</ul>}</section>
          <section className="new-topic-panel"><div className="new-section-heading"><h2>Recall practice</h2><span className="new-date-label">Active recall</span></div>{recallPrompts.length > 0 ? <ol>{recallPrompts.map((item) => <li key={item}>{item}</li>)}</ol> : <div className="new-topic-empty">Recall prompts for this topic will appear here once the path content is published.</div>}</section>
          <section className="new-topic-panel"><div className="new-section-heading"><h2>Bloom&apos;s application</h2><span className="new-date-label">Higher-order thinking</span></div><div className="new-bloom-levels">{['Remember', 'Understand', 'Apply', 'Analyse', 'Evaluate', 'Create'].map((level) => <span key={level}>{level}</span>)}</div>{bloomActivities.length > 0 && <ul>{bloomActivities.map((item) => <li key={item}>{item}</li>)}</ul>}</section>
        </main>
        <aside className="new-topic-outline"><h2>{module.title}</h2><div className="new-eyebrow">Topic outline</div>{moduleTopics(module).map((item) => { const title = item.title || item.name || item; return <Link className={title === topicTitle ? 'is-active' : ''} to={`/student/learning-paths/${module.id}/topic/${topicSlug(title)}`} key={title}><span>{title}</span><UiIcon name="arrowRight" /></Link>; })}</aside>
      </section>
    </div>
  );
}

function PathDetail({ module, program }) {
  const topics = moduleTopics(module);
  return (
    <div className="new-page new-path-detail">
      <div className="new-breadcrumb"><Link to="/student/learning-paths"><UiIcon name="result" /> Learning Paths</Link><span>/</span><strong>{module.title}</strong></div>
      <section className="new-path-hero"><div><div className="new-eyebrow">{program} curriculum</div><h1>{module.title}</h1><h3>Choose a topic to begin your review</h3><div className="new-path-hero-actions"><Link className="new-button" to={`/student/learning-paths/${module.id}/topic/${topicSlug(topics[0].title || topics[0].name || topics[0])}`}>Start</Link><Link className="new-button new-button-secondary" to="/student/study-planner"><UiIcon name="calendar" /> Add to planner</Link></div></div><div className="new-path-hero-icon"><UiIcon name="learn" /><span>{program}</span></div></section>
      <section className="new-topic-library"><div className="new-section-heading"><div><h2>Review {module.title}</h2><p className="new-muted">Select a topic for a structured review, recall practice, and Bloom&apos;s application.</p></div><span className="new-date-label">{topics.length} topics</span></div><div className="new-topic-grid">{topics.map((item, index) => { const title = item.title || item.name || item; return <Link className="new-topic-card" to={`/student/learning-paths/${module.id}/topic/${topicSlug(title)}`} key={title}><span className="new-topic-number">{String(index + 1).padStart(2, '0')}</span><div><h3>{title}</h3><span>{item.estimated_minutes || item.estimatedMinutes || 20} min review</span></div><UiIcon name="arrowRight" /></Link>; })}</div></section>
      <Link className="new-path-exam-link" to={`/student/mcq-questions/${module.id}`}><UiIcon name="exam" /><h2>Ready to test this path?</h2><span>Open practice questions</span><UiIcon name="arrowRight" /></Link>
    </div>
  );
}

export default function LearningPaths() {
  const { user } = useAuth();
  const { id, topic: topicSlugParam } = useParams();
  const [modules, setModules] = useState(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const program = user?.program || 'EMT';
  useEffect(() => { api(`/assessments/modules?program=${encodeURIComponent(program)}`).then((data) => setModules(data.modules || [])).catch((err) => setError(err.message)); }, [program]);
  const visibleModules = useMemo(() => (modules || []).filter((module) => filter === 'all' || module.status === filter), [modules, filter]);
  if (error) return <div className="alert">{error}</div>;
  if (!modules) return <Loading label={`Loading ${program} learning paths...`} />;
  if (id) { const module = modules.find((entry) => String(entry.id) === String(id)); if (module) { const topic = moduleTopics(module).find((item) => topicSlug(item.title || item.name || item) === topicSlugParam); return topicSlugParam ? <TopicStudy module={module} program={program} topic={topic || decodeURIComponent(topicSlugParam)} /> : <PathDetail module={module} program={program} />; } }
  return (
    <div className="new-page new-learning-page">
      <header className="new-learning-titlebar"><div className="new-learning-title"><span className="new-learning-icon"><UiIcon name="result" /></span><h1>Learning Paths</h1></div></header>
      <div className="new-learning-rule" />
      <section className="new-library-section"><h2>Available Learning Paths</h2><div className="new-learning-tabs" role="tablist" aria-label="Learning path filters">{[['all', 'All'], ['available', 'Available'], ['completed', 'Completed']].map(([value, label]) => <button key={value} className={filter === value ? 'is-active' : ''} type="button" onClick={() => setFilter(value)}>{label}</button>)}</div><h3>{program} Exam Preparation</h3></section>
      <section className="new-learning-grid" aria-label={`${program} learning paths`}>{visibleModules.map((module) => <Link className="new-learning-card" to={`/student/learning-paths/${module.id}`} key={module.id}><div className="new-learning-card-art"><UiIcon name={module.status === 'completed' ? 'result' : 'learn'} /><span>{program}</span></div><div className="new-learning-card-body"><div className="new-learning-card-kicker">Path {module.order_number} · {statusLabel(module.status)}</div><h2>{module.title}</h2></div></Link>)}</section>
    </div>
  );
}
