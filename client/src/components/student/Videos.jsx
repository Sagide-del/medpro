import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Loading from '../shared/Loading';

export default function Videos() {
  const [videos, setVideos] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ title: '', description: '', skillCategory: '' });
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  function load() {
    api('/videos').then((d) => setVideos(d.videos)).catch((e) => setError(e.message));
  }
  useEffect(load, []);

  async function upload() {
    if (!file) return;
    setBusy(true); setStatus('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('skillCategory', form.skillCategory);
      await api('/videos/upload', { method: 'POST', body: fd });
      setStatus('Video uploaded and submitted for review.');
      setForm({ title: '', description: '', skillCategory: '' });
      setFile(null);
      load();
    } catch (e) { setStatus(e.message); } finally { setBusy(false); }
  }

  if (error) return <div className="alert">{error}</div>;
  if (!videos) return <Loading label="Loading your videos…" />;

  return (
    <>
      <div className="page-head"><div><h1>Skills videos</h1><div className="sub">Upload demonstrations for teacher review</div></div></div>

      <div className="card">
        <h2>Upload a new video</h2>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="title">Title</label>
            <input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="skill">Skill category</label>
            <input id="skill" value={form.skillCategory} onChange={(e) => setForm({ ...form, skillCategory: e.target.value })} placeholder="e.g. BLS/CPR" />
          </div>
        </div>
        <div className="field">
          <label htmlFor="desc">Description</label>
          <textarea id="desc" rows="2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="file">Video file</label>
          <input id="file" type="file" accept="video/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </div>
        <button className="primary" onClick={upload} disabled={busy || !file || !form.title}>
          {busy ? 'Uploading…' : 'Upload video'}
        </button>
        {status && <div className="ok-note">{status}</div>}
      </div>

      <div className="card">
        <h2>Your submissions</h2>
        <table>
          <thead><tr><th>Title</th><th>Skill</th><th>Status</th><th>Uploaded</th></tr></thead>
          <tbody>
            {videos.map((v) => (
              <tr key={v.video_id}>
                <td>{v.title}</td>
                <td>{v.skill_category || '—'}</td>
                <td><span className={`badge ${v.status}`}>{v.status.replace('_', ' ')}</span></td>
                <td className="num">{new Date(v.uploaded_at).toLocaleDateString('en-KE')}</td>
              </tr>
            ))}
            {videos.length === 0 && <tr><td colSpan="4" style={{ color: 'var(--ink-soft)' }}>No videos yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
