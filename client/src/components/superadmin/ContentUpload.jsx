import { Link } from 'react-router-dom';

export default function ContentUpload() {
  return (
    <>
      <div className="page-head"><div><h1>Upload content</h1><div className="sub">Choose what you'd like to add to the catalogue</div></div></div>
      <div className="form-grid">
        <Link to="/superadmin/flashcards" style={{ textDecoration: 'none' }}>
          <div className="card"><h2>Flashcard deck</h2><p style={{ color: 'var(--ink-soft)', fontSize: 13 }}>Bulk-add cards via CSV (front, back, image_url).</p></div>
        </Link>
        <Link to="/superadmin/worksheets" style={{ textDecoration: 'none' }}>
          <div className="card"><h2>Worksheet</h2><p style={{ color: 'var(--ink-soft)', fontSize: 13 }}>Bulk-add questions via JSON.</p></div>
        </Link>
        <Link to="/superadmin/graphics" style={{ textDecoration: 'none' }}>
          <div className="card"><h2>Medical graphic</h2><p style={{ color: 'var(--ink-soft)', fontSize: 13 }}>Upload interactive anatomy, ECG strips, and more.</p></div>
        </Link>
      </div>
    </>
  );
}
