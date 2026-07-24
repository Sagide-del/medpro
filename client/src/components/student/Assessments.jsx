import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../services/api';
import Loading from '../shared/Loading';

const VIEW_META = [
  { match: '/student/mcq-questions', title: 'EMT-B Modules', subtitle: 'Database-driven MCQ progression' },
  { match: '/student/mock-prep-tests', title: 'EMT-B Modules', subtitle: 'Database-driven MCQ progression' },
  { match: '/student/question-bank', title: 'EMT-B Modules', subtitle: 'Database-driven MCQ progression' },
  { match: '/student/mock-exams', title: 'EMT-B Modules', subtitle: 'Database-driven MCQ progression' },
  { match: '/student/cats', title: 'EMT-B Modules', subtitle: 'Database-driven MCQ progression' },
  { match: '/student/assessments', title: 'EMT-B Modules', subtitle: 'Database-driven MCQ progression' },
];

function getMeta(pathname) {
  return VIEW_META.find((item) => pathname.startsWith(item.match)) || VIEW_META[VIEW_META.length - 1];
}

function getBaseRoute(pathname) {
  return getMeta(pathname).match;
}

function badgeForStatus(status) {
  if (status === 'completed') return 'completed';
  if (status === 'available') return 'approved';
  return 'draft';
}

function labelForStatus(status) {
  if (status === 'completed') return 'Completed';
  if (status === 'available') return 'Available';
  return 'Locked';
}

