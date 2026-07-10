import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { kes } from '../format';
import Loading from '../shared/Loading';

function ResourceList() {
  const [resources, setResources] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/elibrary').then((d) => setResources(d.resources)).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="alert">{error}</div>;
  if (!resources) return <Loading label="Loading the e-library…" />;

  return (
    <>
      <div className="page-head">
        <div><h1>E-Library</h1><div className="sub">Free guides plus high-value resources for Ksh 20 each</div></div>
      </div>
      <div className="form-grid">
        {resources.map((r) => (
          <Link key={r.resource_id} to={`/student/elibrary/${r.resource_id}`} style={{ textDecoration: 'none' }}>
            <div className="card">
              <h2>{r.title}</h2>
              <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 8 }}>{r.description}</p>
              <span className="badge draft">{r.category}</span>
              <div style={{ marginTop: 10, fontFamily: 'var(--font-mono)', fontWeight: 600, color: Number(r.price) > 0 ? 'var(--red)' : 'var(--success)' }}>
                {Number(r.price) > 0 ? kes(r.price) : 'Free'}
              </div>
            </div>
          </Link>
        ))}
        {resources.length === 0 && <p style={{ color: 'var(--ink-soft)' }}>No resources published yet.</p>}
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
  const [busy, setBusy] = useState(false);

  function load() {
    api(`/elibrary/${id}`).then((d) => { setResource(d.resource); setUnlocked(d.unlocked); });
  }
  useEffect(load, [id]);

  async function purchase() {
    setBusy(true); setStatus('');
    try {
      const res = await api('/payments/purchase', { method: 'POST', body: { itemType: 'elibrary_resource', itemId: id, phone } });
      setStatus(res.simulated ? 'Purchase simulated (dev mode) — download unlocked.' : 'Check your phone to complete the M-Pesa payment.');
      setTimeout(load, 1500);
    } catch (e) { setStatus(e.message); } finally { setBusy(false); }
  }

  async function downloadFree() {
    setBusy(true);
    try {
      await api(`/elibrary/${id}/download`, { method: 'POST' });
      window.open(resource.file_url || '#', '_blank');
    } catch (e) { setStatus(e.message); } finally { setBusy(false); }
  }

  if (!resource) return <Loading />;
  const free = Number(resource.price) <= 0;

  return (
    <>
      <div className="page-head"><h1>{resource.title}</h1></div>
      <div className="card">
        <p style={{ marginBottom: 6 }}>{resource.description}</p>
        <p style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginBottom: 12 }}>{resource.author && `By ${resource.author}`}</p>

        {free ? (
          <button className="primary" onClick={downloadFree} disabled={busy}>{busy ? 'Preparing…' : 'Download (free)'}</button>
        ) : unlocked ? (
          resource.file_url
            ? <a href={resource.file_url} target="_blank" rel="noreferrer"><button className="primary">Download</button></a>
            : <p style={{ color: 'var(--ink-soft)' }}>This resource's file hasn't been uploaded yet.</p>
        ) : (
          <>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="phone">M-Pesa phone number</label>
                <input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XX XXX XXX" />
              </div>
            </div>
            <button className="primary" onClick={purchase} disabled={busy || !phone}>
              {busy ? 'Processing…' : `Unlock for ${kes(resource.price)}`}
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
