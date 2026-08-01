import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import ContentCustomizer from '../common/ContentCustomizer';
import ProgressBar from '../common/ProgressBar';
import UiIcon from '../shared/UiIcon';
import Loading from '../shared/Loading';

const SOURCE_MODES = [
  { id: 'pdf', label: 'PDF Upload', hint: 'Reports, manuals, protocols.', icon: 'document', accent: '#e63935', tint: '#fef2f2' },
  { id: 'article', label: 'Article Paste', hint: 'News, incident writeups, research.', icon: 'activity', accent: '#0f766e', tint: '#ecfeff' },
  { id: 'url', label: 'URL / Link', hint: 'Web pages and official resources.', icon: 'dispatch', accent: '#2563eb', tint: '#eff6ff' },
];

const CONTENT_TYPES = [
  { value: 'case_study', label: 'Case Studies', destination: 'Question Bank', icon: 'cases' },
  { value: 'simulation', label: 'Skill Simulations', destination: 'Simulation Library', icon: 'simulation' },
  { value: 'assignment', label: 'Assignments', destination: 'Assignment Bank', icon: 'document' },
  { value: 'exam', label: 'MCQ / Exams', destination: 'Exam Center', icon: 'question' },
  { value: 'video_script', label: 'Video Scripts', destination: 'Video Script Bank', icon: 'activity' },
];

const AUDIENCES = [
  { value: 'emt-basic', label: 'EMT-Basic' },
  { value: 'emt-intermediate', label: 'EMT-Intermediate' },
  { value: 'emt-paramedic', label: 'EMT-Paramedic' },
  { value: 'fire-fighter', label: 'Fire Fighter' },
  { value: 'all-levels', label: 'All Levels' },
];

const DIFFICULTIES = ['Basic', 'Intermediate', 'Advanced'];

const QUESTION_TYPES = [
  { key: 'multipleChoice', label: 'Multiple Choice', icon: 'question', accent: '#e63935', tint: '#fef2f2' },
  { key: 'trueFalse', label: 'True / False', icon: 'result', accent: '#0f766e', tint: '#ecfdf5' },
  { key: 'numeric', label: 'Numeric', icon: 'activity', accent: '#2563eb', tint: '#eff6ff' },
  { key: 'shortAnswer', label: 'Short Answer', icon: 'document', accent: '#b3790a', tint: '#fdf2dc' },
];

const BROWSER_OPTIONS = [
  { value: 'all', label: 'All Activated Schools' },
  { value: 'selected', label: 'Select Specific Schools' },
];

const OUTPUT_DESTINATIONS = [
  { value: 'question_bank', label: 'Question Bank', icon: 'question', note: 'Teacher library', tint: '#fef2f2' },
  { value: 'independent_student', label: 'Independent Student', icon: 'learn', note: 'Direct learner access', tint: '#ecfeff' },
  { value: 'ems_cases', label: 'EMS Cases', icon: 'cases', note: 'Case study library', tint: '#eff6ff' },
  { value: 'exam_mcq', label: 'Exam Center - MCQ', icon: 'exam', note: 'Formative assessment', tint: '#fdf2dc' },
  { value: 'exam_mock', label: 'Exam Center - Mock', icon: 'result', note: 'Summative assessment', tint: '#ecfdf5' },
  { value: 'simulation', label: 'Simulation', icon: 'simulation', note: 'Interactive practice', tint: '#f5f3ff' },
];

