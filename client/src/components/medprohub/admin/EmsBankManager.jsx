import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../../services/api';
import ProgressBar from '../../common/ProgressBar';
import UiIcon from '../../shared/UiIcon';
import Loading from '../../shared/Loading';

function unique(items, key) {
  return [...new Set(items.map((item) => String(item?.[key] || '').trim()).filter(Boolean))].sort();
}

export default function EmsBankManager() {
  const [cases, setCases] = useState(null);
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [status, setStatus] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    api('/v1/admin/medprohub/ems/cases')
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
      const matchesStatus = !status || String(item.status || '') === status;
      return matchesSearch && matchesLevel && matchesDifficulty && matchesStatus;
    });
  }, [cases, search, level, difficulty, status]);

  const levels = useMemo(() => unique(cases || [], 'level'), [cases]);
  const difficulties = useMemo(() => unique(cases || [], 'difficulty'), [cases]);
  const statuses = useMemo(() => unique(cases || [], 'status'), [cases]);

  async function quickAction(id, endpoint, method = 'POST') {
    setMessage('');
    try {
      await api(`/v1/admin/medprohub/ems/${id}/${endpoint}`, { method });
      const refreshed = await api('/v1/admin/medprohub/ems/cases');
      setCases(Array.isArray(refreshed?.cases) ? refreshed.cases : []);
      setMessage('Case updated.');
    } catch (error) {
      setMessage(error.message);
    }
  }

  if (cases === null) return <Loading label="Loading EMS bank..." />;

  return (
    <section className="page-stack">
      <div className="page-head">
        <div>
          <h1>EMS Case Bank</h1>
          <div className="sub">Review master cases, check status, and jump back into the generator.</div>
        </div>
        <div className="logbook-actions">
          <Link className="primary" to="/superadmin/medprohub/generator">Open generator</Link>
        </div>
      </div>

      <div className="card">
        <div className="form-grid">
          <label className="field">
            <span>Search</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search title, location, or event type" />
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
          <label className="field">
            <span>Status</span>
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">All statuses</option>
              {statuses.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
        </div>

        <div style={{ marginTop: 14 }}>
          <ProgressBar
            label="Published content"
            status={`${filtered.filter((item) => item.status === 'published').length} of ${filtered.length}`}
            value={filtered.length ? Math.round((filtered.filter((item) => item.status === 'published').length / filtered.length) * 100) : 0}
          />
        </div>

        {message ? <div className="ok-note" style={{ marginTop: 12 }}>{message}</div> : null}
      </div>

      <div className="grid-auto">
        {filtered.map((item) => (
          <article key={item.id} className="card">
            <div className="page-head" style={{ marginBottom: 8 }}>
              <div>
                <h3 style={{ marginTop: 0 }}>{item.title}</h3>
                <div className="sub">{item.event_type} · {item.location}</div>
              </div>
              <span className="chip">{item.status}</span>
            </div>

            <div className="form-grid">
              <div className="field"><span>Level</span><input readOnly value={item.level || ''} /></div>
              <div className="field"><span>Difficulty</span><input readOnly value={item.difficulty || ''} /></div>
              <div className="field"><span>Usage count</span><input readOnly value={item.usage_count || 0} /></div>
              <div className="field"><span>Created by</span><input readOnly value={item.created_by_name || ''} /></div>
            </div>

            <div className="logbook-actions">
              <Link className="ghost" to={`/superadmin/medprohub/generator?caseId=${item.id}`}>Open in generator</Link>
              <button type="button" className="ghost" onClick={() => quickAction(item.id, 'approve')}>Approve</button>
              <button type="button" className="ghost danger" onClick={() => quickAction(item.id, 'reject')}>Reject</button>
              <button type="button" className="primary" onClick={() => quickAction(item.id, 'publish')}>Publish</button>
            </div>

            <div style={{ marginTop: 12 }}>
              <ProgressBar
                label="Worksheet"
                status={`${Array.isArray(item.content_json?.sections) ? item.content_json.sections.length : 0} blocks`}
                value={Math.min(100, (Array.isArray(item.content_json?.sections) ? item.content_json.sections.length : 0) * 5)}
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

