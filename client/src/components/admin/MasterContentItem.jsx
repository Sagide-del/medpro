import { useState } from 'react';
import { api } from '../../services/api';

export default function MasterContentItem({ item, onChange }) {
  const [content, setContent] = useState(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState(null);
  const [imageCaption,setImageCaption]=useState(''),[imageCredit,setImageCredit]=useState('');
  const image=['diagrams','drug_reference'].includes(item.destination_key);
  const media = ['podcasts', 'skills_videos', 'diagrams','drug_reference'].includes(item.destination_key);
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
        if(item.destination_key==='drug_reference'){body.append('imageAlt',item.title);body.append('imageCaption',imageCaption);body.append('imageCredit',imageCredit);}
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
    {media && <div className="field"><label>Attach reviewed {item.destination_key === 'podcasts' ? 'audio' : image ? 'image' : 'video'}
      <input type="file" accept={item.destination_key === 'podcasts' ? 'audio/mpeg,audio/wav,audio/mp4,audio/ogg' : image ? 'image/png,image/jpeg,image/webp' : 'video/mp4,video/webm'} onChange={(event) => setFile(event.target.files?.[0] || null)} /></label>
      {item.destination_key==='drug_reference' && <div className="drug-image-fields"><label>Image caption<input value={imageCaption} maxLength={300} placeholder="Formulation or image description" onChange={event=>setImageCaption(event.target.value)}/></label><label>Image credit<input value={imageCredit} maxLength={500} placeholder="Photographer, manufacturer or source" onChange={event=>setImageCredit(event.target.value)}/></label></div>}
      <button type="button" disabled={busy || !file} onClick={() => act('media')}>Upload media</button>
    </div>}

    {message && <p role="status">{message}</p>}
    {content && <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{JSON.stringify(content.content_json, null, 2)}</pre>}
  </article>;
}
