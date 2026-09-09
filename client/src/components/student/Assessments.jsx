import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../services/api';
import Loading from '../shared/Loading';
import UiIcon from '../shared/UiIcon';
import heroImage from '../../assets/hero-paramedics.png';
import './questionBank.css';

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

// V2 is the active experience by default; set VITE_QUESTION_BANK_V2_ENABLED=false to roll back.
const questionBankV2Enabled = import.meta.env.VITE_QUESTION_BANK_V2_ENABLED !== 'false';
// Active by default; set VITE_QUESTION_BANK_SAAS_ENABLED=false to roll back.
const questionBankSaaSEnabled = import.meta.env.VITE_QUESTION_BANK_SAAS_ENABLED !== 'false';

function masteryForModule(module) {
  const value = Number(module.best_percentage ?? module.score ?? 0);
  return Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
}

function masteryBand(value) {
  if (value < 60) return { key: 'critical', label: 'CRITICAL', action: 'Practice Now' };
  if (value < 80) return { key: 'review', label: 'NEEDS REVIEW', action: 'Improve Score' };
  return { key: 'mastered', label: 'MASTERED', action: 'Practice Again' };
}

function ThreeModeQuestionBank({ modules, baseRoute, subscription }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState('practice');
  const [progress, setProgress] = useState({});
  const [mockExams, setMockExams] = useState([]);
  const [browse, setBrowse] = useState({ questions: [], pagination: { page: 1, limit: 20, total: 0 } });
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [answerIds, setAnswerIds] = useState(new Set());
  const [loadingBrowse, setLoadingBrowse] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.allSettled([api('/progress'), api('/mock-exams')])
      .then(([progressResult, examResult]) => {
        const progressData = progressResult.status === 'fulfilled' ? progressResult.value : {};
        const examData = examResult.status === 'fulfilled' ? examResult.value : {};
        setProgress(progressData.progress || {});
        setMockExams(examData.mockExams || []);
        if (progressResult.status === 'rejected' && examResult.status === 'rejected') {
          setError('Question Bank data is temporarily unavailable. Please try again.');
        }
      });
  }, []);

  useEffect(() => {
    if (mode !== 'browse') return undefined;
    setLoadingBrowse(true);
    const params = new URLSearchParams({ page: String(browse.pagination.page || 1), limit: '20' });
    if (topic) params.set('topic', topic);
    if (difficulty) params.set('difficulty', difficulty);
    api(`/questions?${params.toString()}`)
      .then(setBrowse)
      .catch((err) => setError(err.message))
      .finally(() => setLoadingBrowse(false));
    return undefined;
  }, [mode, topic, difficulty, browse.pagination.page]);

  function changeBrowseFilter(setter, value) {
    setter(value);
    setBrowse((current) => ({ ...current, pagination: { ...current.pagination, page: 1 } }));
  }

  async function revealAnswer(question) {
    if (answerIds.has(question.id)) return;
    try {
      const data = await api(`/questions?includeAnswer=true&limit=1&questionId=${encodeURIComponent(question.id)}`);
      const revealed = data.questions?.find((item) => item.id === question.id);
      if (revealed) setBrowse((current) => ({ ...current, questions: current.questions.map((item) => item.id === question.id ? revealed : item) }));
      setAnswerIds((current) => new Set([...current, question.id]));
    } catch (err) { setError(err.message); }
  }

  async function toggleBookmark(question) {
    try {
      const bookmarked = !question.bookmarked;
      await api('/questions/bookmark', { method: 'POST', body: { questionId: question.id, bookmarked } });
      setBrowse((current) => ({ ...current, questions: current.questions.map((item) => item.id === question.id ? { ...item, bookmarked } : item) }));
    } catch (err) { setError(err.message); }
  }

  const totalQuestions = Number(progress.total_questions || modules.reduce((sum, item) => sum + Number(item.total_questions || 0), 0));
  const totalAnswered = Number(progress.answered || 0);
  const accuracy = Number(progress.accuracy || 0);
  const topics = [...new Set(modules.flatMap((item) => item.topics || []))].sort();

  return (
    <div className="mcq-page question-bank-saas">
      <div className="question-bank-v2-breadcrumbs">Home <span>/</span> My Content <span>/</span> <strong>Question Bank</strong></div>
      <header className="question-bank-saas-header" style={{ '--question-bank-hero-image': `url(${heroImage})` }}><div><div className="mcq-progress-kicker">EMT revision workspace</div><h1>Question Bank</h1><p>Practice by topic, sit a timed mock, or browse the full bank.</p></div><div className="question-bank-saas-countdown"><span>Exam countdown</span><strong>Plan your next session</strong></div></header>
      {subscription && !subscription.allowed && <div className="alert info">Your subscription is {subscription.status}. Renew your plan to continue.</div>}
      {error && <div className="alert">{error}</div>}
      <div className="question-bank-saas-stats"><div><span>Total questions</span><strong>{totalQuestions}</strong></div><div><span>Done</span><strong>{totalAnswered}</strong></div><div><span>Accuracy</span><strong>{accuracy}%</strong></div><div><span>Today</span><strong>15 min</strong></div></div>
      <nav className="question-bank-saas-tabs" aria-label="Question Bank modes">{[['practice', 'Practice'], ['mock', 'Mock Exams'], ['browse', 'Browse']].map(([key, label]) => <button type="button" key={key} className={mode === key ? 'is-active' : ''} aria-pressed={mode === key} onClick={() => setMode(key)}>{label}</button>)}</nav>

      {mode === 'practice' && <><aside className="question-bank-saas-filter"><div className="question-bank-saas-filter-title"><UiIcon name="filter" /> <strong>Filter Questions</strong></div><fieldset><legend>Certification Level</legend><label><input type="checkbox" defaultChecked /> EMT</label><label><input type="checkbox" defaultChecked /> Paramedic</label></fieldset><label className="question-bank-saas-select-label">Subject Area<select defaultValue=""><option value="">All subjects</option></select></label><fieldset><legend>Question Type</legend><label><input type="checkbox" defaultChecked /> Multiple Choice</label><label><input type="checkbox" /> True / False</label><label><input type="checkbox" /> Scenario-based</label><label><input type="checkbox" /> Image-based</label></fieldset><fieldset><legend>Difficulty Level</legend><label><input type="checkbox" /> Easy</label><label><input type="checkbox" defaultChecked /> Medium</label><label><input type="checkbox" defaultChecked /> Hard</label></fieldset><button type="button" className="question-bank-saas-apply"><UiIcon name="filter" /> Apply filters</button><button type="button" className="question-bank-saas-reset">Reset</button></aside><section className="question-bank-saas-panel"><div className="question-bank-saas-panel-head"><div><span className="mcq-progress-kicker">Focused revision</span><h2><UiIcon name="exam" /> Question Bank</h2></div><span>{totalQuestions.toLocaleString()} questions available</span></div><div className="question-bank-saas-topic-pills"><button type="button" className="is-active">All topics</button>{['Airway & Breathing', 'Cardiology', 'Trauma', 'Medical', 'Pediatrics', 'OB/GYN', 'Pharmacology', 'Operations'].map((item) => <button type="button" key={item}>{item}</button>)}</div><div className="question-bank-saas-topic-grid">{modules.map((module) => { const mastery = masteryForModule(module); const band = masteryBand(mastery); const icon = String(module.title || '').toLowerCase().includes('airway') ? 'activity' : String(module.title || '').toLowerCase().includes('cardio') ? 'progress' : String(module.title || '').toLowerCase().includes('trauma') ? 'shield' : String(module.title || '').toLowerCase().includes('pediatric') ? 'community' : String(module.title || '').toLowerCase().includes('operation') ? 'settings' : 'learn'; return <article className="question-bank-saas-topic" key={module.id}><div className="question-bank-saas-topic-main"><span className="question-bank-saas-topic-icon" aria-hidden="true"><UiIcon name={icon} /></span><div><span className="question-bank-saas-topic-number">{String(module.order_number).padStart(2, '0')}</span><h3>{MODULE_LABELS[module.order_number] || module.title}</h3><p>{module.total_questions} questions · EMT &amp; Paramedic</p><small>{String(module.title || '').toLowerCase().includes('airway') ? 'Airway management, ventilation, oxygen therapy, respiratory disorders.' : 'Assessment, treatment decisions, clinical reasoning and exam preparation.'}</small></div></div><div className="question-bank-saas-topic-score"><strong>{mastery}%</strong><span>Mastery</span></div><div className="question-bank-saas-progress"><span style={{ width: `${mastery}%` }} /></div><div className="question-bank-saas-topic-foot"><span className={`question-bank-saas-status ${band.key}`}>{module.attempt_count ? band.label : 'START'}</span><button type="button" onClick={() => navigate(`${baseRoute}/${module.id}?mode=practice`)}>Start practice <UiIcon name="arrowRight" /></button></div></article>; })}</div></section></>}

      {mode === 'mock' && <section className="question-bank-saas-panel"><div className="question-bank-saas-panel-head"><div><span className="mcq-progress-kicker">Timed practice</span><h2>Mock Exams</h2></div><span>50 questions · 60 minutes</span></div><div className="question-bank-saas-exam-list">{mockExams.map((exam) => <article key={exam.id}><div><span className="question-bank-saas-topic-number">Mock {exam.exam_number}</span><h3>{exam.title || `EMT Mock Exam ${exam.exam_number}`}</h3><p>Mixed-topic timed practice · {exam.question_count} questions</p></div><div><strong>{exam.best_score || 0}%</strong><small>Best score</small></div><button type="button" onClick={() => navigate('/student/mcq/mock-pretest')}>Start exam</button></article>)}</div></section>}

      {mode === 'browse' && <section className="question-bank-saas-panel"><div className="question-bank-saas-panel-head"><div><span className="mcq-progress-kicker">Reference view</span><h2>Browse questions</h2></div><span>{browse.pagination.total || 0} questions</span></div><div className="question-bank-saas-filters"><label>Topic<select value={topic} onChange={(event) => changeBrowseFilter(setTopic, event.target.value)}><option value="">All topics</option>{topics.map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label>Difficulty<select value={difficulty} onChange={(event) => changeBrowseFilter(setDifficulty, event.target.value)}><option value="">All levels</option><option value="basic">Basic</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></label></div>{loadingBrowse ? <Loading label="Loading questions..." /> : <div className="question-bank-saas-browse-list">{browse.questions.map((question, index) => <article key={question.id}><div className="question-bank-saas-browse-top"><span>Question {((browse.pagination.page - 1) * 20) + index + 1}</span><span>{question.topic}</span></div><h3>{question.question_text}</h3><ol>{['option_a', 'option_b', 'option_c', 'option_d'].map((key) => question[key] && <li key={key}>{question[key]}</li>)}</ol><div className="question-bank-saas-browse-actions"><button type="button" onClick={() => revealAnswer(question)}>{answerIds.has(question.id) ? `Answer: ${question.correct_option}` : 'Show answer'}</button><button type="button" className={question.bookmarked ? 'is-saved' : ''} onClick={() => toggleBookmark(question)}>{question.bookmarked ? 'Bookmarked' : 'Bookmark'}</button></div>{answerIds.has(question.id) && <div className="question-bank-saas-answer"><strong>Explanation</strong><p>{question.explanation || 'Review the topic notes for this question.'}</p></div>}</article>)}</div>}{browse.pagination.total > 20 && <div className="question-bank-saas-pagination"><button type="button" disabled={browse.pagination.page <= 1} onClick={() => setBrowse((current) => ({ ...current, pagination: { ...current.pagination, page: current.pagination.page - 1 } }))}>Previous</button><span>Page {browse.pagination.page} of {Math.ceil(browse.pagination.total / 20)}</span><button type="button" disabled={browse.pagination.page >= Math.ceil(browse.pagination.total / 20)} onClick={() => setBrowse((current) => ({ ...current, pagination: { ...current.pagination, page: current.pagination.page + 1 } }))}>Next</button></div>}</section>}
    </div>
  );
}

