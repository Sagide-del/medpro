import BookGenerationPanel from './BookGenerationPanel';
import { useEffect, useState } from 'react';
import { api } from '../../services/api';

const sourceTypes = ['protocol', 'research_article', 'textbook', 'drug_reference', 'kenya_case', 'psychometric_case'];

export default function RagSourceLibrary({ program, subject, onSubjectChange }) {
  const [sources, setSources] = useState([]);
  const [file, setFile] = useState(null);
  const [sourceType, setSourceType] = useState('textbook');
  const [uploadProgram, setUploadProgram] = useState(program);
  const [uploadSubject, setUploadSubject] = useState('');
  const [version, setVersion] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [canApprove, setCanApprove] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [search, setSearch] = useState('');
  const [passages, setPassages] = useState([]);
  useEffect(() => { setUploadProgram(program); setPassages([]); }, [program]);
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const data = await api('/ai/rag/sources');
        if (active) { setSources(data.sources || []); setCanApprove(data.canApprove); }
      } catch (error) { if (active) setStatus(error.message); }
    }
    load();
    const interval = setInterval(load, 8000);
    return () => { active = false; clearInterval(interval); };
  }, [refresh]);

  async function upload() {
    setBusy(true); setStatus('');
    try {
      const body = new FormData();
      if (!file || file.size > 50 * 1024 * 1024) throw new Error('Choose a PDF up to 50 MB.');
      body.append('file', file); body.set('program', uploadProgram);
      body.set('sourceType', sourceType); body.set('subject', uploadSubject); body.set('version', version);
      await api('/ai/rag/sources', { method: 'POST', body });
      setStatus('Uploaded privately. An administrator must approve this source before indexing.');
      setRefresh((value) => value + 1);
    } catch (error) { setStatus(error.message); }
    finally { setBusy(false); }
  }
  async function action(id, name) {
    if (name === 'withdraw' && !window.confirm('Withdraw this source and unpublish content generated from it? Saved student results will remain.')) return;
    if (name === 'approve' && !window.confirm('Confirm that you are authorized to use this source and have reviewed its pathway classification and clinical suitability.')) return;
    setBusy(true); setStatus('');
    try {
      await api(`/ai/rag/sources/${id}/${name}`, { method: 'POST' });
      setStatus(name === 'approve' ? 'Approved and queued for indexing. First indexing may take several minutes while the model loads.' : 'Source updated.');
      setRefresh((value) => value + 1);
    } catch (error) { setStatus(error.message); }
    finally { setBusy(false); }
  }
  async function preview() {
    setBusy(true); setStatus(''); setPassages([]);
    try {
      const data = await api('/ai/rag/retrieve', { method: 'POST', body: { program, subject, search, destination: 'question_bank', limit: 5 } });
      setPassages(data.chunks || []);
    } catch (error) { setStatus(error.message); }
    finally { setBusy(false); }
  }
  return <section className="card page-stack">
    <h2>1. Add a book or learning resource</h2><ol className="content-workspace-steps"><li>Upload & classify</li><li>Approve & index</li><li>Select student sections</li><li>Review & publish</li></ol>
    <p>Private PDFs with page-linked evidence. Sources require review before indexing; drafts still require clinical approval. Institution-private sources are draft-only.</p>
    <div className="grid-auto">
      <label className="field">PDF (up to 50 MB)<input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} /></label>
      <label className="field">Source pathway<select value={uploadProgram} onChange={(e) => setUploadProgram(e.target.value)}><option>EMT</option><option>Paramedic</option><option>Nursing</option><option value="all">Shared: EMT, Paramedic, Nursing (reviewed for all)</option><option value="both">EMT and Paramedic (reviewed for both)</option></select></label>
      <label className="field">Source type<select value={sourceType} onChange={(e) => setSourceType(e.target.value)}>{sourceTypes.map((type) => <option key={type} value={type}>{type.replaceAll('_', ' ')}</option>)}</select></label>
      <label className="field">Clinical subject<input value={uploadSubject} onChange={(e) => setUploadSubject(e.target.value)} placeholder="Airway & Breathing" maxLength={200} /></label>
      <label className="field">Edition / version<input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="Edition and publication year" maxLength={100} /></label>
    </div>
    <button type="button" className="primary" disabled={busy || !file || !uploadSubject.trim() || !version.trim()} onClick={upload}>Upload source for review</button>
    <div aria-live="polite">{status}</div>
    {sources.length === 0 && <p>No sources uploaded yet.</p>}
    {sources.map((source) => <article className="card" key={source.id}>
      <strong>{source.filename}</strong><span className="source-status">{source.status}</span>
      <p>{source.program} / {source.subject} / {source.version} / {source.status} / {source.page_count} pages / {source.chunk_count} passages</p>
      {source.error && <p role="alert">{source.error}</p>}
      {canApprove && source.can_manage && <div className="button-row">
        {source.status === 'uploaded' && <button type="button" className="primary" disabled={busy} onClick={() => action(source.id, 'approve')}>Approve and index</button>}
        {source.status === 'ready' && <button type="button" disabled={busy} onClick={() => action(source.id, 'reindex')}>Reindex for book generation</button>}
        {source.status === 'failed' && <button type="button" disabled={busy} onClick={() => action(source.id, 'retry')}>Retry indexing</button>}
        {source.status !== 'withdrawn' && <button type="button" className="ghost" disabled={busy} onClick={() => action(source.id, 'withdraw')}>Withdraw</button>}
      </div>}
    </article>)}
    <BookGenerationPanel sources={sources} />
    <h3>Check Question Bank evidence</h3>
    <label className="field">Source subject filter<select value={subject} onChange={(e) => { onSubjectChange(e.target.value); setPassages([]); }}>
      <option value="">All subjects</option>
      {[...new Set(sources.filter((source) => (source.program === program || source.program === 'all' || (program !== 'Nursing' && source.program === 'both'))).map((source) => source.subject))].sort().map((name) => <option key={name}>{name}</option>)}
    </select></label>
    <label className="field">Evidence search<input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Describe the topic to retrieve" /></label>
    <button type="button" className="ghost" onClick={preview} disabled={busy || !search.trim()}>Preview retrieved passages</button>
    {passages.map((passage) => <blockquote key={passage.chunk_id}><strong>{passage.source_document}, {passage.version}, PDF page {passage.page_number}</strong><p>{passage.text}</p></blockquote>)}
  </section>;
}
