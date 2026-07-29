import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { kes } from '../format';
import Loading from '../shared/Loading';

const RESEARCH_CATEGORIES = [
  'EMS Systems',
  'Clinical Practice',
  'Trauma',
  'Cardiology',
  'Education',
  'Quality Improvement',
  'Student Research',
  'Other',
];

function ResearchSubmissionCard({ onSubmitted }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({
    title: '',
    authors: '',
    abstract: '',
    category: 'Student Research',
    externalUrl: '',
  });

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setMessage('');

    if (!form.title.trim()) {
      setMessage('Title is required.');
      return;
    }

    if (form.externalUrl && !/^https?:\/\/[^\s]+$/i.test(form.externalUrl)) {
      setMessage('External link must be a valid https:// URL.');
      return;
    }

    setBusy(true);
    try {
      const { research } = await api('/research', { method: 'POST', body: form });
      if (file) {
        const fd = new FormData();
        fd.append('file', file);
        await api(`/research/${research.research_id}/file`, { method: 'POST', body: fd });
      }
      setMessage('Submitted for tutor review.');
      setForm({
        title: '',
        authors: '',
        abstract: '',
        category: 'Student Research',
        externalUrl: '',
      });
      setFile(null);
      onSubmitted?.();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card">
      <div className="section-head">
        <div>
          <h2>Submit research</h2>
        </div>
      </div>

      {!open ? (
        <button type="button" className="primary" onClick={() => setOpen(true)}>
          Upload project or report
        </button>
      ) : (
        <form onSubmit={submit}>
          <div className="form-grid">
            <div className="field">
              <label>Title</label>
              <input value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="Patient assessment audit" />
            </div>
            <div className="field">
              <label>Category</label>
              <select value={form.category} onChange={(e) => update('category', e.target.value)}>
                {RESEARCH_CATEGORIES.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-grid">
            <div className="field">
              <label>Authors</label>
              <input value={form.authors} onChange={(e) => update('authors', e.target.value)} placeholder="Your name or group" />
            </div>
            <div className="field">
              <label>Reference link</label>
              <input
                value={form.externalUrl}
                onChange={(e) => update('externalUrl', e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="field">
            <label>Abstract</label>
            <textarea
              rows="4"
              value={form.abstract}
              onChange={(e) => update('abstract', e.target.value)}
              placeholder="Short summary of the project or report."
            />
          </div>

          <div className="field">
            <label>Attach file</label>
            <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>

          {message && <div className={message.includes('Submitted') ? 'ok-note' : 'alert'}>{message}</div>}

          <div className="logbook-actions">
            <button type="submit" className="primary" disabled={busy}>
              {busy ? 'Submitting...' : 'Submit for review'}
            </button>
            <button type="button" className="ghost" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

function MyResearch({ refreshKey }) {
  const [items, setItems] = useState(null);

  useEffect(() => {
    api('/research/mine').then((data) => setItems(data.research)).catch(() => setItems([]));
  }, [refreshKey]);

  if (!items || items.length === 0) return null;

  return (
    <section className="card">
      <div className="section-head">
        <div>
          <h2>Your submissions</h2>
        </div>
      </div>

      <div className="dashboard-list">
        {items.map((item) => (
          <div key={item.research_id} className="dashboard-list-item">
            <div>
              <div className="dashboard-list-title">{item.title}</div>
              <div className="dashboard-list-sub">{item.category}</div>
            </div>
            <span className={`badge ${item.status === 'published' ? 'published' : 'pending'}`}>
              {item.status === 'published' ? 'Published' : 'Pending review'}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function PublishedResearch() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/research')
      .then((data) => setItems(data.research))
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="alert">{error}</div>;
  if (!items) return <Loading label="Loading research library..." />;

  return (
    <section className="card">
      <div className="section-head">
        <div>
          <h2>Published student research</h2>
        </div>
      </div>

      <div className="form-grid">
        {items.map((item) => (
          <Link key={item.research_id} to={`/student/research/${item.research_id}`} style={{ textDecoration: 'none' }}>
            <div className="card research-card">
              <h3>{item.title}</h3>
              <p className="research-authors">{item.authors || 'Submitted by student'}</p>
              <p className="research-abstract">
                {item.abstract?.slice(0, 140)}
                {item.abstract?.length > 140 ? '…' : ''}
              </p>
              <span className="badge draft">{item.category}</span>
            </div>
          </Link>
        ))}
        {items.length === 0 && <p className="sub">No published student research yet.</p>}
      </div>
    </section>
  );
}

function ResourceList() {
  const [resources, setResources] = useState(null);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    api('/elibrary')
      .then((data) => setResources(data.resources))
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="alert">{error}</div>;
  if (!resources) return <Loading label="Loading e-library..." />;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>E-Library</h1>
          <div className="sub">Clinical resources, student research, and peer learning in one place.</div>
        </div>
      </div>

      <section className="card">
        <div className="section-head">
          <div>
            <h2>Published resources</h2>
          </div>
        </div>

        <div className="form-grid">
          {resources.map((resource) => (
            <Link
              key={resource.resource_id}
              to={`/student/elibrary/${resource.resource_id}`}
              style={{ textDecoration: 'none' }}
            >
              <div className="card research-card">
                <h3>{resource.title}</h3>
                <p className="research-abstract">{resource.description}</p>
                <span className="badge draft">{resource.resource_type}</span>
                <p className="research-authors"><b>Category:</b> {resource.category}</p>
                <strong>{Number(resource.price) > 0 ? kes(resource.price) : 'Free'}</strong>
              </div>
            </Link>
          ))}
          {resources.length === 0 && <p className="sub">No published resources available.</p>}
        </div>
      </section>

      <ResearchArea refreshKey={refreshKey} onSubmitted={() => setRefreshKey((value) => value + 1)} />
    </>
  );
}

function ResearchArea({ refreshKey, onSubmitted }) {
  return (
    <>
      <div style={{ marginTop: 20 }}>
        <ResearchSubmissionCard onSubmitted={onSubmitted} />
      </div>
      <div style={{ marginTop: 20 }}>
        <MyResearch refreshKey={refreshKey} />
      </div>
      <div style={{ marginTop: 20 }}>
        <PublishedResearch />
      </div>
    </>
  );
}

function ResourceDetail() {
  const { id } = useParams();
  const [resource, setResource] = useState(null);
  const [unlocked, setUnlocked] = useState(false);
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('');

  function load() {
    api(`/elibrary/${id}`)
      .then((data) => {
        setResource(data.resource);
        setUnlocked(data.unlocked);
      });
  }

  useEffect(load, [id]);

  async function purchase() {
    try {
      const res = await api('/payments/purchase', {
        method: 'POST',
        body: {
          itemType: 'elibrary_resource',
          itemId: id,
          phone,
        },
      });

      setStatus(res.simulated ? 'Unlocked successfully.' : 'Complete payment on your phone.');
      setTimeout(load, 1500);
    } catch (error) {
      setStatus(error.message);
    }
  }

  if (!resource) return <Loading />;

  const free = Number(resource.price) <= 0;

  return (
    <>
      <div className="page-head">
        <h1>{resource.title}</h1>
      </div>

      <div className="card">
        <p>{resource.description}</p>

        {resource.author && <p><b>Author:</b> {resource.author}</p>}
        {resource.journal && <p><b>Journal:</b> {resource.journal}</p>}
        {resource.doi && <p><b>DOI:</b> {resource.doi}</p>}
        {resource.evidence_level && <p><b>Evidence:</b> {resource.evidence_level}</p>}

        {free || unlocked ? (
          resource.file_url ? (
            <a href={resource.file_url} target="_blank" rel="noreferrer">
              <button type="button" className="primary">Open Resource</button>
            </a>
          ) : resource.external_url ? (
            <a href={resource.external_url} target="_blank" rel="noreferrer">
              <button type="button" className="primary">View Article</button>
            </a>
          ) : (
            <p>Resource file not available yet.</p>
          )
        ) : (
          <>
            <input placeholder="M-Pesa phone number" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <button type="button" className="primary" onClick={purchase}>
              Unlock {kes(resource.price)}
            </button>
          </>
        )}

        {status && <div className="ok-note">{status}</div>}
      </div>
    </>
  );
}

export default function ELibrary() {
  const { id } = useParams();
  return id ? <ResourceDetail /> : <ResourceList />;
}