export default function AiGenerator() {
  const [searchParams, setSearchParams] = useSearchParams();
  const pdfInputRef = useRef(null);
  const [cases, setCases] = useState(null);
  const [sourceMode, setSourceMode] = useState('article');
  const [sourceFile, setSourceFile] = useState(null);
  const [sourceFileMeta, setSourceFileMeta] = useState(null);
  const [sourceText, setSourceText] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [sourceTitle, setSourceTitle] = useState('');
  const [sourceOrigin, setSourceOrigin] = useState('');
  const [sourceDate, setSourceDate] = useState('');
  const [title, setTitle] = useState('MedPro AI Draft');
  const [contentType, setContentType] = useState('case_study');
  const [audience, setAudience] = useState('emt-basic');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [questionCount, setQuestionCount] = useState(20);
  const [bloomPriority, setBloomPriority] = useState(true);
  const [includeAnswerKey, setIncludeAnswerKey] = useState(true);
  const [includeFeedback, setIncludeFeedback] = useState(true);
  const [suggestDiagramPlaceholders, setSuggestDiagramPlaceholders] = useState(false);
  const [autoTagByTopic, setAutoTagByTopic] = useState(true);
  const [publishDestination, setPublishDestination] = useState('question_bank');
  const [schoolAccess, setSchoolAccess] = useState('all');
  const [selectedSchoolIds, setSelectedSchoolIds] = useState('');
  const [questionTypes, setQuestionTypes] = useState({
    multipleChoice: true,
    trueFalse: true,
    numeric: false,
    shortAnswer: true,
  });
  const [job, setJob] = useState(null);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [generationStartedAt, setGenerationStartedAt] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [reviewFilter, setReviewFilter] = useState('all');
  const [reviewQueue, setReviewQueue] = useState([]);
  const [selectedReviewId, setSelectedReviewId] = useState('');
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [publishBusy, setPublishBusy] = useState(false);
  const [publishConfirmation, setPublishConfirmation] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [showQuestionPreview, setShowQuestionPreview] = useState(false);

  const contentId = searchParams.get('contentId') || '';

  useEffect(() => {
    api('/admin/cases')
      .then((data) => setCases(Array.isArray(data?.cases) ? data.cases : []))
      .catch((error) => setStatus(error.message));
  }, []);

  useEffect(() => {
    if (!job?.jobId || job.status === 'completed' || job.status === 'failed') return undefined;
    const timer = setInterval(async () => {
      try {
        const response = await api(`/ai/progress/${job.jobId}`);
        setJob(response.job);
        if (response.job.status === 'completed' || response.job.status === 'failed') {
          clearInterval(timer);
        }
      } catch (error) {
        setStatus(error.message);
        clearInterval(timer);
      }
    }, 700);
    return () => clearInterval(timer);
  }, [job]);

  const selectedCase = useMemo(
    () => (cases || []).find((item) => item.id === contentId) || null,
    [cases, contentId]
  );

  const contentMeta = useMemo(
    () => CONTENT_TYPES.find((item) => item.value === contentType) || CONTENT_TYPES[0],
    [contentType]
  );

  const sourceReady = useMemo(() => {
    if (sourceMode === 'pdf') return !!sourceFile;
    if (sourceMode === 'url') return !!sourceUrl.trim();
    return !!sourceText.trim();
  }, [sourceMode, sourceFile, sourceUrl, sourceText]);

  const enabledQuestionTypes = useMemo(
    () => QUESTION_TYPES.filter((item) => questionTypes[item.key]).map((item) => item.label),
    [questionTypes]
  );

  const previewChecklist = useMemo(() => {
    if (contentType === 'case_study') {
      return [
        'Case title and destination fit EMS content structure',
        'Incident background is readable before publishing',
        'Dispatch information stays in sequence',
        'Response fields and answer key are ready for review',
        'Scoring layout matches the Kenya EMS case workflow',
      ];
    }
    if (contentType === 'simulation') {
      return [
        'Scenario introduction appears before activity steps',
        'Task flow is clear for mobile learners',
        'Marking criteria are attached to the activity block',
        'Simulation preview keeps the clinical sequence intact',
      ];
    }
    if (contentType === 'assignment') {
      return [
        'Instructions are concise and task focused',
        'Questions and answers are grouped clearly',
        'Submission layout matches the assignment bank',
      ];
    }
    if (contentType === 'exam') {
      return [
        'MCQ order respects the selected question mix',
        'Answer keys stay behind the review layer',
        'Exam destination is correctly routed',
      ];
    }
    return [
      'Script structure is readable before publishing',
      'Cue points and learner prompts are clear',
      'Video workflow is ready for student submission',
    ];
  }, [contentType]);

  const activeAudienceLabel = useMemo(
    () => AUDIENCES.find((item) => item.value === audience)?.label || audience,
    [audience]
  );

  const activeQuestionTypes = useMemo(
    () => QUESTION_TYPES.filter((item) => questionTypes[item.key]),
    [questionTypes]
  );

  const sourceWordCount = useMemo(() => {
    const text = sourceText.trim();
    if (!text) return 0;
    return text.split(/\s+/).filter(Boolean).length;
  }, [sourceText]);

  const sourceStructureHint = useMemo(() => {
    const text = sourceText.trim();
    if (!text) return 'Paste text to detect headings, questions, and table structure.';
    const lines = text.split(/\n+/).filter(Boolean).length;
    if (/^\s*\d+[.)]/m.test(text) || /part\s+\d+/i.test(text)) return 'Structured worksheet / multi-phase content detected.';
    if (lines > 20) return 'Long-form article or incident brief detected.';
    return 'Short briefing detected.';
  }, [sourceText]);

  const destinationSummary = useMemo(
    () => OUTPUT_DESTINATIONS.find((item) => item.value === publishDestination) || OUTPUT_DESTINATIONS[0],
    [publishDestination]
  );

  const generatedQuestionBreakdown = useMemo(() => {
    const types = activeQuestionTypes.length ? activeQuestionTypes : QUESTION_TYPES.slice(0, 1);
    const base = Math.floor(questionCount / types.length);
    const remainder = questionCount % types.length;
    return types.map((item, index) => ({
      label: item.label,
      value: base + (index < remainder ? 1 : 0),
      accent: item.accent,
    }));
  }, [activeQuestionTypes, questionCount]);

  const previewQuestions = useMemo(() => {
    const topicLabel = topic || contentMeta.label;
    const basePreview = [
      {
        type: 'multipleChoice',
        prompt: `What should be prioritised first when generating ${topicLabel.toLowerCase()} content?`,
        answer: 'Use the most clinically relevant, destination-specific workflow.',
        feedback: 'Keep the structure aligned to the selected destination and audience.',
      },
      {
        type: 'trueFalse',
        prompt: 'The hidden answer key must remain visible to super admins and teachers only.',
        answer: 'True',
        feedback: 'Students should only see answers after submission.',
      },
      {
        type: 'shortAnswer',
        prompt: 'Briefly explain how this draft should be reviewed before publishing.',
        answer: 'Check structure, destination, difficulty, and answer key placement.',
        feedback: 'Review should match the school and content destination.',
      },
    ];
    return basePreview.slice(0, Math.min(3, activeQuestionTypes.length || 3));
  }, [activeQuestionTypes.length, contentMeta.label, topic]);

  const livePreviewQuestions = useMemo(() => {
    const generated = job?.result?.previewQuestions;
    return Array.isArray(generated) && generated.length ? generated : previewQuestions;
  }, [job?.result?.previewQuestions, previewQuestions]);

  const liveSummary = job?.result?.summary || job?.result?.draft || '';
  const liveAnalysis = job?.result?.analysis || null;
  const liveGeneratedQuestions = useMemo(() => {
    const generated = job?.result?.previewQuestions;
    return Array.isArray(generated) ? generated : [];
  }, [job?.result?.previewQuestions]);

  const reviewTabs = useMemo(() => ([
    { key: 'all', label: 'All' },
    { key: 'needs_review', label: 'Needs Review' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
  ]), []);

  const normalizedReviewQueue = useMemo(() => reviewQueue.map((item) => ({
    ...item,
    status: item.status || 'needs_review',
  })), [reviewQueue]);

  const filteredReviewQueue = useMemo(() => {
    if (reviewFilter === 'all') return normalizedReviewQueue;
    return normalizedReviewQueue.filter((item) => item.status === reviewFilter);
  }, [normalizedReviewQueue, reviewFilter]);

  const selectedReviewItem = useMemo(
    () => normalizedReviewQueue.find((item) => item.id === selectedReviewId) || normalizedReviewQueue[0] || null,
    [normalizedReviewQueue, selectedReviewId]
  );

  const reviewCounts = useMemo(() => normalizedReviewQueue.reduce((acc, item) => {
    acc.total += 1;
    acc[item.status] = (acc[item.status] || 0) + 1;
    if (item.status === 'approved') acc.selected += 1;
    return acc;
  }, { total: 0, needs_review: 0, approved: 0, rejected: 0, selected: 0 }), [normalizedReviewQueue]);

  const canPublish = publishDestination !== 'independent_student' || assignmentTitle.trim();
  const previewReady = job?.status === 'completed' || (!!job?.result?.previewQuestions?.length && job.status !== 'running');
  const wizardSteps = [
    { step: 1, label: 'Source Input' },
    { step: 2, label: 'Generation Settings' },
    { step: 3, label: 'Review & Preview' },
    { step: 4, label: 'Publish & Destination' },
  ];

  useEffect(() => {
    const inProgress = !!job && job.status !== 'completed' && job.status !== 'failed';
    if (!generationStartedAt || !inProgress) {
      setElapsedSeconds(0);
      return undefined;
    }
    const timer = setInterval(() => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - generationStartedAt) / 1000)));
    }, 1000);
    return () => clearInterval(timer);
  }, [job, generationStartedAt]);

  useEffect(() => {
    if (!liveGeneratedQuestions.length) return;
    setReviewQueue((current) => {
      const existingById = new Map(current.map((item) => [item.id, item]));
      return liveGeneratedQuestions.map((question, index) => {
        const id = question.id || `generated-${index + 1}`;
        const currentItem = existingById.get(id);
        return {
          id,
          status: currentItem?.status || 'needs_review',
          question: question.question || question.prompt || `Question ${index + 1}`,
          answer: question.answer || '',
          feedback: question.feedback || '',
          type: question.type || 'short_answer',
          options: Array.isArray(question.options) ? question.options : [],
          bloom_level: question.bloom_level || '',
          difficulty: question.difficulty || difficulty,
        };
      });
    });
    setSelectedReviewId((current) => current || liveGeneratedQuestions[0]?.id || '');
    setReviewFilter('all');
  }, [liveGeneratedQuestions, difficulty]);

  useEffect(() => {
    if (job?.status === 'completed' && currentStep < 3) {
      setCurrentStep(3);
    }
  }, [job?.status, currentStep]);

  function formatBytes(bytes = 0) {
    if (!bytes) return '0 KB';
    const units = ['B', 'KB', 'MB', 'GB'];
    let value = bytes;
    let unit = 0;
    while (value >= 1024 && unit < units.length - 1) {
      value /= 1024;
      unit += 1;
    }
    return `${value >= 10 || unit === 0 ? Math.round(value) : value.toFixed(1)} ${units[unit]}`;
  }

  async function inspectPdf(file) {
    if (!file) return null;
    const arrayBuffer = await file.arrayBuffer();
    const sample = new TextDecoder('latin1').decode(arrayBuffer.slice(0, 2_000_000));
    const pages = sample.match(/\/Type\s*\/Page\b/g)?.length || null;
    return {
      name: file.name,
      size: file.size,
      sizeLabel: formatBytes(file.size),
      pageCount: pages,
    };
  }

  async function handlePdfSelection(file) {
    if (!file) {
      setSourceFile(null);
      setSourceFileMeta(null);
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setStatus('PDF files must be 50MB or smaller.');
      return;
    }
    setStatus('');
    setSourceFile(file);
    try {
      setSourceFileMeta(await inspectPdf(file));
    } catch {
      setSourceFileMeta({ name: file.name, size: file.size, sizeLabel: formatBytes(file.size), pageCount: null });
    }
  }

  async function generateDraft(mode = 'draft') {
    setBusy(true);
    setStatus('');
    setPublishConfirmation('');
    setCurrentStep(2);
    setGenerationStartedAt(Date.now());
    setElapsedSeconds(0);
    try {
      const payload = new FormData();
      payload.set('title', title);
      payload.set('contentType', contentType);
      payload.set('sourceType', sourceMode);
      payload.set('sourceTitle', sourceTitle);
      payload.set('sourceOrigin', sourceOrigin);
      payload.set('sourceDate', sourceDate);
      payload.set('sourceText', sourceText);
      payload.set('sourceUrl', sourceUrl);
      payload.set('audience', audience);
      payload.set('topic', topic);
      payload.set('difficulty', difficulty);
      payload.set('questionCount', String(questionCount));
      payload.set('bloomPriority', String(bloomPriority));
      payload.set('includeAnswerKey', String(includeAnswerKey));
      payload.set('includeFeedback', String(includeFeedback));
      payload.set('suggestDiagramPlaceholders', String(suggestDiagramPlaceholders));
      payload.set('autoTagByTopic', String(autoTagByTopic));
      payload.set('publishDestination', publishDestination);
      payload.set('schoolAccess', schoolAccess);
      payload.set('selectedSchoolIds', selectedSchoolIds);
      payload.set('questionTypes', JSON.stringify(questionTypes));
      payload.set('targetLibrary', contentMeta.destination);
      payload.set('generationMode', mode);
      payload.set('assignmentTitle', assignmentTitle);
      if (sourceFile) payload.append('sourceFile', sourceFile);

      const response = await api('/ai/generate', {
        method: 'POST',
        body: payload,
      });

      setJob(response.job);
      setStatus(`Draft generation started for ${contentMeta.destination}.`);
      if (response.draft?.title) setTitle(response.draft.title);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  }

  function updateReviewStatus(itemId, nextStatus) {
    setReviewQueue((current) => current.map((item) => (
      item.id === itemId ? { ...item, status: nextStatus } : item
    )));
  }

  function handlePublishSelected() {
    if (publishDestination === 'independent_student' && !assignmentTitle.trim()) {
      setStatus('Assignment title is required before publishing to independent students.');
      return;
    }
    if (!reviewQueue.some((item) => item.status === 'approved')) {
      setStatus('Approve at least one question before publishing.');
      return;
    }

    setPublishBusy(true);
    setStatus('');
    setTimeout(() => {
      setPublishBusy(false);
      setCurrentStep(4);
      setPublishConfirmation(
        publishDestination === 'independent_student'
          ? `Published "${assignmentTitle.trim()}" to independent students.`
          : `Published ${reviewCounts.approved} approved question${reviewCounts.approved === 1 ? '' : 's'} to ${destinationSummary.label}.`
      );
    }, 650);
  }

  function cancelGeneration() {
    setBusy(false);
    setJob(null);
    setStatus('');
    setGenerationStartedAt(null);
    setElapsedSeconds(0);
    setReviewQueue([]);
    setSelectedReviewId('');
    setPublishConfirmation('');
    setCurrentStep(1);
    setShowQuestionPreview(false);
  }

  if (!cases) return <Loading label="Loading AI generator..." />;

  return (
    <section className="page-stack">
      <div className="page-head">
        <div>
          <h1>Master AI Generator</h1>
          <div className="sub">Multi-source drafting for EMS cases, simulations, assignments, exams, and video scripts.</div>
        </div>
      </div>

      <div className="wizard-stepper" role="list" aria-label="Generator steps">
        {wizardSteps.map((item) => (
          <button
            key={item.step}
            type="button"
            className={`wizard-step${currentStep === item.step ? ' is-active' : ''}${currentStep > item.step ? ' is-complete' : ''}`}
            onClick={() => setCurrentStep(item.step)}
          >
            <span className="wizard-step-index">{item.step}</span>
            <span className="wizard-step-label">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="grid-auto">
        {currentStep === 1 ? (
          <section className="card">
            <div className="section-head">
              <div>
                <h2>Step 1. Source Input</h2>
              </div>
            </div>

            <div className="source-mode-grid">
              {SOURCE_MODES.map((mode) => {
                const active = sourceMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    className={`card source-mode-card${active ? ' is-active' : ''}`}
                    onClick={() => setSourceMode(mode.id)}
                    style={{
                      '--tab-accent': mode.accent,
                      '--tab-tint': mode.tint,
                    }}
                  >
                    <div className="source-mode-top">
                      <span className="source-mode-icon"><UiIcon name={mode.icon} /></span>
                      <span className="source-mode-badge" style={{ color: mode.accent, background: mode.tint }}>
                        {active ? 'Selected' : 'Source'}
                      </span>
                    </div>
                    <h3 style={{ margin: '10px 0 6px' }}>{mode.label}</h3>
                    <p className="sub" style={{ margin: 0 }}>{mode.hint}</p>
                  </button>
                );
              })}
            </div>

            <div className="field">
              <label>{sourceMode === 'article' ? 'Article title' : 'Source title'}</label>
              <input
                value={sourceTitle}
                onChange={(event) => setSourceTitle(event.target.value)}
                placeholder={sourceMode === 'article' ? 'Article title or report name' : 'Optional source title or report name'}
              />
            </div>

            {sourceMode === 'pdf' ? (
              <div className="field">
                <label>PDF upload</label>
                <div
                  className={`upload-dropzone${isDragging ? ' is-dragging' : ''}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => pdfInputRef.current?.click()}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setIsDragging(false);
                    handlePdfSelection(event.dataTransfer.files?.[0] || null);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') pdfInputRef.current?.click();
                  }}
                >
                  <input
                    ref={pdfInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    className="sr-only"
                    onChange={(event) => handlePdfSelection(event.target.files?.[0] || null)}
                  />
                  <UiIcon name="document" />
                  <strong>{sourceFile ? sourceFile.name : 'Drop your PDF here or click to upload'}</strong>
                  <small className="sub">Supported: PDF files up to 50MB.</small>
                  <div className="upload-dropzone-meta">
                    <span>{sourceFileMeta?.sizeLabel || (sourceFile ? formatBytes(sourceFile.size) : 'No file selected')}</span>
                    <span>{sourceFileMeta?.pageCount ? `${sourceFileMeta.pageCount} pages` : 'Page count after upload'}</span>
                  </div>
                </div>
                {sourceFileMeta ? (
                  <div className="upload-file-chip-row">
                    <span className="upload-file-chip">File: {sourceFileMeta.name}</span>
                    <span className="upload-file-chip">Size: {sourceFileMeta.sizeLabel}</span>
                    <span className="upload-file-chip">{sourceFileMeta.pageCount ? `${sourceFileMeta.pageCount} pages` : 'Pages detected after upload'}</span>
                  </div>
                ) : null}
              </div>
            ) : null}

            {sourceMode === 'article' ? (
              <div className="field">
                <label>Article source</label>
                <div className="form-grid" style={{ marginBottom: 12 }}>
                  <input value={sourceOrigin} onChange={(event) => setSourceOrigin(event.target.value)} placeholder="Source / publication / institution" />
                  <input type="date" value={sourceDate} onChange={(event) => setSourceDate(event.target.value)} />
                </div>
                <textarea
                  rows={8}
                  value={sourceText}
                  onChange={(event) => setSourceText(event.target.value)}
                  placeholder="Paste the article, report, protocol, or training text here."
                />
                <div className="inline-metrics">
                  <span className="metric-pill">Words: {sourceWordCount}</span>
                  <span className="metric-pill">{sourceStructureHint}</span>
                </div>
              </div>
            ) : null}

            {sourceMode === 'url' ? (
              <div className="field">
                <label>Source URL</label>
                <input value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="https://..." />
                <div className="card" style={{ marginTop: 12, background: '#f8f9fb' }}>
                  <div className="section-head" style={{ marginBottom: 8 }}>
                    <div>
                      <h3 style={{ margin: 0 }}>Extraction preview</h3>
                    </div>
                  </div>
                  <p className="sub" style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                    {sourceUrl.trim() ? 'Main article content will be extracted on generation and previewed here.' : 'Paste a URL to load the article preview.'}
                  </p>
                </div>
              </div>
            ) : null}

            <div className="card" style={{ marginTop: 14, background: '#f8f9fb' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <UiIcon name={contentMeta.icon} />
                <div>
                  <div style={{ fontWeight: 700 }}>{contentMeta.label}</div>
                  <div className="sub">Source input will be sent through the DeepSeek pipeline.</div>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {currentStep === 2 ? (
          <section className="card">
            <div className="section-head">
              <div>
                <h2>Step 2. Generation Settings</h2>
              </div>
            </div>

            <div className="form-grid">
              <div className="field">
                <label>Draft title</label>
                <input value={title} onChange={(event) => setTitle(event.target.value)} />
              </div>
              <div className="field">
                <label>Content type</label>
                <select value={contentType} onChange={(event) => setContentType(event.target.value)}>
                  {CONTENT_TYPES.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Target audience</label>
                <select value={audience} onChange={(event) => setAudience(event.target.value)}>
                  {AUDIENCES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Topic</label>
                <input value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="Airway management, trauma, cardiology..." />
              </div>
              <div className="field">
                <label>Difficulty level</label>
                <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
                  {DIFFICULTIES.map((item) => <option key={item}>{item}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Question count: {questionCount}</label>
                <input type="range" min="10" max="100" step="5" value={questionCount} onChange={(event) => setQuestionCount(Number(event.target.value))} />
              </div>
            </div>

            <div className="field">
              <label>Question types</label>
              <div className="source-mode-grid" style={{ marginBottom: 0 }}>
                {QUESTION_TYPES.map((item) => {
                  const active = !!questionTypes[item.key];
                  return (
                    <button
                      key={item.key}
                      type="button"
                      className={`card source-mode-card question-type-card${active ? ' is-active' : ''}`}
                      onClick={() => setQuestionTypes((current) => ({ ...current, [item.key]: !current[item.key] }))}
                      style={{
                        '--tab-accent': item.accent,
                        '--tab-tint': item.tint,
                      }}
                    >
                      <div className="source-mode-top">
                        <span className="source-mode-icon"><UiIcon name={item.icon} /></span>
                        <span className="source-mode-badge" style={{ color: active ? item.accent : 'var(--ink-soft)', background: active ? item.tint : 'var(--paper)' }}>
                          {active ? 'Enabled' : 'Optional'}
                        </span>
                      </div>
                      <h3 style={{ margin: '10px 0 6px' }}>{item.label}</h3>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="generator-feature-grid">
              <section className="generator-feature-card">
                <div className="section-head" style={{ marginBottom: 12 }}>
                  <div>
                    <h3 style={{ margin: 0 }}>Bloom&apos;s Taxonomy</h3>
                    <p className="sub" style={{ margin: '4px 0 0' }}>Shape the cognitive depth of the draft.</p>
                  </div>
                </div>
                <label className="checkbox-field checkbox-feature-row">
                  <input type="checkbox" checked={bloomPriority} onChange={(event) => setBloomPriority(event.target.checked)} />
                  <span>
                    <strong>Higher-order thinking</strong>
                    <small>Prioritize analysis, evaluation, and decision-making.</small>
                  </span>
                </label>
                <div className="feature-chip-row">
                  {['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'].map((level) => (
                    <span key={level} className={`metric-pill${bloomPriority && ['Analyze', 'Evaluate', 'Create'].includes(level) ? ' is-emphasis' : ''}`}>
                      {level}
                    </span>
                  ))}
                </div>
              </section>

              <section className="generator-feature-card">
                <div className="section-head" style={{ marginBottom: 12 }}>
                  <div>
                    <h3 style={{ margin: 0 }}>Additional options</h3>
                    <p className="sub" style={{ margin: '4px 0 0' }}>Publishing controls and review helpers.</p>
                  </div>
                </div>
                <div className="feature-toggle-grid">
                  <label className="checkbox-field">
                    <input type="checkbox" checked={includeAnswerKey} onChange={(event) => setIncludeAnswerKey(event.target.checked)} />
                    <span>Answer key</span>
                  </label>
                  <label className="checkbox-field">
                    <input type="checkbox" checked={includeFeedback} onChange={(event) => setIncludeFeedback(event.target.checked)} />
                    <span>Feedback</span>
                  </label>
                  <label className="checkbox-field">
                    <input type="checkbox" checked={suggestDiagramPlaceholders} onChange={(event) => setSuggestDiagramPlaceholders(event.target.checked)} />
                    <span>Diagrams</span>
                  </label>
                  <label className="checkbox-field">
                    <input type="checkbox" checked={autoTagByTopic} onChange={(event) => setAutoTagByTopic(event.target.checked)} />
                    <span>Auto-tag</span>
                  </label>
                </div>
              </section>
            </div>

            <div className="generator-action-row" style={{ marginTop: 14 }}>
              <button type="button" className="primary" onClick={() => generateDraft('upload')} disabled={busy || !sourceReady}>
                {busy ? 'Generating...' : (sourceMode === 'pdf' ? 'Upload & Generate' : 'Generate Draft')}
              </button>
              <button type="button" className="ghost" onClick={() => generateDraft('draft')} disabled={busy || !sourceReady}>
                Generate Draft
              </button>
              <button type="button" className="ghost" onClick={cancelGeneration} disabled={busy && !job && !reviewQueue.length}>
                Cancel
              </button>
            </div>

            {job && job.status !== 'completed' && job.status !== 'failed' ? (
              <div style={{ marginTop: 14 }}>
                <ProgressBar label={job.title} status={job.status} value={job.progress} />
              </div>
            ) : null}

            {status ? <div className="ok-note" style={{ marginTop: 12 }}>{status}</div> : null}
          </section>
        ) : null}

        {currentStep === 3 ? (
          <section className="card">
            <div className="section-head">
              <div>
                <h2>Step 3. Review & Preview</h2>
              </div>
              <span className="badge active" style={{ fontSize: 16, paddingInline: 14 }}>{reviewCounts.selected} selected</span>
            </div>

            {!previewReady ? (
              <div className="ok-note">Generate a draft first to open the preview and review queue.</div>
            ) : (
              <>
                <button type="button" className="ghost" onClick={() => setShowQuestionPreview((current) => !current)} style={{ marginBottom: 14 }}>
                  {showQuestionPreview ? 'Hide question preview' : 'Show question preview'}
                </button>

                {showQuestionPreview ? (
                  <div className="generation-preview-section">
                    <div className="section-head" style={{ marginBottom: 8 }}>
                      <div>
                        <h3 style={{ margin: 0 }}>Question preview</h3>
                      </div>
                    </div>
                    <div className="preview-question-list">
                      {livePreviewQuestions.map((item, index) => (
                        <article key={item.question || item.prompt || `${item.type || 'question'}-${index}`} className="preview-question-card">
                          <div className="preview-question-top">
                            <span className="badge active">{String(item.type || 'question').replace('_', ' ')}</span>
                            <span className="badge draft">Preview</span>
                          </div>
                          <h4>{item.question || item.prompt}</h4>
                          <div className="preview-answer">
                            <span className="preview-answer-label">Answer</span>
                            <p>{item.answer}</p>
                          </div>
                          <div className="preview-feedback">
                            <span className="preview-feedback-label">Feedback</span>
                            <p>{item.feedback}</p>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="generation-preview-section">
                  <div className="section-head" style={{ marginBottom: 8 }}>
                    <div>
                      <h3 style={{ margin: 0 }}>Review queue</h3>
                      <p className="sub" style={{ margin: '4px 0 0' }}>Approve or reject questions before publishing.</p>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span className="badge draft">{reviewCounts.total} total</span>
                      <span className="badge active" style={{ fontSize: 16, paddingInline: 14 }}>{reviewCounts.selected} selected</span>
                    </div>
                  </div>

                  <div className="review-tabs review-pills" role="tablist" aria-label="Review queue filters">
                    {reviewTabs.map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        className={`review-tab${reviewFilter === tab.key ? ' is-active' : ''}`}
                        onClick={() => setReviewFilter(tab.key)}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="review-queue-layout">
                    <div className="review-queue-list">
                      {filteredReviewQueue.length ? filteredReviewQueue.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className={`review-queue-card${selectedReviewItem?.id === item.id ? ' is-selected' : ''}`}
                          onClick={() => setSelectedReviewId(item.id)}
                        >
                          <div className="review-queue-top">
                            <span className={`badge ${item.status === 'approved' ? 'approved' : item.status === 'rejected' ? 'draft' : 'active'}`}>
                              {item.status.replace('_', ' ')}
                            </span>
                            <span className="badge draft">{String(item.type || 'question').replace('_', ' ')}</span>
                          </div>
                          <h4>{item.question}</h4>
                          <p>{item.answer || 'Answer hidden until review.'}</p>
                        </button>
                      )) : (
                        <div className="generation-preview-result">
                          <div className="generation-preview-value">No questions in this filter yet.</div>
                          <p className="sub" style={{ margin: '8px 0 0' }}>Generate a draft to populate the review queue.</p>
                        </div>
                      )}
                    </div>

                    <div className="review-preview-card">
                      <div className="review-preview-head">
                        <div>
                          <div className="generation-preview-label">Preview</div>
                          <div className="generation-preview-value">{selectedReviewItem?.question || 'Select a question to preview it here.'}</div>
                        </div>
                        {selectedReviewItem ? (
                          <span className={`badge ${selectedReviewItem.status === 'approved' ? 'approved' : selectedReviewItem.status === 'rejected' ? 'draft' : 'active'}`}>
                            {selectedReviewItem.status.replace('_', ' ')}
                          </span>
                        ) : null}
                      </div>
                      {selectedReviewItem ? (
                        <>
                          <div className="preview-answer">
                            <span className="preview-answer-label">Suggested answer</span>
                            <p>{selectedReviewItem.answer || 'No suggested answer yet.'}</p>
                          </div>
                          <div className="preview-feedback">
                            <span className="preview-feedback-label">Feedback</span>
                            <p>{selectedReviewItem.feedback || 'No feedback attached.'}</p>
                          </div>
                          <div className="review-actions">
                            <button type="button" className="primary" onClick={() => updateReviewStatus(selectedReviewItem.id, 'approved')}>Approve</button>
                            <button type="button" className="ghost" onClick={() => updateReviewStatus(selectedReviewItem.id, 'rejected')}>Reject</button>
                          </div>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="generation-preview-section">
                  <div className="section-head" style={{ marginBottom: 8 }}>
                    <div>
                      <h3 style={{ margin: 0 }}>Content statistics</h3>
                    </div>
                  </div>
                  <div className="generation-preview-grid">
                    <div className="generation-preview-item">
                      <div className="generation-preview-label">Total questions</div>
                      <div className="generation-preview-value">{questionCount}</div>
                    </div>
                    <div className="generation-preview-item">
                      <div className="generation-preview-label">Difficulty</div>
                      <div className="generation-preview-value">{difficulty}</div>
                    </div>
                    <div className="generation-preview-item">
                      <div className="generation-preview-label">Bloom priority</div>
                      <div className="generation-preview-value">{bloomPriority ? 'Higher-order thinking' : 'Standard mix'}</div>
                    </div>
                    <div className="generation-preview-item">
                      <div className="generation-preview-label">Answer key</div>
                      <div className="generation-preview-value">{includeAnswerKey ? 'Visible to staff' : 'Hidden'}</div>
                    </div>
                  </div>
                  <div className="generation-breakdown-row">
                    {generatedQuestionBreakdown.map((item) => (
                      <span key={item.label} className="metric-pill" style={{ borderColor: item.accent }}>
                        {item.label}: {item.value}
                      </span>
                    ))}
                  </div>
                  {liveAnalysis ? (
                    <div className="generation-preview-result" style={{ marginTop: 14 }}>
                      <div className="generation-preview-label">Source analysis</div>
                      <div className="generation-preview-value">
                        {liveAnalysis.incident_type || 'Unknown'} · {liveAnalysis.location || 'Not stated in source'}
                      </div>
                      <p className="sub" style={{ margin: '8px 0 0', whiteSpace: 'pre-wrap' }}>
                        {(Array.isArray(liveAnalysis.key_facts) ? liveAnalysis.key_facts : []).slice(0, 5).join(' • ') || 'Analysis will appear after generation completes.'}
                      </p>
                    </div>
                  ) : null}
                </div>
              </>
            )}
          </section>
        ) : null}

        {currentStep === 4 ? (
          <section className="card">
            <div className="section-head">
              <div>
                <h2>Step 4. Publish & Destination</h2>
              </div>
              <span className="badge active" style={{ fontSize: 16, paddingInline: 14 }}>{reviewCounts.selected} selected</span>
            </div>

            <div className="card" style={{ marginTop: 14, background: '#f8f9fb' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <UiIcon name={contentMeta.icon} />
                <div>
                  <div style={{ fontWeight: 700 }}>{contentMeta.label}</div>
                  <div className="sub">Pick where this draft should live.</div>
                </div>
              </div>
            </div>

            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label>Output destination</label>
              <div className="destination-grid">
                {OUTPUT_DESTINATIONS.map((destination) => {
                  const active = publishDestination === destination.value;
                  return (
                    <button
                      key={destination.value}
                      type="button"
                      className={`card destination-card${active ? ' is-active' : ''}`}
                      onClick={() => setPublishDestination(destination.value)}
                      style={{
                        '--tab-accent': active ? 'var(--red)' : '#d1d5db',
                        '--tab-tint': destination.tint,
                      }}
                    >
                      <div className="source-mode-top">
                        <span className="source-mode-icon"><UiIcon name={destination.icon} /></span>
                        <span className="source-mode-badge" style={{ color: active ? 'var(--red)' : 'var(--ink-soft)', background: active ? '#fee2e2' : destination.tint }}>
                          {active ? 'Selected' : 'Route'}
                        </span>
                      </div>
                      <h3 style={{ margin: '10px 0 6px' }}>{destination.label}</h3>
                      <p className="sub" style={{ margin: 0 }}>{destination.note}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="form-grid">
              <div className="field">
                <label>School access</label>
                <select value={schoolAccess} onChange={(event) => setSchoolAccess(event.target.value)}>
                  {BROWSER_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </div>
            </div>

            {schoolAccess === 'selected' ? (
              <div className="field">
                <label>School IDs</label>
                <input value={selectedSchoolIds} onChange={(event) => setSelectedSchoolIds(event.target.value)} placeholder="Comma-separated institution IDs" />
              </div>
            ) : null}

            <div className="generation-preview-section">
              <div className="section-head" style={{ marginBottom: 8 }}>
                <div>
                  <h3 style={{ margin: 0 }}>Publish to Independent Students</h3>
                  <p className="sub" style={{ margin: '4px 0 0' }}>Keep it clean and publish only when the title is ready.</p>
                </div>
                <span className="badge active" style={{ fontSize: 16, paddingInline: 14 }}>{reviewCounts.selected} selected</span>
              </div>

              <div className="publish-panel">
                {publishDestination === 'independent_student' ? (
                  <div className="field">
                    <label>Assignment Title</label>
                    <input
                      value={assignmentTitle}
                      onChange={(event) => setAssignmentTitle(event.target.value)}
                      placeholder="Cardiac Assessment Assignment"
                      required
                    />
                  </div>
                ) : null}

                <div className="generation-preview-grid">
                  <div className="generation-preview-item">
                    <div className="generation-preview-label">Selected questions</div>
                    <div className="generation-preview-value">{reviewCounts.selected}</div>
                  </div>
                  <div className="generation-preview-item">
                    <div className="generation-preview-label">Ready to publish</div>
                    <div className="generation-preview-value">{canPublish ? 'Yes' : 'Title required'}</div>
                  </div>
                </div>

                <div className="review-actions" style={{ marginTop: 14 }}>
                  <button type="button" className="primary" onClick={handlePublishSelected} disabled={publishBusy || !canPublish}>
                    {publishBusy ? 'Publishing...' : (publishDestination === 'independent_student' ? 'Publish to Independent Students' : 'Publish Selected')}
                  </button>
                  <button type="button" className="ghost" onClick={() => setAssignmentTitle('')} disabled={publishBusy}>
                    Clear title
                  </button>
                </div>
              </div>
            </div>

            {publishConfirmation ? (
              <div className="ok-note" style={{ marginTop: 14 }}>
                {publishConfirmation}
              </div>
            ) : null}
          </section>
        ) : null}
      </div>      {selectedCase ? (
        <ContentCustomizer
          contentId={selectedCase.id}
          contentType="case_study"
          onSaved={() => setStatus(`Saved changes for ${selectedCase.title}.`)}
        />
      ) : null}
    </section>
  );
}
