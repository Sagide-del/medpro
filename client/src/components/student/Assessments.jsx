import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../services/api';
import Loading from '../shared/Loading';
import UiIcon from '../shared/UiIcon';

const VIEW_META = [
  { match: '/student/mcq-questions', title: 'EMT-B Modules', subtitle: 'Topic-based MCQ practice' },
  { match: '/student/mock-prep-tests', title: 'EMT-B Modules', subtitle: 'Timed topic-based mock tests' },
  { match: '/student/question-bank', title: 'EMT-B Modules', subtitle: 'Topic-based MCQ practice' },
  { match: '/student/mock-exams', title: 'EMT-B Modules', subtitle: 'Timed topic-based mock tests' },
  { match: '/student/cats', title: 'EMT-B Modules', subtitle: 'Timed topic-based mock tests' },
  { match: '/student/assessments', title: 'EMT-B Modules', subtitle: 'Topic-based MCQ practice' },
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

const MODULE_LABELS = {
  4: 'MEDICAL, BEHAVIORAL & OB/GYN',
  5: 'TRAUMA',
};

const LOCK_INSTRUCTIONS = {
  2: 'Locked - Complete Module 1 to unlock',
  3: 'Locked - Complete Module 2 to unlock',
  4: 'Locked - Complete Module 3 to unlock',
  5: 'Locked - Complete Module 4 to unlock',
};

const questionBankV2Enabled = import.meta.env.VITE_QUESTION_BANK_V2_ENABLED === 'true';

function masteryForModule(module) {
  const value = Number(module.best_percentage ?? module.score ?? 0);
  return Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
}

function masteryBand(value) {
  if (value < 60) return { key: 'critical', label: 'Critical weakness', action: 'Practice Now' };
  if (value < 80) return { key: 'review', label: 'Needs review', action: 'Improve Score' };
  return { key: 'mastered', label: 'Mastered', action: 'Practice Again' };
}

function LearningQuestionBank({ modules, baseRoute, subscription }) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const enriched = modules.map((module) => ({ ...module, mastery: masteryForModule(module) }));
  const critical = enriched.filter((module) => module.mastery < 60);
  const filtered = enriched.filter((module) => {
    if (filter === 'critical') return module.mastery < 60;
    if (filter === 'mastered') return module.mastery >= 70;
    if (filter === 'progress') return module.mastery >= 60 && module.mastery < 70;
    return true;
  });
  const totalQuestions = enriched.reduce((sum, module) => sum + Number(module.total_questions || 0), 0);
  const totalAnswered = enriched.reduce((sum, module) => sum + (Number(module.attempt_count || 0) * Number(module.total_questions || 0)), 0);
  const overallAccuracy = enriched.length ? Math.round(enriched.reduce((sum, module) => sum + module.mastery, 0) / enriched.length) : 0;
  const plan = [...enriched].sort((a, b) => a.mastery - b.mastery).slice(0, 3);

  return (
    <div className="mcq-page question-bank-v2">
      <header className="question-bank-v2-header">
        <div>
          <div className="mcq-progress-kicker">Revision workspace</div>
          <h1>Question Bank</h1>
          <p>Practice by topic, strengthen weak areas, and build exam readiness.</p>
        </div>
        <div className="question-bank-v2-countdown"><strong>Exam countdown</strong><span>Exam date not set</span><small>Today&apos;s goal: 30 questions · 45 minutes</small></div>
      </header>

      {subscription && !subscription.allowed && <div className="alert info">Your subscription is {subscription.status}. Renew your plan to continue.</div>}

      <section className="question-bank-v2-stats" aria-label="Question bank statistics">
        <div><span>Total questions</span><strong>{totalQuestions}</strong></div>
        <div><span>Questions answered</span><strong>{totalAnswered}</strong></div>
        <div><span>Overall accuracy</span><strong>{overallAccuracy}%</strong></div>
        <div><span>Study streak</span><strong>0 days</strong></div>
        <div><span>Best study day</span><strong>--</strong></div>
      </section>

      {critical.length > 0 && <section className="question-bank-v2-weaknesses" aria-labelledby="critical-weaknesses-title">
        <div className="question-bank-v2-section-heading"><div><div className="mcq-progress-kicker">Priority review</div><h2 id="critical-weaknesses-title">Critical weaknesses</h2></div><span>{critical.length} topic{critical.length === 1 ? '' : 's'}</span></div>
        <div className="question-bank-v2-weakness-list">{critical.map((module) => <button type="button" key={module.id} onClick={() => navigate(`${baseRoute}/${module.id}`)}><span>{MODULE_LABELS[module.order_number] || module.title}</span><strong>{module.mastery}% <small>of 70% target</small></strong><em>Needs urgent practice</em></button>)}</div>
      </section>}

      <section className="question-bank-v2-plan" aria-labelledby="today-plan-title">
        <div className="question-bank-v2-section-heading"><div><div className="mcq-progress-kicker">Personalized review</div><h2 id="today-plan-title">Today&apos;s question plan</h2></div><span>3 sessions · 15 min each</span></div>
        <div className="question-bank-v2-plan-grid">{plan.map((module) => <div key={module.id} className="question-bank-v2-plan-item"><div><strong>{MODULE_LABELS[module.order_number] || module.title}</strong><span>{module.mastery}% mastery <b>→ 70% target</b></span></div><button type="button" onClick={() => navigate(`${baseRoute}/${module.id}`)}>Start Practice</button></div>)}</div>
      </section>

      <section className="question-bank-v2-modules" aria-labelledby="mastery-overview-title">
        <div className="question-bank-v2-section-heading"><div><div className="mcq-progress-kicker">Topic practice</div><h2 id="mastery-overview-title">Mastery overview</h2></div><span>{enriched.length} modules</span></div>
        <div className="question-bank-v2-filters" role="group" aria-label="Filter modules">{[['all', 'All Modules'], ['critical', 'Critical'], ['mastered', 'Mastered'], ['progress', 'In Progress']].map(([value, label]) => <button type="button" key={value} className={filter === value ? 'is-active' : ''} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>)}</div>
        <div className="question-bank-v2-list">{filtered.map((module) => { const band = masteryBand(module.mastery); return <article key={module.id} className={`question-bank-v2-module ${band.key}`}>
          <div className="question-bank-v2-module-title"><span>Module {module.order_number}</span><h3>{MODULE_LABELS[module.order_number] || module.title}</h3></div>
          <div className="question-bank-v2-module-score"><strong>{module.mastery}%</strong><span>{band.label}</span></div>
          <div className="question-bank-v2-bar" role="progressbar" aria-label={`${module.mastery}% mastery`} aria-valuenow={module.mastery} aria-valuemin="0" aria-valuemax="100"><span style={{ width: `${module.mastery}%` }} /></div>
          <div className="question-bank-v2-module-meta"><span>{module.total_questions} questions</span><span>{module.attempt_count || 0} attempts</span><button type="button" onClick={() => navigate(`${baseRoute}/${module.id}`)}>{band.action}</button></div>
        </article>; })}</div>
        {filtered.length === 0 && <div className="question-bank-empty">No modules match this filter.</div>}
      </section>
    </div>
  );
}

