import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import ContentCustomizer from '../common/ContentCustomizer';
import ProgressBar from '../common/ProgressBar';
import Loading from '../shared/Loading';

export default function AiGenerator() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [cases, setCases] = useState(null);
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

  async function generateDraft() {
    setBusy(true);
    setStatus('');
    try {
      const response = await api('/ai/generate', {
        method: 'POST',
        body: { prompt, title, contentType },
      });
      setJob(response.job);
      setStatus('Draft generation started.');
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
          <h1>AI Generator</h1>
          <div className="sub">Create a draft, monitor generation progress, then refine a case with the content customizer.</div>
        </div>
        <div className="logbook-actions">
          <Link className="ghost" to="/superadmin/content">Uploader</Link>
          <Link className="ghost" to="/admin/content-bank">Content Bank</Link>
        </div>
      </div>

      <div className="card">
        <div className="form-grid">
          <div className="field">
            <label>Draft title</label>
            <input value={title} onChange={(event) => setTitle(event.target.value)} />
          </div>
          <div className="field">
            <label>Content type</label>
            <select value={contentType} onChange={(event) => setContentType(event.target.value)}>
              <option value="case_study">Case Study</option>
              <option value="assignment">Assignment</option>
              <option value="worksheet">Worksheet</option>
            </select>
          </div>
        </div>
        <div className="field">
          <label>Generation prompt</label>
          <textarea rows={4} value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Describe the EMS learning content you want to draft." />
        </div>
        <div className="logbook-actions">
          <button type="button" className="primary" onClick={generateDraft} disabled={busy || !prompt.trim()}>
            {busy ? 'Generating...' : 'Start generation'}
          </button>
          <button type="button" className="ghost" onClick={() => setJob(null)} disabled={!job}>Reset progress</button>
        </div>
        {job ? (
          <div style={{ marginTop: 14 }}>
            <ProgressBar label={job.title} status={job.status} value={job.progress} />
          </div>
        ) : null}
        {status ? <div className="ok-note" style={{ marginTop: 12 }}>{status}</div> : null}
      </div>

      <div className="grid-auto">
        {cases.slice(0, 6).map((item) => (
          <article key={item.id} className="card">
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

      {selectedCase ? (
        <ContentCustomizer
          contentId={selectedCase.id}
          contentType="case_study"
          onSaved={() => setStatus(`Saved changes for ${selectedCase.title}.`)}
        />
      ) : (
        <div className="card">
          <p style={{ margin: 0 }}>Select a case from the list to open the customizer.</p>
        </div>
      )}
    </section>
  );
}

