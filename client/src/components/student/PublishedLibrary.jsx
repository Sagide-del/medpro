import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import UiIcon from '../shared/UiIcon';

// Render generated material as text, never executable HTML.
function ContentText({ value }) {
  if (value == null) return null;
  if (typeof value !== 'object') return <p style={{ whiteSpace: 'pre-wrap' }}>{String(value)}</p>;
  if (Array.isArray(value)) return value.map((item, index) => <ContentText key={index} value={item} />);
  return Object.entries(value).filter(([key]) => !['id', 'source_item_id'].includes(key)).map(([key, item]) => <section key={key}><h3>{key.replace(/_/g, ' ')}</h3><ContentText value={item} /></section>);
}

export default function PublishedLibrary({ destination, title }) {
  const { user } = useAuth();
  const program = user?.program || 'EMT';
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [response, setResponse] = useState('');
  const [saved, setSaved] = useState('');
  const [busy, setBusy] = useState(false);
  const assessment = destination.startsWith('psychometric_');
  async function submit(event) {
    event.preventDefault(); setBusy(true); setSaved('');
    try {
      await api(`/published-content/${selected}/responses`, { method: 'POST', body: { program, response } });
      setSaved('Response saved for review.'); setResponse('');
    } catch (err) { setSaved(err.message); } finally { setBusy(false); }
  }
  useEffect(() => {
    let active = true;
    setItems([]); setSelected(null); setError(''); setLoading(true);
    const refresh = () => api(`/published-content?program=${encodeURIComponent(program)}&destination=${encodeURIComponent(destination)}`)
      .then((data) => { if (active) { setItems(data.content || []); setError(''); } })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    refresh();
    window.addEventListener('focus', refresh);
    return () => { active = false; window.removeEventListener('focus', refresh); };
  }, [program, destination]);
  const visible = items.filter((item) => `${item.title} ${item.topic || ''}`.toLowerCase().includes(search.toLowerCase()));
  const current = items.find((item) => item.id === selected);
  return <div className="resource-library-v2">
    <header className="resource-library-v2-head"><div><span className="platform-eyebrow">{program} Resources</span><h1>{title}</h1></div><span className="resource-library-v2-count">{items.length} resources</span></header>
    {error && <p role="alert">{error}</p>}
    {current ? <article className="resource-library-v2-card"><button type="button" onClick={() => { setSelected(null); setResponse(''); setSaved(''); }}>Back to library</button><h2>{current.title}</h2><ContentText value={current.content_json} />{assessment && <form onSubmit={submit}><label>Your response<textarea required maxLength={20000} value={response} onChange={(event) => setResponse(event.target.value)} /></label><button type="submit" disabled={busy}>{busy ? 'Saving...' : 'Submit response'}</button><p role="status">{saved}</p></form>}{current.source_citation && <p>Source: {current.source_citation}</p>}</article> : <section className="resource-library-v2-browse">
      <div className="resource-library-v2-browse-head"><h2>Browse library</h2><label><UiIcon name="question" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${title.toLowerCase()}...`} /></label></div>
      {loading ? <p>Loading resources...</p> : <div className="resource-library-v2-grid">{visible.map((item) => <article className="resource-library-v2-card" key={item.id}><span className="resource-library-v2-icon"><UiIcon name="document" /></span><span className="platform-eyebrow">{item.topic}</span><h3>{item.title}</h3><button type="button" onClick={() => setSelected(item.id)}>Open resource <UiIcon name="arrowRight" /></button></article>)}</div>}
      {!loading && !error && !visible.length && <p>No published {program} resources are available here yet.</p>}
    </section>}
  </div>;
}