function LearningQuestionBank({ modules, baseRoute, subscription }) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const enriched = modules.map((module) => ({ ...module, mastery: masteryForModule(module) }));
  const filtered = enriched.filter((module) => {
    const title = (MODULE_LABELS[module.order_number] || module.title || '').toLowerCase();
    const matchesSearch = !search.trim() || title.includes(search.trim().toLowerCase());
    const matchesFilter = filter === 'all' || filter === String(module.id)
      || (filter === 'critical' && module.mastery < 60)
      || (filter === 'mastered' && module.mastery > 80)
      || (filter === 'progress' && module.mastery >= 60 && module.mastery <= 79);
    return matchesSearch && matchesFilter;
  });
  const totalQuestions = enriched.reduce((sum, module) => sum + Number(module.total_questions || 0), 0);
  const totalAnswered = enriched.reduce((sum, module) => sum + (module.attempt_count ? Number(module.total_questions || 0) : 0), 0);
  const overallAccuracy = enriched.length ? Math.round(enriched.reduce((sum, module) => sum + module.mastery, 0) / enriched.length) : 0;

  return (
    <div className="mcq-page question-bank-v2">
      <div className="question-bank-v2-breadcrumbs">Home <span>/</span> My Content <span>/</span> <strong>Question Bank</strong></div>
      <header className="question-bank-v2-header">
        <div><div className="mcq-progress-kicker">{enriched.length} topic paths</div><h1>Question Bank</h1><p>Choose a topic to start focused practice.</p></div>
        <label className="question-bank-v2-search"><span className="sr-only">Search topics</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search topics" /><UiIcon name="search" /></label>
      </header>
      {subscription && !subscription.allowed && <div className="alert info">Your subscription is {subscription.status}. Renew your plan to continue.</div>}
      <div className="question-bank-v2-summary"><span><strong>{totalQuestions}</strong> questions</span><span><strong>{totalAnswered}</strong> answered</span><span><strong>{overallAccuracy}%</strong> average accuracy</span></div>
      <div className="question-bank-v2-content">
        <main className="question-bank-v2-results"><div className="question-bank-v2-results-head"><h2>Topic paths</h2><div className="question-bank-v2-filters" role="group" aria-label="Filter topics">{[['all', 'All'], ['critical', 'Critical'], ['mastered', 'Mastered'], ['progress', 'Progress']].map(([value, label]) => <button type="button" key={value} className={filter === value ? 'is-active' : ''} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>)}</div></div><div className="question-bank-v2-list">{filtered.map((module) => { const band = masteryBand(module.mastery); return <article key={module.id} className={`question-bank-v2-module ${band.key}`}>
          <div className="question-bank-v2-module-title"><span>Module {module.order_number}</span><h3>{MODULE_LABELS[module.order_number] || module.title}</h3><small>{module.total_questions} questions · {module.attempt_count || 0} attempts</small></div>
          <div className="question-bank-v2-module-score"><strong>{module.mastery}%</strong><span>{module.attempt_count ? band.label : 'START'}</span></div>
          <div className="question-bank-v2-bar" role="progressbar" aria-label={`${module.mastery}% mastery`} aria-valuenow={module.mastery} aria-valuemin="0" aria-valuemax="100"><span style={{ width: `${module.mastery}%` }} /></div>
          <div className="question-bank-v2-module-actions"><button type="button" onClick={() => navigate(`${baseRoute}/${module.id}`)}>{module.attempt_count ? band.action : 'Start Module'}</button>{module.attempt_count > 0 && <button type="button" className="is-secondary" onClick={() => navigate(`${baseRoute}/${module.id}`)}>Review summary</button>}</div>
        </article>; })}</div>{filtered.length === 0 && <div className="question-bank-empty">No topics match your search.</div>}</main>
      </div>
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

  if (questionBankSaaSEnabled && location.pathname === '/student/question-bank') {
    return <ThreeModeQuestionBank modules={modules} baseRoute={baseRoute} subscription={subscription} />;
  }
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
  const practiceMode = new URLSearchParams(location.search).get('mode') === 'practice';

  useEffect(() => {
    setBusy(true);
    api(`/assessments/modules/${id}/questions`)
      .then((data) => {
        setModule(data.module);
        setQuestions(practiceMode ? data.questions.slice(0, 15) : data.questions);
      })
      .catch((err) => setError(err.message))
      .finally(() => setBusy(false));
  }, [id, practiceMode]);

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
