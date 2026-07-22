import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { kes } from '../format';
import Loading from '../shared/Loading';

function GraphicList() {
  const [graphics, setGraphics] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/graphics').then((data) => setGraphics(data.graphics)).catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="alert">{error}</div>;
  if (!graphics) return <Loading label="Loading clinical reference cards..." />;

  return (
    <>
      <div className="page-head">
        <div><h1>Clinical Reference Cards</h1><div className="sub">Ksh 10 each &middot; anatomy, ECG, and procedure reference material</div></div>
      </div>
      <div className="form-grid">
        {graphics.map((graphic) => (
          <Link key={graphic.graphic_id} to={`/student/reference-cards/${graphic.graphic_id}`} style={{ textDecoration: 'none' }}>
            <div className="card">
              {graphic.thumbnail_url && <img src={graphic.thumbnail_url} alt="" style={{ width: '100%', borderRadius: 8, marginBottom: 10 }} />}
              <h2>{graphic.title}</h2>
              <span className="badge draft">{graphic.graphic_type}</span>
              <div style={{ marginTop: 10, fontFamily: 'var(--font-mono)', color: 'var(--red)', fontWeight: 600 }}>{kes(graphic.price)}</div>
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
    api(`/graphics/${id}`).then((data) => { setGraphic(data.graphic); setUnlocked(data.unlocked); });
  }

  useEffect(load, [id]);

  async function purchase() {
    setBusy(true);
    setStatus('');
    try {
      const response = await api('/payments/purchase', { method: 'POST', body: { itemType: 'graphic', itemId: id, phone } });
      setStatus(response.simulated ? 'Purchase simulated (dev mode) - access granted.' : 'Check your phone to complete the M-Pesa payment.');
      setTimeout(load, 1500);
    } catch (err) {
      setStatus(err.message);
    } finally {
      setBusy(false);
    }
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
            : <p style={{ color: 'var(--ink-soft)' }}>This reference card has not had its file uploaded yet.</p>
        ) : (
          <>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="phone">M-Pesa phone number</label>
                <input id="phone" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="07XX XXX XXX" />
              </div>
            </div>
            <button className="primary" onClick={purchase} disabled={busy || !phone}>
              {busy ? 'Processing...' : `Unlock for ${kes(graphic.price)}`}
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
