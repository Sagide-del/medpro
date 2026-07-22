import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { DIFFICULTY_OPTIONS, MODULES_BY_PROGRAM, PROGRAM_OPTIONS } from './catalog';

const EMPTY_FORM = {
  title: '',
  program: 'EMT',
  module: 'EMS Foundations',
  topic: '',
  skill: '',
  description: '',
  difficulty: 'intermediate',
};

export default function ClinicalReferenceCardsManager({ title, subtitle, allowPublish = true }) {
  const [cards, setCards] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [file, setFile] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  const modules = MODULES_BY_PROGRAM[form.program] || [];

  function load() {
    const query = statusFilter ? `?status=${statusFilter}` : '';
    api(`/clinical-reference-cards${query}`)
      .then((data) => setCards(data.cards))
      .catch((err) => setStatus({ kind: 'err', text: err.message }));
  }

  useEffect(load, [statusFilter]);

  async function save(publishNow = false) {
    setBusy(true);
    setStatus(null);
    try {
      let cardId = editingId;
      if (editingId) {
        const response = await api(`/clinical-reference-cards/${editingId}`, { method: 'PATCH', body: form });
        cardId = response.card.clinical_card_id;
      } else {
        const response = await api('/clinical-reference-cards', { method: 'POST', body: form });
        cardId = response.card.clinical_card_id;
      }

      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        await api(`/clinical-reference-cards/${cardId}/file`, { method: 'POST', body: formData });
      }

      if (publishNow && allowPublish) {
        await api(`/clinical-reference-cards/${cardId}/publish`, { method: 'PATCH' });
      }

      setStatus({ kind: 'ok', text: publishNow ? 'Clinical reference card saved and published.' : 'Clinical reference card saved.' });
      setForm(EMPTY_FORM);
      setFile(null);
      setEditingId(null);
      load();
    } catch (err) {
      setStatus({ kind: 'err', text: err.message });
    } finally {
      setBusy(false);
    }
  }

  async function togglePublish(card) {
    const action = card.status === 'published' ? 'unpublish' : 'publish';
    await api(`/clinical-reference-cards/${card.clinical_card_id}/${action}`, { method: 'PATCH' });
    load();
  }

  async function remove(cardId) {
    if (!confirm('Delete this clinical reference card? This cannot be undone.')) return;
    await api(`/clinical-reference-cards/${cardId}`, { method: 'DELETE' });
    load();
  }

  function startEdit(card) {
    setEditingId(card.clinical_card_id);
    setForm({
      title: card.title,
      program: card.program,
      module: card.module,
      topic: card.topic,
      skill: card.skill,
      description: card.description || '',
      difficulty: card.difficulty || 'intermediate',
    });
    setFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{title}</h1>
          <div className="sub">{subtitle}</div>
        </div>
      </div>

      <div className="card">
        <h2>{editingId ? 'Edit card' : 'Create clinical reference card'}</h2>
        <div className="form-grid">
          <div className="field"><label>Title</label><input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></div>
          <div className="field"><label>Program</label>
            <select value={form.program} onChange={(event) => setForm({ ...form, program: event.target.value, module: MODULES_BY_PROGRAM[event.target.value][0] })}>
              {PROGRAM_OPTIONS.map((program) => <option key={program}>{program}</option>)}
            </select>
          </div>
          <div className="field"><label>Module</label>
            <select value={form.module} onChange={(event) => setForm({ ...form, module: event.target.value })}>
              {modules.map((module) => <option key={module}>{module}</option>)}
            </select>
          </div>
          <div className="field"><label>Topic</label><input value={form.topic} onChange={(event) => setForm({ ...form, topic: event.target.value })} /></div>
          <div className="field"><label>Skill</label><input value={form.skill} onChange={(event) => setForm({ ...form, skill: event.target.value })} /></div>
          <div className="field"><label>Difficulty</label>
            <select value={form.difficulty} onChange={(event) => setForm({ ...form, difficulty: event.target.value })}>
              {DIFFICULTY_OPTIONS.map((difficulty) => <option key={difficulty}>{difficulty}</option>)}
            </select>
          </div>
        </div>
        <div className="field"><label>Description</label><textarea rows="3" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></div>
        <div className="field"><label>Upload file (PDF or image)</label><input type="file" accept="application/pdf,image/*" onChange={(event) => setFile(event.target.files?.[0] || null)} /></div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="primary" onClick={() => save(false)} disabled={busy || !form.title || !form.topic || !form.skill}>
            {busy ? 'Saving...' : editingId ? 'Update card' : 'Save draft'}
          </button>
          {allowPublish && (
            <button className="ghost" onClick={() => save(true)} disabled={busy || !form.title || !form.topic || !form.skill}>
              {busy ? 'Publishing...' : editingId ? 'Update and publish' : 'Save and publish'}
            </button>
          )}
          {editingId && (
            <button className="ghost" onClick={() => { setEditingId(null); setForm(EMPTY_FORM); setFile(null); }}>
              Cancel edit
            </button>
          )}
        </div>
        {status && <div className={status.kind === 'ok' ? 'ok-note' : 'error-note'}>{status.text}</div>}
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
          <h2 style={{ marginBottom: 0 }}>All clinical reference cards</h2>
          <div className="field" style={{ minWidth: 220, marginBottom: 0 }}>
            <label>Status</label>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="">All statuses</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
        </div>
        <table>
          <thead><tr><th>Title</th><th>Program</th><th>Module</th><th>Topic</th><th>Status</th><th>Created</th><th></th></tr></thead>
          <tbody>
            {cards.map((card) => (
              <tr key={card.clinical_card_id}>
                <td>{card.title}</td>
                <td>{card.program}</td>
                <td>{card.module}</td>
                <td>{card.topic}</td>
                <td><span className={`badge ${card.status}`}>{card.status}</span></td>
                <td className="num">{new Date(card.created_at).toLocaleDateString('en-KE')}</td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button className="ghost" onClick={() => startEdit(card)}>Edit</button>{' '}
                  {allowPublish && <button className="ghost" onClick={() => togglePublish(card)}>{card.status === 'published' ? 'Unpublish' : 'Publish'}</button>}{' '}
                  <button className="ghost danger" onClick={() => remove(card.clinical_card_id)}>Delete</button>
                </td>
              </tr>
            ))}
            {cards.length === 0 && <tr><td colSpan="7" style={{ color: 'var(--ink-soft)' }}>No clinical reference cards yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
