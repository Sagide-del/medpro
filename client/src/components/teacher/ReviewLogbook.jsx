import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Loading from '../shared/Loading';

export default function ReviewLogbook() {
  const [entries, setEntries] = useState(null);
  const [videos, setVideos] = useState(null);
  const [research, setResearch] = useState(null);
  const [error, setError] = useState('');
  const [notes, setNotes] = useState({});
  const [busy, setBusy] = useState(null);

  function load() {
    api('/logbook/entries/pending').then((d) => setEntries(d.entries)).catch((e) => setError(e.message));
    api('/videos/pending').then((d) => setVideos(d.videos)).catch((e) => setError(e.message));
    api('/research/pending').then((d) => setResearch(d.research)).catch((e) => setError(e.message));
  }
  useEffect(load, []);

  async function publishResearch(researchId) {
    setBusy(researchId);
    try {
      await api(`/research/${researchId}/publish`, { method: 'PATCH' });
      load();
    } catch (e) { setError(e.message); } finally { setBusy(null); }
  }

  async function rejectResearch(researchId) {
    if (!window.confirm('Reject and delete this submission? This cannot be undone.')) return;
    setBusy(researchId);
    try {
      await api(`/research/${researchId}/reject`, { method: 'DELETE' });
      load();
    } catch (e) { setError(e.message); } finally { setBusy(null); }
  }

  async function reviewEntry(entryId, status) {
    setBusy(entryId);
    try {
      await api(`/logbook/entries/${entryId}/review`, { method: 'PATCH', body: { status, reviewNotes: notes[entryId] } });
      load();
    } catch (e) { setError(e.message); } finally { setBusy(null); }
  }

  async function reviewVideo(videoId, status) {
    setBusy(videoId);
    try {
      await api(`/videos/${videoId}/review`, { method: 'PATCH', body: { status, reviewNotes: notes[videoId] } });
      load();
    } catch (e) { setError(e.message); } finally { setBusy(null); }
  }

  if (error) return <div className="alert">{error}</div>;
  if (!entries || !videos || !research) return <Loading label="Loading pending reviews…" />;

  return (
    <>
      <div className="page-head"><div><h1>Review submissions</h1><div className="sub">Approve or send back for revision — logbook, videos, and student research</div></div></div>

      <div className="card">
        <h2>Student research ({research.length})</h2>
        <p style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginBottom: 12 }}>
          Publishing makes a submission visible to every student on the platform. Verify any link
          actually opens and points to a real source before approving.
        </p>
        {research.map((r) => (
          <div key={r.research_id} className="card" style={{ background: 'var(--paper)' }}>
            <strong>{r.title}</strong> <span style={{ color: 'var(--ink-soft)', fontSize: 12 }}>{r.student_name} · {r.student_email}</span>
            <p style={{ margin: '8px 0', fontSize: 13 }}>{r.abstract || <em style={{ color: 'var(--ink-soft)' }}>No abstract provided.</em>}</p>
            {r.external_url && (
              <p style={{ fontSize: 12.5 }}>
                Link: <a href={r.external_url} target="_blank" rel="noreferrer">{r.external_url}</a>
              </p>
            )}
            {r.file_url && (
              <p style={{ fontSize: 12.5 }}>
                File: <a href={r.file_url} target="_blank" rel="noreferrer">Open attached file</a>
              </p>
            )}
            {!r.external_url && !r.file_url && (
              <p style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>No link or file attached.</p>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button disabled={busy === r.research_id} onClick={() => publishResearch(r.research_id)}>Publish</button>
              <button className="danger" disabled={busy === r.research_id} onClick={() => rejectResearch(r.research_id)}>Reject</button>
            </div>
          </div>
        ))}
        {research.length === 0 && <p style={{ color: 'var(--ink-soft)' }}>Nothing pending review.</p>}
      </div>

      <div className="card">
        <h2>Logbook entries ({entries.length})</h2>
        {entries.map((e) => (
          <div key={e.entry_id} className="card" style={{ background: 'var(--paper)' }}>
            <strong>{e.student_name}</strong> <span style={{ color: 'var(--ink-soft)', fontSize: 12 }}>{e.student_email}</span>
            <p style={{ margin: '8px 0' }}>{e.patient_scenario}</p>
            <p style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Skills: {(e.skills_performed || []).join(', ') || '—'}</p>
            <textarea rows="2" placeholder="Review notes (optional)" value={notes[e.entry_id] || ''}
              onChange={(ev) => setNotes((n) => ({ ...n, [e.entry_id]: ev.target.value }))} style={{ marginTop: 8 }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button disabled={busy === e.entry_id} onClick={() => reviewEntry(e.entry_id, 'approved')}>Approve</button>
              <button className="ghost" disabled={busy === e.entry_id} onClick={() => reviewEntry(e.entry_id, 'revision_requested')}>Request revision</button>
              <button className="danger" disabled={busy === e.entry_id} onClick={() => reviewEntry(e.entry_id, 'rejected')}>Reject</button>
            </div>
          </div>
        ))}
        {entries.length === 0 && <p style={{ color: 'var(--ink-soft)' }}>Nothing pending review.</p>}
      </div>

      <div className="card">
        <h2>Videos ({videos.length})</h2>
        {videos.map((v) => (
          <div key={v.video_id} className="card" style={{ background: 'var(--paper)' }}>
            <strong>{v.title}</strong> — {v.student_name}
            <p style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{v.skill_category}</p>
            <video src={v.file_url} controls style={{ width: '100%', maxWidth: 480, marginTop: 8 }} />
            <textarea rows="2" placeholder="Review notes (optional)" value={notes[v.video_id] || ''}
              onChange={(ev) => setNotes((n) => ({ ...n, [v.video_id]: ev.target.value }))} style={{ marginTop: 8 }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button disabled={busy === v.video_id} onClick={() => reviewVideo(v.video_id, 'approved')}>Approve</button>
              <button className="ghost" disabled={busy === v.video_id} onClick={() => reviewVideo(v.video_id, 'revision_requested')}>Request revision</button>
              <button className="danger" disabled={busy === v.video_id} onClick={() => reviewVideo(v.video_id, 'rejected')}>Reject</button>
            </div>
          </div>
        ))}
        {videos.length === 0 && <p style={{ color: 'var(--ink-soft)' }}>Nothing pending review.</p>}
      </div>
    </>
  );
}