function ModuleList() {
  const location = useLocation();
  const navigate = useNavigate();
  const [modules, setModules] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/assessments/modules')
      .then((data) => {
        setModules(data.modules);
        setSubscription(data.subscription || null);
      })
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="alert">{error}</div>;
  if (!modules) return <Loading label="Loading EMT-B modules..." />;

  const meta = getMeta(location.pathname);
  const baseRoute = getBaseRoute(location.pathname);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{meta.title}</h1>
          <div className="sub">{meta.subtitle}</div>
        </div>
      </div>

      {subscription && !subscription.allowed && (
        <div className="alert info">
          Your subscription is {subscription.status}. Renew your plan to continue with EMT-B module assessments.
        </div>
      )}

      <div className="mcq-module-grid">
        {modules.map((module) => (
          <div key={module.id} className="card mcq-module-card">
            <div className="mcq-module-top">
              <div>
                <div className="mcq-module-order">Module {module.order_number}</div>
                <h2>{module.title}</h2>
              </div>
              <span className={`badge ${badgeForStatus(module.status)}`}>{labelForStatus(module.status)}</span>
            </div>

            <p className="mcq-module-description">{module.description}</p>

            <div className="mcq-module-meta">
              <span>{module.total_questions} Questions</span>
              <span>{module.passing_score}% Required</span>
            </div>

            <div className="progress-bar mcq-module-progress">
              <div style={{ width: `${Math.max(0, Math.min(100, Number(module.score || 0)))}%` }} />
            </div>

            <div className="mcq-module-foot">
              <div className="mcq-module-history">
                <span>Attempts: {module.attempt_count || 0}</span>
                <span>Best: {module.best_percentage != null ? `${module.best_percentage}%` : '--'}</span>
              </div>
              <button
                type="button"
                className={module.status === 'locked' ? 'ghost' : 'primary'}
                disabled={module.status === 'locked'}
                onClick={() => navigate(`${baseRoute}/${module.id}`)}
              >
                {module.status === 'completed' ? 'Review Module' : module.status === 'available' ? 'Start Module' : 'Locked'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function ModuleExam() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [module, setModule] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const baseRoute = getBaseRoute(location.pathname);

  useEffect(() => {
    setBusy(true);
    api(`/assessments/modules/${id}/questions`)
      .then((data) => {
        setModule(data.module);
        setQuestions(data.questions);
      })
      .catch((err) => setError(err.message))
      .finally(() => setBusy(false));
  }, [id]);

  const answeredCount = useMemo(
    () => Object.values(answers).filter(Boolean).length,
    [answers]
  );

  async function submit() {
    setBusy(true);
    setError('');
    try {
      const questionIds = questions.map((question) => question.id);
      const selectedAnswers = questionIds.map((questionId) => answers[questionId] || null);
      const response = await api(`/assessments/modules/${id}/submit`, {
        method: 'POST',
        body: {
          question_ids: questionIds,
          selected_answers: selectedAnswers,
        },
      });
      setResult(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (error) return <div className="alert">{error}</div>;
  if (busy && !module) return <Loading label="Loading module questions..." />;
  if (!module) return <Loading label="Loading module..." />;

  if (result) {
    return (
      <>
        <div className="page-head">
          <div>
            <h1>{module.title}</h1>
            <div className="sub">Attempt review</div>
          </div>
        </div>

        <div className="card mcq-result-card">
          <div className="mcq-result-top">
            <div>
              <div className="mcq-score-label">Score</div>
              <div className="mcq-score-value">{result.attempt.percentage}%</div>
            </div>
            <span className={`badge ${result.attempt.passed ? 'approved' : 'rejected'}`}>
              {result.attempt.passed ? 'Passed' : 'Retry Required'}
            </span>
          </div>

          <div className="mcq-result-stats">
            <span>Correct: {result.attempt.correct_answers}</span>
            <span>Wrong: {result.attempt.wrong_answers}</span>
            <span>Attempt #{result.attempt.attempt_number}</span>
          </div>

          <div className="progress-bar mcq-module-progress">
            <div style={{ width: `${result.attempt.percentage}%` }} />
          </div>

          <div className="mcq-result-actions">
            <button type="button" className="ghost" onClick={() => navigate(baseRoute)}>
              Back to Modules
            </button>
            {result.nextModuleUnlocked && (
              <button type="button" className="primary" onClick={() => navigate(`${baseRoute}/${result.nextModuleUnlocked}`)}>
                Start Next Module
              </button>
            )}
          </div>
        </div>

        <div className="mcq-review-stack">
          {result.review.map((item, index) => (
            <div key={item.questionId} className="card mcq-review-card">
              <div className="mcq-review-head">
                <h2>Question {index + 1}</h2>
                <span className={`badge ${item.isCorrect ? 'approved' : 'rejected'}`}>
                  {item.isCorrect ? 'Correct' : 'Incorrect'}
                </span>
              </div>
              <p className="mcq-review-question">{item.questionText}</p>
              <div className="mcq-review-row"><strong>Topic:</strong> {item.topic}</div>
              <div className="mcq-review-row"><strong>Your answer:</strong> {item.selectedAnswerText || 'No answer selected'}</div>
              <div className="mcq-review-row"><strong>Correct answer:</strong> {item.correctAnswerText}</div>
              <div className="mcq-review-row"><strong>Explanation:</strong> {item.explanation}</div>
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{module.title}</h1>
          <div className="sub">{module.total_questions} questions • {module.passing_score}% required</div>
        </div>
      </div>

      <div className="card mcq-session-card">
        <div className="mcq-session-top">
          <div>
            <div className="mcq-module-order">Module {module.order_number}</div>
            <p className="mcq-module-description">{module.description}</p>
          </div>
          <div className="mcq-session-meta">
            <span>{answeredCount}/{questions.length} answered</span>
            <span className={`badge ${badgeForStatus(module.status)}`}>{labelForStatus(module.status)}</span>
          </div>
        </div>
      </div>

      <div className="mcq-review-stack">
        {questions.map((question, index) => (
          <div key={question.id} className="card mcq-question-card">
            <div className="mcq-review-head">
              <h2>Question {index + 1}</h2>
              <span className="badge draft">{question.topic}</span>
            </div>
            <p className="mcq-review-question">{question.question_text}</p>
            <div className="mcq-option-list">
              {question.options.map((option) => (
                <label key={`${question.id}-${option.key}`} className={`mcq-option ${answers[question.id] === option.key ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name={question.id}
                    value={option.key}
                    checked={answers[question.id] === option.key}
                    onChange={() => setAnswers((current) => ({ ...current, [question.id]: option.key }))}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mcq-submit-bar">
        <Link to={baseRoute} className="mcq-back-link">Back to modules</Link>
        <button type="button" className="primary" onClick={submit} disabled={busy}>
          {busy ? 'Submitting...' : 'Submit'}
        </button>
      </div>
    </>
  );
}

export default function Assessments() {
  const { id } = useParams();
  return id ? <ModuleExam /> : <ModuleList />;
}