function ModuleList() {
  const location = useLocation();
  const navigate = useNavigate();
  const [modules, setModules] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [essays, setEssays] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/assessments/modules')
      .then((data) => {
        setModules(data.modules);
        setSubscription(data.subscription || null);
      })
      .catch((err) => setError(err.message));
    if (location.pathname.startsWith('/student/question-bank')) {
      api('/assignment-workflow/student/assignments')
        .then((data) => setEssays((data.assignments || []).filter((item) => String(item.assignment_type || '').toLowerCase() === 'essay')))
        .catch(() => {});
    }
  }, [location.pathname]);

  if (error) return <div className="alert">{error}</div>;
  if (!modules) return <Loading label="Loading EMT-B modules..." />;

  const meta = getMeta(location.pathname);
  const baseRoute = getBaseRoute(location.pathname);
  const completedModules = modules.filter((module) => module.status === 'completed').length;
  const availableModules = modules.filter((module) => module.status === 'available').length;
  const overallProgress = modules.length ? Math.round((completedModules / modules.length) * 100) : 0;

  if (questionBankV2Enabled && location.pathname === '/student/question-bank') {
    return <LearningQuestionBank modules={modules} baseRoute={baseRoute} subscription={subscription} />;
  }

  return (
    <div className="mcq-page">
      <div className="page-head">
        <div>
          <h1>{location.pathname.startsWith('/student/mock-prep-tests') ? 'Mock Tests' : 'Question Bank'}</h1>
          <div className="sub">{meta.subtitle}</div>
        </div>
      </div>

      {location.pathname === '/student/question-bank' && (
        <section className="question-bank-section progress-overview-section">
          <div className="question-bank-section-head"><div><div className="mcq-progress-kicker">Progress Overview</div><h2>0 of 9 modules complete</h2></div><span>11%</span></div>
          <div className="mcq-progress-track" aria-label="11% complete"><span style={{ width: '11%' }} /></div>
          <div className="progress-overview-next">Next: Module 1 - Preparatory</div>
        </section>
      )}

      {location.pathname === '/student/question-bank' && (
        <div className="question-bank-hub">
          <section className="question-bank-section">
            <div className="question-bank-section-head"><div><div className="mcq-progress-kicker">Mock Exams</div><h2>Mock Exams</h2></div><span>3 exams</span></div>
            <div className="mock-exam-grid">
              {[1, 2, 3].map((number) => <Link className="mock-exam-entry" to={`/student/mcq/mock-pretest?exam=${number}`} key={number}><span className="mock-exam-number">0{number}</span><span><strong>EMT Mock Exam {number}</strong><small>Mixed-topic timed practice</small></span><UiIcon name="arrowRight" /></Link>)}
            </div>
          </section>
        </div>
      )}

      {location.pathname !== '/student/question-bank' && <div className="mcq-course-progress">
        <div><div className="mcq-progress-kicker">Progress Overview</div><strong>{completedModules} of {modules.length} modules complete</strong></div>
        <div className="mcq-progress-track" aria-label={`${overallProgress}% complete`}><span style={{ width: `${overallProgress}%` }} /></div>
        <div className="mcq-progress-next">{availableModules ? `${availableModules} ready to practice` : 'Keep reviewing your results'}</div>
      </div>}

      {location.pathname.startsWith('/student/mcq-questions') && (
        <button
          type="button"
          className="mpt-entry-card"
          onClick={() => navigate('/student/mcq/mock-pretest')}
        >
          <span className="mpt-entry-icon" aria-hidden="true"><UiIcon name="exam" /></span>
          <span>
            <div className="mpt-entry-title">EMT Mock Tests</div>
            <div className="mpt-entry-sub">Mixed-topic timed practice with review after submission</div>
          </span>
          <span className="mpt-entry-arrow" aria-hidden="true"><UiIcon name="arrowRight" /></span>
        </button>
      )}

      {subscription && !subscription.allowed && (
        <div className="alert info">
          Your subscription is {subscription.status}. Renew your plan to continue with EMT-B module assessments.
        </div>
      )}

      <div className="mcq-topic-heading"><div><div className="mcq-progress-kicker">Learning Paths</div><h2>MCQ Questions</h2></div><span>9 topic paths</span></div>
      <div className="mcq-module-grid">
        {modules.map((module) => (
          <div key={module.id} className="card mcq-module-card">
            <div className="mcq-module-top">
              <div>
                <div className="mcq-module-order">Module {module.order_number}</div>
                <h2 title={module.title}>{MODULE_LABELS[module.order_number] || module.title}</h2>
              </div>
              <span className={`badge ${badgeForStatus(module.status)}`}>{labelForStatus(module.status)}</span>
            </div>

            <div className="mcq-module-meta">
              <span>{module.total_questions} questions</span>
              <span>70% pass mark</span>
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
            {module.status === 'locked' && (
              <div className="mcq-lock-note">
                <UiIcon name="lock" />
                <span>{LOCK_INSTRUCTIONS[module.order_number] || 'Complete the previous module to unlock'}</span>
              </div>
            )}
          </div>
        ))}
      </div>
      {location.pathname === '/student/question-bank' && <section className="question-bank-section written-reasoning-section">
        <div className="question-bank-section-head"><div><div className="mcq-progress-kicker">Written Clinical Reasoning</div><h2>Essays</h2></div><span>{essays.length} assigned</span></div>
        <div className="essay-preview-grid">{essays.slice(0, 3).map((essay) => <Link className="essay-preview-entry" to={`/student/assignments/${essay.assignment_id}`} key={essay.assignment_id}>{essay.image_url ? <img src={essay.image_url} alt="" /> : <span className="essay-preview-art"><UiIcon name="document" /></span>}<span><strong>{essay.title}</strong><small>{essay.topic || 'Critical thinking and decision-making'}</small></span><UiIcon name="arrowRight" /></Link>)}{essays.length === 0 && <div className="question-bank-empty">Published essay prompts will appear here.</div>}</div>
        <div className="essay-example-list">
          <div className="essay-example-entry"><div><strong>Essay 1: Kenya Matatu Accident Case</strong><span>Describe your approach to a multi-casualty incident in Nairobi...</span></div><Link className="new-button new-button-link" to="/student/essays">Start Essay</Link></div>
          <div className="essay-example-entry"><div><strong>Essay 2: Snakebite in Rural Kenya</strong><span>Outline the assessment and treatment for a snakebite patient in Kisumu...</span></div><Link className="new-button new-button-link" to="/student/essays">Start Essay</Link></div>
        </div>
      </section>}
    </div>
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

  const answeredCount = useMemo(() => Object.values(answers).filter(Boolean).length, [answers]);

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
            <div className="sub">{module.total_questions} questions • {module.passing_score}% pass mark</div>
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
