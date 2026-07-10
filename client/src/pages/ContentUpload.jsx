import { useState } from 'react';
import { api } from '../api/client';

const CATEGORIES = ['Cardiology', 'Pharmacology', 'Airway', 'Trauma', 'Pediatrics', 'Obstetrics', 'Neurology', 'Operations'];

// Minimal CSV parser for front,back[,image_url] flashcard files
function parseCsv(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const cols = line.match(/("([^"]|"")*"|[^,]+)/g)?.map((c) => c.replace(/^"|"$/g, '').replace(/""/g, '"').trim()) || [];
      return { front: cols[0], back: cols[1], imageUrl: cols[2] || null };
    })
    .filter((c) => c.front && c.back && c.front.toLowerCase() !== 'front');
}

export default function ContentUpload() {
  const [form, setForm] = useState({
    contentType: 'flashcard_deck', title: '', description: '', category: 'Cardiology',
    difficulty: 'intermediate', bloomLevel: 'remember', price: 10, accessDurationHours: 48,
    timeLimitMinutes: 30, totalPoints: 50, passingScorePct: 70,
  });
  const [cards, setCards] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [status, setStatus] = useState(null); // {kind:'ok'|'err', text}
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const isDeck = form.contentType === 'flashcard_deck';
  const isWorksheet = form.contentType === 'worksheet';

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        if (isDeck) {
          const parsed = parseCsv(reader.result);
          setCards(parsed);
          setStatus({ kind: 'ok', text: `${parsed.length} cards loaded. All cards have front and back content.` });
        } else if (isWorksheet) {
          const parsed = JSON.parse(reader.result);
          const qs = Array.isArray(parsed) ? parsed : parsed.questions;
          setQuestions(qs || []);
          setStatus({ kind: 'ok', text: `${qs?.length || 0} questions loaded.` });
        }
      } catch {
        setStatus({ kind: 'err', text: 'That file could not be read. Flashcards need a CSV with front,back columns; worksheets need JSON.' });
      }
    };
    reader.readAsText(file);
  }

  async function upload(publish) {
    setBusy(true); setStatus(null);
    try {
      const { content } = await api('/content', {
        method: 'POST',
        body: { ...form, price: Number(form.price), accessDurationHours: Number(form.accessDurationHours), isPublished: publish },
      });
      if (isDeck && cards.length) {
        await api(`/content/${content.content_id}/flashcards`, { method: 'POST', body: { cards } });
      }
      if (isWorksheet && questions.length) {
        await api(`/content/${content.content_id}/questions`, { method: 'POST', body: { questions } });
      }
      setStatus({ kind: 'ok', text: publish ? `"${form.title}" uploaded and published.` : `"${form.title}" saved as draft.` });
      setForm({ ...form, title: '', description: '' });
      setCards([]); setQuestions([]);
    } catch (e) {
      setStatus({ kind: 'err', text: e.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Upload content</h1>
          <div className="sub">Add flashcard decks, worksheets, graphics, or scenarios to the catalogue</div>
        </div>
      </div>

      <div className="card">
        <h2>Details</h2>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="ctype">Content type</label>
            <select id="ctype" value={form.contentType} onChange={set('contentType')}>
              <option value="flashcard_deck">Flashcard deck</option>
              <option value="worksheet">Worksheet</option>
              <option value="graphic">Medical graphic</option>
              <option value="scenario">Scenario</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="title">Title</label>
            <input id="title" value={form.title} onChange={set('title')} placeholder="e.g. Pharmacology Master" />
          </div>
          <div className="field">
            <label htmlFor="cat">Category</label>
            <select id="cat" value={form.category} onChange={set('category')}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="diff">Difficulty</label>
            <select id="diff" value={form.difficulty} onChange={set('difficulty')}>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="price">Price (KES)</label>
            <input id="price" type="number" min="0" value={form.price} onChange={set('price')} />
          </div>
          <div className="field">
            <label htmlFor="dur">Access duration (hours)</label>
            <input id="dur" type="number" min="1" value={form.accessDurationHours} onChange={set('accessDurationHours')} />
          </div>
          {isWorksheet && (
            <>
              <div className="field">
                <label htmlFor="bloom">Bloom's level</label>
                <select id="bloom" value={form.bloomLevel} onChange={set('bloomLevel')}>
                  {['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'].map((b) => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="tl">Time limit (minutes)</label>
                <input id="tl" type="number" value={form.timeLimitMinutes} onChange={set('timeLimitMinutes')} />
              </div>
              <div className="field">
                <label htmlFor="pass">Passing score (%)</label>
                <input id="pass" type="number" value={form.passingScorePct} onChange={set('passingScorePct')} />
              </div>
            </>
          )}
        </div>
        <div className="field">
          <label htmlFor="desc">Description</label>
          <textarea id="desc" rows="3" value={form.description} onChange={set('description')} />
        </div>
      </div>

      {(isDeck || isWorksheet) && (
        <div className="card">
          <h2>{isDeck ? 'Card file (CSV: front,back)' : 'Question file (JSON)'}</h2>
          <input type="file" accept={isDeck ? '.csv' : '.json'} onChange={handleFile} />
          {isDeck && cards.length > 0 && (
            <table style={{ marginTop: 14 }}>
              <thead><tr><th>Front</th><th>Back</th></tr></thead>
              <tbody>
                {cards.slice(0, 5).map((c, i) => (
                  <tr key={i}><td>{c.front}</td><td>{c.back}</td></tr>
                ))}
                {cards.length > 5 && <tr><td colSpan="2" style={{ color: '#5c6b68' }}>…and {cards.length - 5} more cards</td></tr>}
              </tbody>
            </table>
          )}
          {isWorksheet && questions.length > 0 && (
            <table style={{ marginTop: 14 }}>
              <thead><tr><th>Question</th><th>Points</th></tr></thead>
              <tbody>
                {questions.slice(0, 5).map((q, i) => (
                  <tr key={i}><td>{q.prompt}</td><td className="num">{q.points || 5}</td></tr>
                ))}
                {questions.length > 5 && <tr><td colSpan="2" style={{ color: '#5c6b68' }}>…and {questions.length - 5} more questions</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={() => upload(true)} disabled={busy || !form.title}>
          {busy ? 'Uploading…' : 'Upload and publish'}
        </button>
        <button className="ghost" onClick={() => upload(false)} disabled={busy || !form.title}>
          Save as draft
        </button>
      </div>
      {status && <div className={status.kind === 'ok' ? 'ok-note' : 'error-note'}>{status.text}</div>}
    </>
  );
}
