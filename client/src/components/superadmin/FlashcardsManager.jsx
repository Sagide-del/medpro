import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { kes } from '../format';

const CATEGORIES = ['Cardiology', 'Pharmacology', 'Airway', 'Trauma', 'Pediatrics', 'Obstetrics', 'Neurology', 'Operations'];

function parseCsv(text) {
  return text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).map((line) => {
    const cols = line.match(/("([^"]|"")*"|[^,]+)/g)?.map((c) => c.replace(/^"|"$/g, '').replace(/""/g, '"').trim()) || [];
    return { front: cols[0], back: cols[1], imageUrl: cols[2] || null };
  }).filter((c) => c.front && c.back && c.front.toLowerCase() !== 'front');
}

export default function FlashcardsManager() {
  const [decks, setDecks] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', category: 'Cardiology', difficulty: 'intermediate', price: 10 });
  const [cards, setCards] = useState([]);
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  // Combine both fetches into a single setDecks call. The previous version
  // set draft (replace) and published (append onto prev) separately — if
  // load() ever ran twice (React's dev-mode effect double-invoke, or being
  // called again after create/publish/delete), the published half kept
  // appending onto itself, producing duplicate rows/keys in the table.
  function load() {
    Promise.all([
      api('/flashcards?status=draft').catch(() => ({ decks: [] })),
      api('/flashcards?status=published').catch(() => ({ decks: [] })),
    ]).then(([draft, published]) => {
      setDecks([...(draft.decks || []), ...(published.decks || [])]);
    });
  }
  useEffect(load, []);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = parseCsv(reader.result);
      setCards(parsed);
      setStatus({ kind: 'ok', text: `${parsed.length} cards loaded.` });
    };
    reader.readAsText(file);
  }

  async function create(publish) {
    setBusy(true); setStatus(null);
    try {
      const { deck } = await api('/flashcards', { method: 'POST', body: { ...form, price: Number(form.price), cards } });
      if (publish) await api(`/flashcards/${deck.deck_id}/publish`, { method: 'PATCH' });
      setStatus({ kind: 'ok', text: `"${form.title}" ${publish ? 'created and published' : 'saved as draft'}.` });
      setForm({ ...form, title: '', description: '' });
      setCards([]);
      load();
    } catch (e) { setStatus({ kind: 'err', text: e.message }); } finally { setBusy(false); }
  }

  async function publish(id) {
    await api(`/flashcards/${id}/publish`, { method: 'PATCH' });
    load();
  }
  async function remove(id) {
    if (!confirm('Delete this deck? This cannot be undone.')) return;
    await api(`/flashcards/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <>
      <div className="page-head"><div><h1>Flashcard decks</h1><div className="sub">Ksh 10 per deck</div></div></div>

      <div className="card">
        <h2>Create a deck</h2>
        <div className="form-grid">
          <div className="field"><label>Title</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="field"><label>Category</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="field"><label>Difficulty</label>
            <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
              <option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option>
            </select>
          </div>
          <div className="field"><label>Price (KES)</label><input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
        </div>
        <div className="field"><label>Description</label><textarea rows="2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div className="field"><label>Cards CSV (front,back,image_url)</label><input type="file" accept=".csv" onChange={handleFile} /></div>
        {cards.length > 0 && <p style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{cards.length} cards ready to import.</p>}
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="primary" onClick={() => create(true)} disabled={busy || !form.title}>{busy ? 'Saving…' : 'Create and publish'}</button>
          <button className="ghost" onClick={() => create(false)} disabled={busy || !form.title}>Save as draft</button>
        </div>
        {status && <div className={status.kind === 'ok' ? 'ok-note' : 'error-note'}>{status.text}</div>}
      </div>

      <div className="card">
        <h2>All decks</h2>
        <table>
          <thead><tr><th>Title</th><th>Category</th><th>Cards</th><th>Price</th><th>Purchases</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {decks.map((d) => (
              <tr key={d.deck_id}>
                <td>{d.title}</td><td>{d.category}</td><td className="num">{d.card_count}</td>
                <td className="num">{kes(d.price)}</td><td className="num">{d.purchase_count}</td>
                <td><span className={`badge ${d.status}`}>{d.status}</span></td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  {d.status === 'draft' && <button className="ghost" onClick={() => publish(d.deck_id)}>Publish</button>}{' '}
                  <button className="ghost danger" onClick={() => remove(d.deck_id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
