import { useState } from 'react';
import UiIcon from '../shared/UiIcon';

export default function Bookmarks() {
  const [bookmarks, setBookmarks] = useState([]);
  const [title, setTitle] = useState('');

  function addBookmark(event) {
    event.preventDefault();
    if (!title.trim()) return;
    setBookmarks((items) => [...items, { id: Date.now(), title: title.trim() }]);
    setTitle('');
  }

  return (
    <div className="new-page">
      <header className="new-page-header"><div><div className="new-eyebrow">Saved revision</div><h1>Bookmarks</h1><p className="new-muted">Keep difficult questions close for your next review.</p></div><button type="button" className="new-button" disabled={!bookmarks.length}>Quiz bookmarks</button></header>
      <form className="new-bookmark-form" onSubmit={addBookmark}><label htmlFor="bookmark-title">Add a question to review</label><div><input id="bookmark-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Paste or enter a question title" /><button type="submit" className="new-button">Save bookmark</button></div></form>
      {bookmarks.length ? <div className="new-bookmark-list">{bookmarks.map((item) => <div className="new-bookmark-row" key={item.id}><UiIcon name="bookmark" /><span>{item.title}</span><button type="button" className="new-icon-button" aria-label={`Remove ${item.title}`} onClick={() => setBookmarks((items) => items.filter((entry) => entry.id !== item.id))}>Remove</button></div>)}</div> : <section className="new-empty-panel"><div className="new-empty-icon"><UiIcon name="bookmark" /></div><div><h2>No bookmarks yet</h2><p>Save difficult questions from the question bank to build a focused quiz.</p></div></section>}
    </div>
  );
}
