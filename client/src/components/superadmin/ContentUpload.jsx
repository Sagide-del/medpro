import { Link } from 'react-router-dom';

export default function ContentUpload() {
  return (
    <>
      <div className="page-head"><div><h1>Upload content</h1><div className="sub">Choose what you'd like to add to the catalogue</div></div></div>
      <div className="form-grid">
        <Link to="/admin/kenya-ems-cases" style={{ textDecoration: 'none' }}>
          <div className="card"><h2>Kenya EMS Cases</h2><p style={{ color: 'var(--ink-soft)', fontSize: 13 }}>Upload, preview, publish, and reorder JSON worksheet cases.</p></div>
        </Link>
      </div>
    </>
  );
}
