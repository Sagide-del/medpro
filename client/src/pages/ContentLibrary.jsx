import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { kes } from '../components/format';

const typeLabel = {
  flashcard_deck: 'Flashcards',
  worksheet: 'Worksheet',
  graphic: 'Graphic',
  scenario: 'Scenario',
};

export default function ContentLibrary() {
  const [content, setContent] = useState([]);
  const [type, setType] = useState('');
  const [error, setError] = useState('');

  function load() {
    const params = new URLSearchParams();
    if (type) params.set('type', type);
    api(`/content?${params}`).then((d) => setContent(d.content)).catch((e) => setError(e.message));
  }
  useEffect(load, [type]);

  async function togglePublish(item) {
    try {
      await api(`/content/${item.content_id}`, { method: 'PATCH', body: { is_published: !item.is_published } });
      load();
    } catch (e) { setError(e.message); }
  }

  async function remove(item) {
    if (!confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
    try {
      await api(`/content/${item.content_id}`, { method: 'DELETE' });
      load();
    } catch (e) { setError(e.message); }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Content library</h1>
          <div className="sub">Flashcards, worksheets, graphics, and scenarios</div>
        </div>
        <Link to="/content/upload"><button>Upload content</button></Link>
      </div>

      {error && <div className="alert">{error}</div>}

      <div className="card">
        <div className="field" style={{ maxWidth: 260 }}>
          <label htmlFor="type">Filter by type</label>
          <select id="type" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">All types</option>
            <option value="flashcard_deck">Flashcard decks</option>
            <option value="worksheet">Worksheets</option>
            <option value="graphic">Graphics</option>
            <option value="scenario">Scenarios</option>
          </select>
        </div>

        <table>
          <thead>
            <tr><th>Title</th><th>Type</th><th>Category</th><th>Price</th><th>Purchases</th><th>Rating</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {content.map((c) => (
              <tr key={c.content_id}>
                <td>{c.title}</td>
                <td>{typeLabel[c.content_type]}</td>
                <td>{c.category || '—'}</td>
                <td className="num">{kes(c.price)}</td>
                <td className="num">{c.purchase_count}</td>
                <td className="num">{c.avg_rating ?? '—'}</td>
                <td><span className={`badge ${c.is_published ? 'active' : 'draft'}`}>{c.is_published ? 'published' : 'draft'}</span></td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button className="ghost" onClick={() => togglePublish(c)}>
                    {c.is_published ? 'Unpublish' : 'Publish'}
                  </button>{' '}
                  <button className="ghost danger" style={{ color: '#d63b3b' }} onClick={() => remove(c)}>Delete</button>
                </td>
              </tr>
            ))}
            {content.length === 0 && (
              <tr><td colSpan="8" style={{ color: '#5c6b68' }}>No content yet. Upload your first deck, worksheet, or graphic.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
