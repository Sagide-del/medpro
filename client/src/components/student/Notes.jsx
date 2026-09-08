import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Loading from '../shared/Loading';

const emptyForm = { title: '', topic: '', body: '' };

export default function Notes() {
  const [notes, setNotes] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function load() { api('/student-notes').then((data) => setNotes(data.notes || [])).catch((err) => setError(err.message)); }
  useEffect(load, []);

  async function save(event) {
    event.preventDefault();
    setError(''); setBusy(true);
    try {
      const data = await api(editingId ? `/student-notes/${editingId}` : '/student-notes', { method: editingId ? 'PATCH' : 'POST', body: form });
      setNotes((current) => editingId ? current.map((note) => note.id === editingId ? data.note : note) : [data.note, ...(current || [])]);
      setForm(emptyForm); setEditingId(null);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  async function remove(id) {
    if (!window.confirm('Delete this note?')) return;
    try { await api(`/student-notes/${id}`, { method: 'DELETE' }); setNotes((current) => current.filter((note) => note.id !== id)); } catch (err) { setError(err.message); }
  }

  if (!notes) return <Loading label="Loading notes..." />;
  return <div className="new-page new-notes-page">
    <div className="new-breadcrumb"><span>My Content</span><span>/</span><strong>Notes</strong></div>
    <header className="new-library-header"><div><div className="new-eyebrow">Personal revision</div><h1>Notes</h1><p>Capture explanations, protocols, and reminders as you study.</p></div><span className="new-notes-count">{notes.length} {notes.length === 1 ? 'note' : 'notes'}</span></header>
    {error && <div className="alert">{error}</div>}
    <div className="new-notes-layout">
      <form className="new-note-editor" onSubmit={save}><div className="new-section-heading"><h2>{editingId ? 'Edit note' : 'Add a note'}</h2></div><label>Title<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="e.g. Airway assessment sequence" required /></label><label>Topic <span>(optional)</span><input value={form.topic} onChange={(event) => setForm({ ...form, topic: event.target.value })} placeholder="Airway, trauma, pharmacology..." /></label><label>Note<textarea value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} rows="10" placeholder="Write your explanation or recall cue here..." required /></label><div className="new-note-actions"><button type="submit" className="new-button" disabled={busy}>{busy ? 'Saving...' : editingId ? 'Update note' : 'Save note'}</button>{editingId && <button type="button" className="new-button new-button-secondary" onClick={() => { setEditingId(null); setForm(emptyForm); }}>Cancel</button>}</div></form>
      <section className="new-notes-list"><div className="new-section-heading"><h2>Saved notes</h2></div>{notes.length ? notes.map((note) => <article className="new-note-row" key={note.id}><div><div className="new-note-topic">{note.topic || 'General revision'}</div><h3>{note.title}</h3><p>{note.body}</p><small>Updated {new Date(note.updated_at).toLocaleDateString('en-KE')}</small></div><div className="new-note-row-actions"><button type="button" onClick={() => { setEditingId(note.id); setForm({ title: note.title, topic: note.topic || '', body: note.body }); }}>Edit</button><button type="button" onClick={() => remove(note.id)}>Delete</button></div></article>) : <div className="new-empty-panel"><h2>No notes yet</h2><p>Create a note while reviewing a difficult topic.</p></div>}</section>
    </div>
  </div>;
}
