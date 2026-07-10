import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import Loading from '../shared/Loading';

const CATEGORIES = ['Pharmacology', 'Education', 'EMS Systems', 'Trauma', 'Cardiology', 'Student Research', 'Other'];

function SubmitForm({ onDone }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', authors: '', abstract: '', category: 'Student Research', externalUrl: '' });
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  async function submit(e) {
    e.preventDefault();
    setError(''); setOk(false);
    if (!form.title.trim()) return setError('Title is required.');
    if (form.externalUrl && !/^https?:\/\//i.test(form.externalUrl)) {
      return setError('Link must start with https:// and point to a real source.');
    }
    setBusy(true);
    try {
      const { research } = await api('/research', { method: 'POST', body: form });
      if (file) {
        const fd = new FormData();
        fd.append('file', file);
        await api(`/research/${research.research_id}/file`, { method: 'POST', body: fd });
      }
      setOk(true);
      setForm({ title: '', authors: '', abstract: '', category: 'Student Research', externalUrl: '' });
      setFile(null);
      onDone?.();
    } catch (e2) { setError(e2.message); } finally { setBusy(false); }
  }

  if (!open) {
    return (
      <button className="primary" onClick={() => setOpen(true)} style={{ marginBottom: 20 }}>
        Submit your research
      </button>
    );
  }

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <h2>Submit your research</h2>
      <p style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginBottom: 14 }}>
        Case reviews, field write-ups, or papers you've authored. A teacher or admin reviews every
        submission before it appears publicly — it stays private to you until then.
      </p>
      <form onSubmit={submit}>
        <div className="field">
          <label>Title</label>
          <input value={form.title} onChange={(e) => set('title', e.target.value)} required />
        </div>
        <div className="form-grid">
          <div className="field">
            <label>Authors</label>
            <input value={form.authors} onChange={(e) => set('authors', e.target.value)} placeholder="Your name(s)" />
          </div>
          <div className="field">
            <label>Category</label>
            <select value={form.category} onChange={(e) => set('category', e.target.value)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="field">
          <label>Abstract / summary</label>
          <textarea rows="4" value={form.abstract} onChange={(e) => set('abstract', e.target.value)} />
        </div>
        <div className="field">
          <label>Link to source (optional — must be a real, working URL)</label>
          <input
            type="url"
            placeholder="https://..."
            value={form.externalUrl}
            onChange={(e) => set('externalUrl', e.target.value)}
          />
        </div>
        <div className="field">
          <label>Attach a file (optional — PDF/DOCX of your write-up)</label>
          <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </div>
        {error && <div className="error-note">{error}</div>}
        {ok && <div className="ok-note">Submitted — a teacher will review it shortly.</div>}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button className="primary" disabled={busy}>{busy ? 'Submitting…' : 'Submit for review'}</button>
          <button type="button" className="ghost" onClick={() => setOpen(false)}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

function MySubmissions({ refreshKey }) {
  const [items, setItems] = useState(null);

  useEffect(() => {
    api('/research/mine').then((d) => setItems(d.research)).catch(() => setItems([]));
  }, [refreshKey]);

  if (!items || items.length === 0) return null;

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <h2>Your submissions</h2>
      {items.map((r) => (
        <div key={r.research_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
          <span>{r.title}</span>
          <span className={`badge ${r.status === 'published' ? 'published' : 'pending'}`}>
            {r.status === 'published' ? 'Published' : 'Pending review'}
          </span>
        </div>
      ))}
    </div>
  );
}

function ResearchList() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    api('/research').then((d) => setItems(d.research)).catch((e) => setError(e.message));
  }, [refreshKey]);

  if (error) return <div className="alert">{error}</div>;

  return (
    <>
      <div className="page-head"><div><h1>Research</h1><div className="sub">Published studies, reviews, and student submissions — free to browse</div></div></div>

      <SubmitForm onDone={() => setRefreshKey((k) => k + 1)} />
      <MySubmissions refreshKey={refreshKey} />

      {!items ? <Loading label="Loading research…" /> : (
        <div className="form-grid">
          {items.map((r) => (
            <Link key={r.research_id} to={`/student/research/${r.research_id}`} style={{ textDecoration: 'none' }}>
              <div className="card">
                <h2>{r.title}</h2>
                <p style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginBottom: 6 }}>{r.authors}</p>
                <p style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{r.abstract?.slice(0, 120)}{r.abstract?.length > 120 ? '…' : ''}</p>
                <span className="badge draft" style={{ marginTop: 8, display: 'inline-block' }}>{r.category}</span>
              </div>
            </Link>
          ))}
          {items.length === 0 && <p style={{ color: 'var(--ink-soft)' }}>No research published yet.</p>}
        </div>
      )}
    </>
  );
}

function ResearchDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api(`/research/${id}`).then((d) => setItem(d.research)).catch((e) => setError(e.message));
  }, [id]);

  if (error) return <div className="alert">{error}</div>;
  if (!item) return <Loading />;

  return (
    <>
      <div className="page-head"><h1>{item.title}</h1></div>
      <div className="card">
        <p style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginBottom: 12 }}>
          {item.authors} {item.publication_date && `· ${new Date(item.publication_date).toLocaleDateString('en-KE')}`}
        </p>
        {item.status !== 'published' && (
          <div className="alert info" style={{ marginBottom: 12 }}>This submission is pending teacher review and isn't public yet.</div>
        )}
        <p style={{ marginBottom: 16 }}>{item.abstract}</p>
        {item.external_url && (
          <a href={item.external_url} target="_blank" rel="noreferrer"><button className="primary">Read full paper</button></a>
        )}
        {item.file_url && (
          <a href={item.file_url} target="_blank" rel="noreferrer" style={{ marginLeft: 10 }}><button className="ghost">Download file</button></a>
        )}
        {!item.external_url && !item.file_url && (
          <p style={{ color: 'var(--ink-soft)', fontSize: 13 }}>No link or file attached to this submission.</p>
        )}
      </div>
    </>
  );
}

export default function Research() {
  const { id } = useParams();
  return id ? <ResearchDetail /> : <ResearchList />;
}
