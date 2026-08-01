import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../../services/api';
import ProgressBar from '../../common/ProgressBar';
import Loading from '../../shared/Loading';

function unique(items, key) {
  return [...new Set(items.map((item) => String(item?.[key] || '').trim()).filter(Boolean))].sort();
}

export default function EmsBrowser() {
  const [cases, setCases] = useState(null);
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [message, setMessage] = useState('');
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    api('/v1/teacher/medprohub/ems/bank')
      .then((data) => setCases(Array.isArray(data?.cases) ? data.cases : []))
      .catch((error) => setMessage(error.message));
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (cases || []).filter((item) => {
      const matchesSearch = !term || [item.title, item.event_type, item.location, item.description]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
      const matchesLevel = !level || String(item.level || '') === level;
      const matchesDifficulty = !difficulty || String(item.difficulty || '') === difficulty;
      return matchesSearch && matchesLevel && matchesDifficulty;
    });
  }, [cases, search, level, difficulty]);

  const levels = useMemo(() => unique(cases || [], 'level'), [cases]);
  const difficulties = useMemo(() => unique(cases || [], 'difficulty'), [cases]);

  async function postSelected() {
    if (!selected.length) return;
    setMessage('');
    try {
      for (const id of selected) {
        await api('/v1/teacher/medprohub/ems/publish', {
          method: 'POST',
          body: { id },
        });
      }
      const refreshed = await api('/v1/teacher/medprohub/ems/bank');
      setCases(Array.isArray(refreshed?.cases) ? refreshed.cases : []);
      setSelected([]);
      setMessage('Selected cases published to your school.');
    } catch (error) {
      setMessage(error.message);
    }
  }

  if (cases === null) return <Loading label="Loading EMS case bank..." />;

  return (
    <section className="page-stack">
      <div className="page-head">
        <div>
          <h1>EMS Case Bank</h1>
          <div className="sub">Browse approved cases, preview the worksheet, and customize for your class.</div>
        </div>
        <div className="logbook-actions">
          <Link className="ghost" to="/teacher/medprohub/customize/new">Open customizer</Link>
        </div>
      </div>

      <div className="card">
        <div className="form-grid">
          <label className="field">
            <span>Search</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search title, event type, location..." />
          </label>
          <label className="field">
            <span>Level</span>
            <select value={level} onChange={(event) => setLevel(event.target.value)}>
              <option value="">All levels</option>
              {levels.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Difficulty</span>
            <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
              <option value="">All difficulties</option>
              {difficulties.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
        </div>

        <div style={{ marginTop: 14 }}>
          <ProgressBar
            label="Approved cases"
            status={`${filtered.length} visible`}
            value={filtered.length ? Math.round((filtered.filter((item) => item.status === 'approved' || item.status === 'published').length / filtered.length) * 100) : 0}
          />
        </div>

        {message ? <div className="ok-note" style={{ marginTop: 12 }}>{message}</div> : null}
      </div>

      <div className="logbook-actions">
        <button type="button" className="primary" onClick={postSelected} disabled={!selected.length}>Post selected to my school</button>
        <button type="button" className="ghost" onClick={() => setSelected([])} disabled={!selected.length}>Clear selection</button>
      </div>

      <div className="grid-auto">
        {filtered.map((item) => (
          <article key={item.id} className="card">
            <label className="ai-generator-checkbox" style={{ marginBottom: 10 }}>
              <input
                type="checkbox"
                checked={selected.includes(item.id)}
                onChange={() => setSelected((current) => (current.includes(item.id) ? current.filter((entry) => entry !== item.id) : [...current, item.id]))}
              />
              Select
            </label>

            <h3 style={{ marginTop: 0 }}>{item.title}</h3>
            <p className="sub" style={{ marginTop: 0 }}>{item.event_type} · {item.location}</p>

            <div className="form-grid">
              <div className="field"><span>Level</span><input readOnly value={item.level || ''} /></div>
              <div className="field"><span>Difficulty</span><input readOnly value={item.difficulty || ''} /></div>
              <div className="field"><span>Status</span><input readOnly value={item.status || ''} /></div>
              <div className="field"><span>Blocks</span><input readOnly value={Array.isArray(item.content_json?.sections) ? item.content_json.sections.length : 0} /></div>
            </div>

            <div className="logbook-actions">
              <Link className="ghost" to={`/teacher/medprohub/customize/${item.id}`}>Customize</Link>
              <Link className="primary" to={`/teacher/medprohub/customize/${item.id}`}>Open</Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

