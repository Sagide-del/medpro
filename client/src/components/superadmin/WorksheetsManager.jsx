import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { kes } from '../format';

const CATEGORIES = ['Cardiology', 'Pharmacology', 'Airway', 'Trauma', 'Pediatrics', 'Obstetrics', 'Neurology', 'Operations'];
const BLOOM_LEVELS = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'];

export default function WorksheetsManager() {
  const [worksheets, setWorksheets] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', category: 'Cardiology', difficulty: 'intermediate', bloomLevel: 'apply', price: 10, timeLimitMinutes: 30, passingScorePct: 70 });
  const [questions, setQuestions] = useState([]);
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  // See FlashcardsManager.jsx for why this is Promise.all'd into one
  // setWorksheets call rather than two separate replace/append calls.
  function load() {
    Promise.all([
      api('/worksheets?status=draft').catch(() => ({ worksheets: [] })),
      api('/worksheets?status=published').catch(() => ({ worksheets: [] })),
    ]).then(([draft, published]) => {
      setWorksheets([...(draft.worksheets || []), ...(published.worksheets || [])]);
    });
  }
  useEffect(load, []);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        const qs = Array.isArray(parsed) ? parsed : parsed.questions;
        setQuestions(qs || []);
        setStatus({ kind: 'ok', text: `${qs?.length || 0} questions loaded.` });
      } catch {
        setStatus({ kind: 'err', text: 'Invalid JSON file.' });
      }
    };
    reader.readAsText(file);
  }

  async function create(publish) {
    setBusy(true); setStatus(null);
    try {
      const { worksheet } = await api('/worksheets', {
        method: 'POST',
        body: { ...form, price: Number(form.price), timeLimitMinutes: Number(form.timeLimitMinutes), passingScorePct: Number(form.passingScorePct), questions },
      });
      if (publish) await api(`/worksheets/${worksheet.worksheet_id}/publish`, { method: 'PATCH' });
      setStatus({ kind: 'ok', text: `"${form.title}" ${publish ? 'created and published' : 'saved as draft'}.` });
      setForm({ ...form, title: '', description: '' });
      setQuestions([]);
      load();
    } catch (e) { setStatus({ kind: 'err', text: e.message }); } finally { setBusy(false); }
  }

  async function publish(id) { await api(`/worksheets/${id}/publish`, { method: 'PATCH' }); load(); }
  async function remove(id) {
    if (!confirm('Delete this worksheet? This cannot be undone.')) return;
    await api(`/worksheets/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <>
      <div className="page-head"><div><h1>Worksheets</h1><div className="sub">Ksh 10 each</div></div></div>

      <div className="card">
        <h2>Create a worksheet</h2>
        <div className="form-grid">
          <div className="field"><label>Title</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="field"><label>Category</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
          </div>
          <div className="field"><label>Bloom's level</label>
            <select value={form.bloomLevel} onChange={(e) => setForm({ ...form, bloomLevel: e.target.value })}>{BLOOM_LEVELS.map((b) => <option key={b}>{b}</option>)}</select>
          </div>
          <div className="field"><label>Price (KES)</label><input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
          <div className="field"><label>Time limit (minutes)</label><input type="number" value={form.timeLimitMinutes} onChange={(e) => setForm({ ...form, timeLimitMinutes: e.target.value })} /></div>
          <div className="field"><label>Passing score (%)</label><input type="number" value={form.passingScorePct} onChange={(e) => setForm({ ...form, passingScorePct: e.target.value })} /></div>
        </div>
        <div className="field"><label>Description</label><textarea rows="2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div className="field"><label>Questions JSON ([{"{"}"prompt","correctAnswer","points"{"}"}])</label><input type="file" accept=".json" onChange={handleFile} /></div>
        {questions.length > 0 && <p style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{questions.length} questions ready to import.</p>}
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="primary" onClick={() => create(true)} disabled={busy || !form.title}>{busy ? 'Saving…' : 'Create and publish'}</button>
          <button className="ghost" onClick={() => create(false)} disabled={busy || !form.title}>Save as draft</button>
        </div>
        {status && <div className={status.kind === 'ok' ? 'ok-note' : 'error-note'}>{status.text}</div>}
      </div>

      <div className="card">
        <h2>All worksheets</h2>
        <table>
          <thead><tr><th>Title</th><th>Category</th><th>Price</th><th>Purchases</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {worksheets.map((w) => (
              <tr key={w.worksheet_id}>
                <td>{w.title}</td><td>{w.category}</td><td className="num">{kes(w.price)}</td><td className="num">{w.purchase_count}</td>
                <td><span className={`badge ${w.status}`}>{w.status}</span></td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  {w.status === 'draft' && <button className="ghost" onClick={() => publish(w.worksheet_id)}>Publish</button>}{' '}
                  <button className="ghost danger" onClick={() => remove(w.worksheet_id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
