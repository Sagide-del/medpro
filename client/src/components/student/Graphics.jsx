import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { kes } from '../format';
import Loading from '../shared/Loading';

function GraphicList() {
  const [graphics, setGraphics] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/graphics').then((d) => setGraphics(d.graphics)).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="alert">{error}</div>;
  if (!graphics) return <Loading label="Loading graphics…" />;

  return (
    <>
      <div className="page-head">
        <div><h1>Medical graphics</h1><div className="sub">Ksh 10 each &middot; interactive anatomy, ECG strips, and pathophysiology</div></div>
      </div>
      <div className="form-grid">
        {graphics.map((g) => (
          <Link key={g.graphic_id} to={`/student/graphics/${g.graphic_id}`} style={{ textDecoration: 'none' }}>
            <div className="card">
              {g.thumbnail_url && <img src={g.thumbnail_url} alt="" style={{ width: '100%', borderRadius: 8, marginBottom: 10 }} />}
              <h2>{g.title}</h2>
              <span className="badge draft">{g.graphic_type}</span>
              <div style={{ marginTop: 10, fontFamily: 'var(--font-mono)', color: 'var(--red)', fontWeight: 600 }}>{kes(g.price)}</div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}

function GraphicDetail() {
  const { id } = useParams();
  const [graphic, setGraphic] = useState(null);
  const [unlocked, setUnlocked] = useState(false);
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  function load() {
    api(`/graphics/${id}`).then((d) => { setGraphic(d.graphic); setUnlocked(d.unlocked); });
  }
  useEffect(load, [id]);

  async function purchase() {
    setBusy(true); setStatus('');
    try {
      const res = await api('/payments/purchase', { method: 'POST', body: { itemType: 'graphic', itemId: id, phone } });
      setStatus(res.simulated ? 'Purchase simulated (dev mode) — access granted.' : 'Check your phone to complete the M-Pesa payment.');
      setTimeout(load, 1500);
    } catch (e) { setStatus(e.message); } finally { setBusy(false); }
  }

  if (!graphic) return <Loading />;

  return (
    <>
      <div className="page-head"><h1>{graphic.title}</h1></div>
      <div className="card">
        <p style={{ marginBottom: 12 }}>{graphic.description}</p>
        {unlocked ? (
          graphic.file_url
            ? <img src={graphic.file_url} alt={graphic.title} style={{ width: '100%', borderRadius: 8 }} />
            : <p style={{ color: 'var(--ink-soft)' }}>This graphic hasn't had its file uploaded yet.</p>
        ) : (
          <>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="phone">M-Pesa phone number</label>
                <input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XX XXX XXX" />
              </div>
            </div>
            <button className="primary" onClick={purchase} disabled={busy || !phone}>
              {busy ? 'Processing…' : `Unlock for ${kes(graphic.price)}`}
            </button>
            {status && <div className="ok-note">{status}</div>}
          </>
        )}
      </div>
    </>
  );
}

export default function Graphics() {
  const { id } = useParams();
  return id ? <GraphicDetail /> : <GraphicList />;
}
