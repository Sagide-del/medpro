import { useEffect, useState } from 'react';
import { api } from '../../../../services/api';
import QuestionRunner from './components/QuestionRunner';
import ResultsReview from './components/ResultsReview';

// Exams -> MCQ -> Mock Pre-Test.
//
// This is a self-contained practice tool that sits alongside the existing,
// database-backed MCQ module system (client/src/components/student/Assessments.jsx,
// server /api/assessments) -- it does not read from or modify that system in
// any way. All content and grading come from the separate /api/mock-pretest
// endpoints (server/src/models/MockPreTest.js), which never send the correct
// answer to the browser until after a test is submitted.
//
// View states, held entirely in local component state (no URL sub-routes
// needed): 'dashboard' -> 'running' -> 'results'.

function DashboardSkeleton() {
  return (
    <div className="mpt-page">
      <div className="mpt-skeleton mpt-skeleton-hero" />
      <div className="mpt-skeleton mpt-skeleton-block" />
    </div>
  );
}

function TopicDashboard({ modules, questionCountOptions, subscription, onStart, starting, startError }) {
  const [selectedModule, setSelectedModule] = useState(null);
  const [selectedCount, setSelectedCount] = useState(questionCountOptions?.[0] || 20);

  const selectedModuleData = modules.find((m) => m.key === selectedModule);
  const canStart = Boolean(selectedModuleData?.enabled) && !starting;

  return (
    <div className="mpt-page">
      <header className="mpt-hero">
        <div className="mpt-hero-icon" aria-hidden="true">🚑</div>
        <div>
          <h1>EMT Mock Pre-Test</h1>
          <p>Practice before your formal exams -- randomized questions, instant scoring, and a full answer review after you submit.</p>
        </div>
      </header>

      {subscription && !subscription.allowed && (
        <div className="mpt-alert-banner" role="status">
          <span aria-hidden="true">⚠️</span> Your subscription is {subscription.status}. Renew to continue with the Mock Pre-Test.
        </div>
      )}

      <div className="card mpt-card mpt-selector-card">
        <div className="mpt-selector-section">
          <div className="mpt-selector-label">Choose Topic</div>
          <div className="mpt-topic-grid">
            {modules.map((module) => (
              <button
                type="button"
                key={module.key}
                className={`mpt-topic-btn${selectedModule === module.key ? ' selected' : ''}${!module.enabled ? ' disabled' : ''}`}
                disabled={!module.enabled}
                onClick={() => setSelectedModule(module.key)}
              >
                <span className="mpt-topic-icon" aria-hidden="true">{module.icon}</span>
                <span className="mpt-topic-label">{module.label}</span>
                <span className="mpt-topic-sub">
                  {module.enabled ? `${module.availableQuestions} questions` : 'Coming soon'}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="mpt-selector-section">
          <div className="mpt-selector-label">Question Count</div>
          <div className="mpt-count-grid">
            {questionCountOptions.map((count) => (
              <button
                type="button"
                key={count}
                className={`mpt-count-btn${selectedCount === count ? ' selected' : ''}`}
                onClick={() => setSelectedCount(count)}
              >
                {count} Questions
              </button>
            ))}
          </div>
        </div>

        {startError && <div className="alert" style={{ marginTop: 8 }}>{startError}</div>}

        <button
          type="button"
          className="mpt-start-btn"
          disabled={!canStart}
          onClick={() => onStart(selectedModule, selectedCount)}
        >
          {starting ? 'Preparing test...' : 'START MOCK TEST'}
        </button>
      </div>
    </div>
  );
}

export default function MockPreTestPage() {
  const [view, setView] = useState('dashboard'); // dashboard | running | results
  const [modules, setModules] = useState(null);
  const [questionCountOptions, setQuestionCountOptions] = useState([20, 50, 100]);
  const [subscription, setSubscription] = useState(null);
  const [error, setError] = useState('');

  const [sessionModule, setSessionModule] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  function loadModules() {
    setError('');
    setModules(null);
    api('/mock-pretest/modules')
      .then((data) => {
        setModules(data.modules || []);
        setQuestionCountOptions(data.questionCountOptions || [20, 50, 100]);
        setSubscription(data.subscription || null);
      })
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    loadModules();
  }, []);

  async function handleStart(moduleKey, questionCount) {
    setStarting(true);
    setStartError('');
    try {
      const session = await api('/mock-pretest/start', {
        method: 'POST',
        body: { module: moduleKey, questionCount },
      });
      setSessionModule(session.module);
      setQuestions(session.questions);
      setCurrentIndex(0);
      setAnswers({});
      setResult(null);
      setView('running');
    } catch (err) {
      setStartError(err.message);
    } finally {
      setStarting(false);
    }
  }

  function handleSelectAnswer(questionId, option) {
    setAnswers((current) => ({ ...current, [questionId]: option }));
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const payload = {
        module: sessionModule,
        answers: questions.map((q) => ({ id: q.id, selectedAnswer: answers[q.id] || null })),
      };
      const response = await api('/mock-pretest/submit', { method: 'POST', body: payload });
      setResult(response);
      setView('results');
    } catch (err) {
      setStartError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleBackToDashboard() {
    setView('dashboard');
    setQuestions([]);
    setAnswers({});
    setResult(null);
    loadModules();
  }

  function handleRetake(moduleKey) {
    const count = questions.length || questionCountOptions[0];
    handleStart(moduleKey, count);
  }

  if (error) return <div className="alert">{error}</div>;

  if (view === 'results' && result) {
    return (
      <ResultsReview
        result={result}
        onRetake={handleRetake}
        onBackToDashboard={handleBackToDashboard}
      />
    );
  }

  if (view === 'running' && questions.length) {
    return (
      <QuestionRunner
        questions={questions}
        currentIndex={currentIndex}
        answers={answers}
        onSelectAnswer={handleSelectAnswer}
        onNext={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
        onPrevious={() => setCurrentIndex((i) => Math.max(0, i - 1))}
        onJumpTo={(index) => setCurrentIndex(index)}
        onSubmit={handleSubmit}
        submitting={submitting}
      />
    );
  }

  if (!modules) return <DashboardSkeleton />;

  return (
    <TopicDashboard
      modules={modules}
      questionCountOptions={questionCountOptions}
      subscription={subscription}
      onStart={handleStart}
      starting={starting}
      startError={startError}
    />
  );
}
