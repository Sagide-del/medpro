import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { kes } from '../format';

const CATEGORIES = ['Cardiology', 'Pharmacology', 'Airway', 'Trauma', 'Pediatrics', 'Obstetrics', 'Neurology', 'Operations'];
const GRAPHIC_TYPES = ['ECG Strip', '3D Anatomy', 'Procedure', 'Pathophysiology', 'Medication'];

export default function GraphicsManager() {
  const [graphics, setGraphics] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', category: 'Cardiology', graphicType: 'ECG Strip', price: 10, tags: '' });
  const [file, setFile] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  // See FlashcardsManager.jsx for why this is Promise.all'd into one
  // setGraphics call rather than two separate replace/append calls.
  function load() {
    Promise.all([
      api('/graphics?status=draft').catch(() => ({ graphics: [] })),
      api('/graphics?status=published').catch(() => ({ graphics: [] })),
    ]).then(([draft, published]) => {
      setGraphics([...(draft.graphics || []), ...(published.graphics || [])]);
    });
  }
  useEffect(load, []);

  async function create(publish) {
    setBusy(true); setStatus(null);
    try {
      const { graphic } = await api('/graphics', {
        method: 'POST',
        body: { ...form, price: Number(form.price), tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean) },
      });
      if (file || thumbnail) {
        const fd = new FormData();
        if (file) fd.append('file', file);
        if (thumbnail) fd.append('thumbnail', thumbnail);
        await api(`/graphics/${graphic.graphic_id}/files`, { method: 'POST', body: fd });
      }
      if (publish) await api(`/graphics/${graphic.graphic_id}/publish`, { method: 'PATCH' });
      setStatus({ kind: 'ok', text: `"${form.title}" ${publish ? 'created and published' : 'saved as draft'}.` });
      setForm({ ...form, title: '', description: '', tags: '' });
      setFile(null); setThumbnail(null);
      load();
    } catch (e) { setStatus({ kind: 'err', text: e.message }); } finally { setBusy(false); }
  }

  async function publish(id) { await api(`/graphics/${id}/publish`, { method: 'PATCH' }); load(); }
  async function remove(id) {
    if (!confirm('Delete this graphic? This cannot be undone.')) return;
    await api(`/graphics/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <>
      <div className="page-head"><div><h1>Medical graphics</h1><div className="sub">Ksh 10 each</div></div></div>

      <div className="card">
        <h2>Upload a graphic</h2>
        <div className="form-grid">
          <div className="field"><label>Title</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="field"><label>Category</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
          </div>
          <div className="field"><label>Graphic type</label>
            <select value={form.graphicType} onChange={(e) => setForm({ ...form, graphicType: e.target.value })}>{GRAPHIC_TYPES.map((c) => <option key={c}>{c}</option>)}</select>
          </div>
          <div className="field"><label>Price (KES)</label><input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
          <div className="field"><label>Tags (comma separated)</label><input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} /></div>
        </div>
        <div className="field"><label>Description</label><textarea rows="2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div className="form-grid">
          <div className="field"><label>Main file</label><input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} /></div>
          <div className="field"><label>Thumbnail</label><input type="file" accept="image/*" onChange={(e) => setThumbnail(e.target.files?.[0] || null)} /></div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="primary" onClick={() => create(true)} disabled={busy || !form.title}>{busy ? 'Saving…' : 'Upload and publish'}</button>
          <button className="ghost" onClick={() => create(false)} disabled={busy || !form.title}>Save as draft</button>
        </div>
        {status && <div className={status.kind === 'ok' ? 'ok-note' : 'error-note'}>{status.text}</div>}
      </div>

      <div className="card">
        <h2>All graphics</h2>
        <table>
          <thead><tr><th>Title</th><th>Type</th><th>Price</th><th>Views</th><th>Purchases</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {graphics.map((g) => (
              <tr key={g.graphic_id}>
                <td>{g.title}</td><td>{g.graphic_type}</td><td className="num">{kes(g.price)}</td>
                <td className="num">{g.view_count}</td><td className="num">{g.purchase_count}</td>
                <td><span className={`badge ${g.status}`}>{g.status}</span></td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  {g.status === 'draft' && <button className="ghost" onClick={() => publish(g.graphic_id)}>Publish</button>}{' '}
                  <button className="ghost danger" onClick={() => remove(g.graphic_id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
