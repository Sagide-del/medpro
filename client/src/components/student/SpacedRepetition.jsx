import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import Loading from '../shared/Loading';
import UiIcon from '../shared/UiIcon';

const TOPICS = ['Tropical diseases', 'Trauma patterns', 'Snakebites', 'Airway management'];

export default function SpacedRepetition() {
  const [started, setStarted] = useState(false);
  const [questions, setQuestions] = useState(null);
  const [error, setError] = useState('');

  async function startReview() {
    setStarted(true); setError('');
    try { const data = await api('/questions?limit=5'); setQuestions(data.questions || []); } catch (err) { setError(err.message); }
  }

  return (
    <div className="new-page">
      <header className="new-page-header">
        <div><div className="new-eyebrow">Retention practice</div><h1>Spaced Repetition</h1><p className="new-muted">Short review sessions for difficult topics.</p></div>
        <button type="button" className="new-button" onClick={startReview} disabled={started}>{started ? 'Review in progress' : 'Start review'}</button>
      </header>
      <section className="new-review-hero">
        <div><span className="new-eyebrow">Due today</span><strong>5 questions</strong><p>Kenya-specific topics are prioritised for frequent recall.</p></div>
        <div className="new-review-ring" aria-label="0 percent reviewed"><span>0%</span><small>reviewed</small></div>
      </section>
      <section className="new-section"><div className="new-section-heading"><h2>Priority topics</h2><span className="new-date-label">Higher frequency</span></div><div className="new-topic-list">{TOPICS.map((topic) => <div className="new-topic-row" key={topic}><UiIcon name="question" /><span>{topic}</span><span className="new-topic-count">0 due</span></div>)}</div></section>
      {error && <div className="alert">{error}</div>}
      {started && !questions && !error && <Loading label="Preparing your review..." />}
      {questions?.length > 0 && <section className="new-section new-review-questions"><div className="new-section-heading"><h2>Today&apos;s review</h2><span className="new-date-label">5 questions</span></div>{questions.map((question, index) => <article className="new-review-question" key={question.id}><span>Q{index + 1}</span><p>{question.question_text}</p><Link className="new-button new-button-link" to="/student/question-bank">Practice</Link></article>)}</section>}
    </div>
  );
}
