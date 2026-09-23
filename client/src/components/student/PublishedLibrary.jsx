import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api, mediaUrl } from '../../services/api';
import UiIcon from '../shared/UiIcon';
import { useSearchParams } from 'react-router-dom';

// Render generated material as text, never executable HTML.
function ContentText({ value }) {
  if (value == null) return null;
  if (typeof value !== 'object') return <p style={{ whiteSpace: 'pre-wrap' }}>{String(value)}</p>;
  if (Array.isArray(value)) return value.map((item, index) => <ContentText key={index} value={item} />);
  return Object.entries(value).filter(([key]) => !['id', 'source_item_id', 'source_reference', 'source_references', 'validation_status', 'media_url', 'media_type', 'cards'].includes(key)).map(([key, item]) => <section key={key}><h3>{key.replace(/_/g, ' ')}</h3><ContentText value={item} /></section>);
}

function Flashcard({ card }) {
  const [revealed, setRevealed] = useState(false);
  return <section className="resource-library-v2-card"><h3>{card.front}</h3>{revealed && <p>{card.back}</p>}<button type="button" onClick={() => setRevealed(!revealed)}>{revealed ? 'Hide answer' : 'Show answer'}</button></section>;
}

export default function PublishedLibrary({ destination, title }) {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const requestedId = searchParams.get('id');
  const program = user?.program || 'EMT';
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [response, setResponse] = useState('');
  const [saved, setSaved] = useState('');
  const [busy, setBusy] = useState(false);
  const submissionToken = useRef(null);
  const submissionContext = useRef(0);
  const [submissions, setSubmissions] = useState([]);
  const assessment = destination.startsWith('psychometric_');
  async function submit(event) {
    event.preventDefault(); setBusy(true); setSaved('');
    const context = submissionContext.current;
    try {
      const key = JSON.stringify([program, selected, response]);
      if (submissionToken.current?.key !== key) submissionToken.current = { key, token: crypto.randomUUID() };
      const result = await api(`/published-content/${selected}/responses`, { method: 'POST', body: { program, response, clientToken: submissionToken.current.token } });
      if (context !== submissionContext.current) return;
      setSaved(result.status === 'awaiting_review' ? 'Response saved for review.' : `${result.status === 'provisional' ? 'Provisional educational feedback (requires review)' : 'Score'}: ${result.submission.score ?? '--'}%. ${result.submission.feedback || ''}`);
      setSubmissions((current) => [{ ...result.submission, content_id: selected, grading_status: result.status }, ...current.filter((item) => item.id !== result.submission.id)]);
      setResponse(''); submissionToken.current = null;
    } catch (err) { if (context === submissionContext.current) setSaved(err.message); }
    finally { if (context === submissionContext.current) setBusy(false); }
  }
  useEffect(() => {
    let active = true;
    submissionContext.current += 1;
    setBusy(false);
    setItems([]); setSelected(requestedId); setError(''); setLoading(true);
    setSubmissions([]); setSaved(''); setResponse(''); submissionToken.current = null;
    if (assessment) api(`/published-content/responses?program=${encodeURIComponent(program)}`)
      .then((data) => { if (active) setSubmissions(data.submissions || []); }).catch((err) => { if (active) setError(err.message); });
    const refresh = () => api(`/published-content?program=${encodeURIComponent(program)}&destination=${encodeURIComponent(destination)}`)
      .then((data) => { if (active) { setItems(data.content || []); setError(''); } })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    refresh();
    window.addEventListener('focus', refresh);
    return () => { active = false; submissionContext.current += 1; window.removeEventListener('focus', refresh); };
  }, [program, destination, assessment, requestedId]);
  const visible = items.filter((item) => `${item.title} ${item.topic || ''}`.toLowerCase().includes(search.toLowerCase()));
  const current = items.find((item) => item.id === selected);
  return <div className="resource-library-v2">
    <header className="resource-library-v2-head"><div><span className="platform-eyebrow">{program} Resources</span><h1>{title}</h1></div><span className="resource-library-v2-count">{items.length} resources</span></header>
    {error && <p role="alert">{error}</p>}
    {current ? <article className="resource-library-v2-card">
      <button type="button" disabled={busy} onClick={() => { setSelected(null); setResponse(''); setSaved(''); submissionToken.current = null; }}>Back to library</button>
      <h2>{current.title}</h2><ContentText value={current.content_json} />
      {mediaUrl(current.content_json.media_url) && current.content_json.media_type?.startsWith('video/') && <video src={mediaUrl(current.content_json.media_url)} controls preload="metadata" style={{ width: '100%' }} />}
      {mediaUrl(current.content_json.media_url) && current.content_json.media_type?.startsWith('image/') && <img src={mediaUrl(current.content_json.media_url)} alt={current.title} style={{ maxWidth: '100%' }} />}
      {Array.isArray(current.content_json.cards) && current.content_json.cards.map((card, index) => <Flashcard key={`${current.id}-${index}`} card={card} />)}
      {assessment && <form onSubmit={submit}>
        {current.content_json.options?.length ? <fieldset><legend>Your answer</legend>{current.content_json.options.map((option, index) => {
          const text = typeof option === 'string' ? option : option.text;
          return <label key={index}><input type="radio" name="answer" required value={text} checked={response === text} onChange={(event) => setResponse(event.target.value)} />{text}</label>;
        })}</fieldset> : <label>Your response<textarea required maxLength={20000} value={response} onChange={(event) => setResponse(event.target.value)} /></label>}
        <button type="submit" disabled={busy || !response.trim()}>{busy ? 'Saving and reviewing...' : 'Submit response'}</button><p role="status">{saved}</p>
      </form>}
      {assessment && submissions.filter((item) => item.content_id === current.id).map((item) => <p key={item.id}>Saved {new Date(item.submitted_at).toLocaleString()}: {item.grading_status}{item.score != null ? ` (${item.score}%)` : ''}. {item.feedback}</p>)}
      {current.source_citation && <p>Source: {current.source_citation}</p>}
    </article> : <section className="resource-library-v2-browse">
      <div className="resource-library-v2-browse-head"><h2>Browse library</h2><label><UiIcon name="question" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${title.toLowerCase()}...`} /></label></div>
      {loading ? <p>Loading resources...</p> : <div className="resource-library-v2-grid">{visible.map((item) => <article className="resource-library-v2-card" key={item.id}><span className="resource-library-v2-icon"><UiIcon name="document" /></span><span className="platform-eyebrow">{item.topic}</span><h3>{item.title}</h3><button type="button" onClick={() => setSelected(item.id)}>Open resource <UiIcon name="arrowRight" /></button></article>)}</div>}
      {!loading && !error && !visible.length && <p>No published {program} resources are available here yet.</p>}
    </section>}
  </div>;
}
