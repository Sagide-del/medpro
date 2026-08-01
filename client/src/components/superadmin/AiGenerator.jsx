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

export default function AiGenerator() {
  const [searchParams, setSearchParams] = useSearchParams();
  const pdfInputRef = useRef(null);
  const [cases, setCases] = useState(null);
  const [sourceMode, setSourceMode] = useState('article');
  const [sourceFile, setSourceFile] = useState(null);
  const [sourceText, setSourceText] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [sourceTitle, setSourceTitle] = useState('');
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

  async function generateDraft() {
    setBusy(true);
    setStatus('');
    try {
      const payload = new FormData();
      payload.set('title', title);
      payload.set('contentType', contentType);
      payload.set('sourceType', sourceMode);
      payload.set('sourceTitle', sourceTitle);
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

  if (!cases) return <Loading label="Loading AI generator..." />;

  return (
    <section className="page-stack">
      <div className="page-head">
        <div>
          <h1>Master AI Generator</h1>
          <div className="sub">Multi-source drafting for EMS cases, simulations, assignments, exams, and video scripts.</div>
        </div>
        <div className="logbook-actions">
          <Link className="ghost" to="/superadmin/content">Uploader</Link>
          <Link className="ghost" to="/admin/content-bank">Content Bank</Link>
        </div>
      </div>

      <div className="grid-auto">
        <section className="card">
          <div className="section-head">
            <div>
              <h2>Source studio</h2>
              <p className="sub">Upload a PDF, paste an article, or attach a URL. Keep the source focused and the output clean.</p>
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
            <label>Source title</label>
            <input
              value={sourceTitle}
              onChange={(event) => setSourceTitle(event.target.value)}
              placeholder="Optional source title or report name"
            />
          </div>

          {sourceMode === 'pdf' ? (
            <div className="field">
              <label>PDF upload</label>
              <div className="upload-picker">
                <input
                  ref={pdfInputRef}
                  type="file"
                  accept="application/pdf"
                  className="sr-only"
                  onChange={(event) => setSourceFile(event.target.files?.[0] || null)}
                />
                <button
                  type="button"
                  className="ghost upload-trigger"
                  onClick={() => pdfInputRef.current?.click()}
                >
                  {sourceFile ? 'Change PDF' : 'Upload PDF'}
                </button>
                <small className="sub">
                  {sourceFile ? `Selected: ${sourceFile.name}` : 'Tap to choose a PDF from your device.'}
                </small>
              </div>
            </div>
          ) : null}

          {sourceMode === 'article' ? (
            <div className="field">
              <label>Article text</label>
              <textarea
                rows={7}
                value={sourceText}
                onChange={(event) => setSourceText(event.target.value)}
                placeholder="Paste the article, report, protocol, or training text here."
              />
            </div>
          ) : null}

          {sourceMode === 'url' ? (
            <div className="field">
              <label>Source URL</label>
              <input
                value={sourceUrl}
                onChange={(event) => setSourceUrl(event.target.value)}
                placeholder="https://..."
              />
            </div>
          ) : null}

          <div className="card" style={{ marginTop: 14, background: '#f8f9fb' }}>
            <div className="section-head" style={{ marginBottom: 8 }}>
              <div>
                <h3 style={{ margin: 0 }}>Source preview</h3>
              </div>
            </div>
            <p className="sub" style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
              {sourceMode === 'pdf' && sourceFile
                ? `PDF: ${sourceFile.name}`
                : sourceMode === 'url' && sourceUrl
                  ? sourceUrl
                  : sourceText.trim()
                    ? sourceText.slice(0, 240)
                    : 'No source selected yet.'}
            </p>
          </div>
        </section>

        <section className="card">
          <div className="section-head">
            <div>
              <h2>Generation brief</h2>
              <p className="sub">Choose what the AI should build, then send it to the right MedProHub library.</p>
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
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={questionCount}
                onChange={(event) => setQuestionCount(Number(event.target.value))}
              />
            </div>
          </div>

          <div className="card" style={{ marginTop: 14, background: '#f8f9fb' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <UiIcon name={contentMeta.icon} />
              <div>
                <div style={{ fontWeight: 700 }}>{contentMeta.label}</div>
                <div className="sub">Publishes to {contentMeta.destination}</div>
              </div>
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

          <div className="form-grid">
            <label className="field checkbox-field">
              <input type="checkbox" checked={bloomPriority} onChange={(event) => setBloomPriority(event.target.checked)} />
              <span>Prioritize higher-order thinking</span>
            </label>
            <label className="field checkbox-field">
              <input type="checkbox" checked={includeAnswerKey} onChange={(event) => setIncludeAnswerKey(event.target.checked)} />
              <span>Include answer key</span>
            </label>
            <label className="field checkbox-field">
              <input type="checkbox" checked={includeFeedback} onChange={(event) => setIncludeFeedback(event.target.checked)} />
              <span>Include feedback explanations</span>
            </label>
            <label className="field checkbox-field">
              <input type="checkbox" checked={suggestDiagramPlaceholders} onChange={(event) => setSuggestDiagramPlaceholders(event.target.checked)} />
              <span>Suggest diagram placeholders</span>
            </label>
            <label className="field checkbox-field">
              <input type="checkbox" checked={autoTagByTopic} onChange={(event) => setAutoTagByTopic(event.target.checked)} />
              <span>Auto-tag by topic</span>
            </label>
          </div>

          <div className="form-grid">
            <div className="field">
              <label>Output destination</label>
              <select value={publishDestination} onChange={(event) => setPublishDestination(event.target.value)}>
                <option value="question_bank">Question Bank</option>
                <option value="independent_student">Independent Student</option>
                <option value="ems_cases">EMS Cases</option>
                <option value="exam_mcq">Exam Center - MCQ</option>
                <option value="exam_mock">Exam Center - Mock</option>
                <option value="simulation">Simulation</option>
              </select>
            </div>
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

          <div className="logbook-actions">
            <button type="button" className="primary" onClick={generateDraft} disabled={busy || !sourceReady}>
              {busy ? 'Generating...' : 'Start generation'}
            </button>
            <button
              type="button"
              className="ghost"
              onClick={() => {
                setJob(null);
                setStatus('');
              }}
              disabled={!job}
            >
              Reset progress
            </button>
          </div>

          <div className="card generation-preview-card" style={{ marginTop: 16, background: '#f8f9fb' }}>
            <div className="section-head" style={{ marginBottom: 10 }}>
              <div>
                <h3 style={{ margin: 0 }}>Destination preview</h3>
                <p className="sub" style={{ margin: '4px 0 0' }}>
                  Review the output path and structure before the generator publishes the draft.
                </p>
              </div>
              <span className="badge active">{contentMeta.destination}</span>
            </div>

            <div className="generation-preview-grid">
              <div className="generation-preview-item">
                <div className="generation-preview-label">Content type</div>
                <div className="generation-preview-value">{contentMeta.label}</div>
              </div>
              <div className="generation-preview-item">
                <div className="generation-preview-label">Destination tab</div>
                <div className="generation-preview-value">{publishDestination.replaceAll('_', ' ')}</div>
              </div>
              <div className="generation-preview-item">
                <div className="generation-preview-label">Question count</div>
                <div className="generation-preview-value">{questionCount}</div>
              </div>
              <div className="generation-preview-item">
                <div className="generation-preview-label">Question types</div>
                <div className="generation-preview-value">{enabledQuestionTypes.length ? enabledQuestionTypes.join(', ') : 'None selected'}</div>
              </div>
            </div>

            <div className="generation-preview-list">
              {previewChecklist.map((item) => (
                <div key={item} className="generation-preview-check">
                  <UiIcon name="result" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            {job?.result ? (
              <div className="generation-preview-result">
                <div className="generation-preview-label">Latest draft</div>
                <div className="generation-preview-value">{job.result.title || title}</div>
                <p className="sub" style={{ margin: '8px 0 0', whiteSpace: 'pre-wrap' }}>
                  {job.result.draft || job.result.sourceExcerpt || 'Preview will appear here after generation starts.'}
                </p>
              </div>
            ) : (
              <div className="ok-note" style={{ marginTop: 14 }}>
                Start generation to preview the drafted output and answer key placement.
              </div>
            )}

            {job ? (
              <div style={{ marginTop: 14 }}>
                <ProgressBar label={job.title} status={job.status} value={job.progress} />
              </div>
            ) : null}

            {status ? <div className="ok-note" style={{ marginTop: 12 }}>{status}</div> : null}
          </div>
        </section>
      </div>

      {selectedCase ? (
        <ContentCustomizer
          contentId={selectedCase.id}
          contentType="case_study"
          onSaved={() => setStatus(`Saved changes for ${selectedCase.title}.`)}
        />
      ) : null}
    </section>
  );
}
