import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import ContentCustomizer from '../common/ContentCustomizer';
import ProgressBar from '../common/ProgressBar';
import UiIcon from '../shared/UiIcon';
import Loading from '../shared/Loading';

const SOURCE_MODES = [
  { id: 'pdf', label: 'PDF Upload', hint: 'Reports, manuals, protocols.', icon: 'document' },
  { id: 'article', label: 'Article Paste', hint: 'News, incident writeups, research.', icon: 'activity' },
  { id: 'url', label: 'URL / Link', hint: 'Web pages and official resources.', icon: 'dispatch' },
];

const CONTENT_TYPES = [
  { value: 'case_study', label: 'Case Studies', destination: 'Question Bank', icon: 'cases' },
  { value: 'simulation', label: 'Skill Simulations', destination: 'Simulation Library', icon: 'simulation' },
  { value: 'assignment', label: 'Assignments', destination: 'Assignment Bank', icon: 'document' },
  { value: 'exam', label: 'MCQ / Exams', destination: 'Exam Center', icon: 'question' },
  { value: 'video_script', label: 'Video Scripts', destination: 'Video Script Bank', icon: 'activity' },
];

export default function AiGenerator() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [cases, setCases] = useState(null);
  const [sourceMode, setSourceMode] = useState('article');
  const [sourceFile, setSourceFile] = useState(null);
  const [sourceText, setSourceText] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [sourceTitle, setSourceTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [title, setTitle] = useState('MedPro AI Draft');
  const [contentType, setContentType] = useState('case_study');
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

  const generationSummary = useMemo(() => {
    const bits = [
      `${contentMeta.label} -> ${contentMeta.destination}`,
      `Source: ${SOURCE_MODES.find((item) => item.id === sourceMode)?.label || 'Article Paste'}`,
      sourceTitle ? `Title: ${sourceTitle}` : '',
      sourceMode === 'pdf' && sourceFile ? `File: ${sourceFile.name}` : '',
      sourceMode === 'url' && sourceUrl ? `URL: ${sourceUrl}` : '',
      prompt ? `Brief: ${prompt}` : '',
    ].filter(Boolean);
    return bits.join(' | ');
  }, [contentMeta, sourceMode, sourceTitle, sourceFile, sourceUrl, prompt]);

  async function generateDraft() {
    setBusy(true);
    setStatus('');
    try {
      const payload = new FormData();
      payload.set('title', title);
      payload.set('contentType', contentType);
      payload.set('prompt', prompt);
      payload.set('sourceType', sourceMode);
      payload.set('sourceTitle', sourceTitle);
      payload.set('sourceText', sourceText);
      payload.set('sourceUrl', sourceUrl);
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

          <div className="grid-auto" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: 16 }}>
            {SOURCE_MODES.map((mode) => {
              const active = sourceMode === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  className="card"
                  onClick={() => setSourceMode(mode.id)}
                  style={{
                    textAlign: 'left',
                    border: active ? '1px solid var(--accent-red)' : '1px solid var(--border)',
                    boxShadow: active ? '0 0 0 2px rgba(230,57,53,.08)' : 'none',
                    cursor: 'pointer',
                    margin: 0,
                    background: active ? '#fff8f7' : 'white',
                  }}
                >
                  <UiIcon name={mode.icon} />
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
              <input
                type="file"
                accept="application/pdf"
                onChange={(event) => setSourceFile(event.target.files?.[0] || null)}
              />
              <small className="sub">Upload one source PDF per draft. The file is sent with the generation request.</small>
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

          <div className="field" style={{ marginTop: 14 }}>
            <label>Generation prompt</label>
            <textarea
              rows={5}
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Describe the learning output, tone, difficulty, and any required structure."
            />
          </div>

          <div className="logbook-actions">
            <button type="button" className="primary" onClick={generateDraft} disabled={busy || (!sourceReady && !prompt.trim())}>
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

          {generationSummary ? (
            <p className="sub" style={{ marginTop: 12, marginBottom: 0 }}>
              {generationSummary}
            </p>
          ) : null}

          {job ? (
            <div style={{ marginTop: 14 }}>
              <ProgressBar label={job.title} status={job.status} value={job.progress} />
            </div>
          ) : null}

          {status ? <div className="ok-note" style={{ marginTop: 12 }}>{status}</div> : null}
        </section>
      </div>

      <div className="grid-auto">
        <section className="card">
          <div className="section-head">
            <div>
              <h2>Recent content</h2>
              <p className="sub">Open a case to refine it or keep the draft moving.</p>
            </div>
          </div>
          <div className="grid-auto">
            {cases.slice(0, 6).map((item) => (
              <article key={item.id} className="card" style={{ margin: 0 }}>
                <h3 style={{ marginTop: 0 }}>{item.title}</h3>
                <p className="sub" style={{ marginTop: 0 }}>{item.category} · {item.difficulty || '—'}</p>
                <div className="logbook-actions">
                  <button
                    type="button"
                    className="primary"
                    onClick={() => setSearchParams({ contentId: item.id, contentType: 'case_study' })}
                  >
                    Customize
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="card">
          <div className="section-head">
            <div>
              <h2>Preview handoff</h2>
              <p className="sub">Review the selected content before posting it to students.</p>
            </div>
          </div>
          {selectedCase ? (
            <div className="card" style={{ margin: 0, background: '#f8f9fb' }}>
              <h3 style={{ marginTop: 0 }}>{selectedCase.title}</h3>
              <p className="sub" style={{ marginTop: 0 }}>{selectedCase.category} · {selectedCase.difficulty || '—'}</p>
              <ProgressBar
                label="Editable blocks"
                status={`${Array.isArray(selectedCase.content_json?.sections) ? selectedCase.content_json.sections.length : 0} sections`}
                value={Math.min(100, (Array.isArray(selectedCase.content_json?.sections) ? selectedCase.content_json.sections.length : 0) * 5)}
              />
            </div>
          ) : (
            <div className="ok-note">Select a content item to open the customizer.</div>
          )}
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
