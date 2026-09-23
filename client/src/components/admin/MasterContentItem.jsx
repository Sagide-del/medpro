import { useState } from 'react';
import { api } from '../../services/api';

export default function MasterContentItem({ item, onChange }) {
  const [content, setContent] = useState(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState(null);
  const media = ['podcasts', 'skills_videos', 'diagrams'].includes(item.destination_key);
  async function act(action) {
    setBusy(true); setMessage('');
    try {
      if (action === 'preview') {
        const data = await api(`/ai/v2/content/${item.id}`); setContent(data.content);
      } else if (action === 'unpublish') {
        await api(`/ai/v2/content/${item.id}/unpublish`, { method: 'POST' });
        setMessage('Unpublished. Existing student results are retained.'); onChange();
      } else {
        const body = new FormData(); body.append('file', file);
        await api(`/ai/v2/content/${item.id}/media`, { method: 'POST', body });
        setMessage('Media attached to this published item.'); setContent(null); onChange();
      }
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }
  return <article className="card">
    <span className="badge">{item.status}</span><h3>{item.title}</h3>
    <p>{item.program} / {item.destination_key}</p>
    {item.source_citation && <p>Source: {item.source_citation}</p>}
    <button type="button" className="ghost" disabled={busy} onClick={() => content ? setContent(null) : act('preview')}>{content ? 'Close preview' : 'Preview'}</button>
    {item.status === 'published' && <button type="button" className="ghost" disabled={busy} onClick={() => { if (window.confirm('Unpublish this item from the student library?')) act('unpublish'); }}>Unpublish</button>}
    {media && <label className="field">Attach reviewed {item.destination_key === 'podcasts' ? 'audio' : item.destination_key === 'diagrams' ? 'image' : 'video'}
      <input type="file" accept={item.destination_key === 'podcasts' ? 'audio/mpeg,audio/wav,audio/mp4,audio/ogg' : item.destination_key === 'diagrams' ? 'image/png,image/jpeg,image/webp' : 'video/mp4,video/webm'} onChange={(event) => setFile(event.target.files?.[0] || null)} />
      <button type="button" disabled={busy || !file} onClick={() => act('media')}>Upload media</button>
    </label>}
    {message && <p role="status">{message}</p>}
    {content && <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{JSON.stringify(content.content_json, null, 2)}</pre>}
  </article>;
}
