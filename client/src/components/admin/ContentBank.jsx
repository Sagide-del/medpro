import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import ProgressBar from '../common/ProgressBar';
import Loading from '../shared/Loading';

function uniqueValues(items, key) {
  return [...new Set(items.map((item) => String(item?.[key] || '').trim()).filter(Boolean))].sort();
}

export default function ContentBank() {
  const [cases, setCases] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api('/admin/cases')
      .then((data) => setCases(Array.isArray(data?.cases) ? data.cases : []))
      .catch((error) => setMessage(error.message));
  }, []);

  const categories = useMemo(() => uniqueValues(cases || [], 'category'), [cases]);
  const difficulties = useMemo(() => uniqueValues(cases || [], 'difficulty'), [cases]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (cases || []).filter((item) => {
      const matchesSearch = !term
        || [item.title, item.category, item.difficulty, item.description]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term));
      const matchesCategory = !category || String(item.category || '') === category;
      const matchesDifficulty = !difficulty || String(item.difficulty || '') === difficulty;
      const matchesStatus = !status || String(item.is_active ? 'active' : 'inactive') === status;
      return matchesSearch && matchesCategory && matchesDifficulty && matchesStatus;
    });
  }, [cases, search, category, difficulty, status]);

  const selectedCount = selected.length;
  const activeCount = filtered.filter((item) => item.is_active).length;
  const activePct = filtered.length ? Math.round((activeCount / filtered.length) * 100) : 0;

  function toggleSelection(id) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  async function bulkUpdate(nextStatus) {
    if (!selected.length) return;
    setBusy(true);
    setMessage('');
    try {
      const endpoint = nextStatus === 'active' ? '/ai/bulk-approve' : '/ai/bulk-reject';
      const response = await api(endpoint, {
        method: 'POST',
        body: { ids: selected },
      });
      setMessage(`${response.updated?.length || 0} case(s) updated.`);
      setSelected([]);
      const refreshed = await api('/admin/cases');
      setCases(Array.isArray(refreshed?.cases) ? refreshed.cases : []);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  if (!cases) return <Loading label="Loading content bank..." />;

  return (
    <section className="page-stack">
      <div className="page-head">
        <div>
          <h1>Content Bank</h1>
          <div className="sub">Review case content, filter by training metadata, and publish or unpublish in bulk.</div>
        </div>
        <div className="logbook-actions">
          <Link className="ghost" to="/superadmin/content">Open uploader</Link>
          <Link className="primary" to="/superadmin/ai-generator">Open Master AI Generator</Link>
        </div>
      </div>

      <div className="card">
        <div className="form-grid">
          <div className="field">
            <label>Search</label>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search title, category, or difficulty" />
          </div>
          <div className="field">
            <label>Category</label>
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="">All categories</option>
              {categories.map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Difficulty</label>
            <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
              <option value="">All difficulties</option>
              {difficulties.map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Status</label>
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="logbook-actions" style={{ marginTop: 12 }}>
          <button type="button" className="primary" onClick={() => bulkUpdate('active')} disabled={busy || !selectedCount}>Publish selected</button>
          <button type="button" className="ghost danger" onClick={() => bulkUpdate('inactive')} disabled={busy || !selectedCount}>Unpublish selected</button>
          <button type="button" className="ghost" onClick={() => setSelected([])} disabled={!selectedCount}>Clear selection</button>
        </div>

        <div style={{ marginTop: 14 }}>
          <ProgressBar label="Visible active content" status={`${activeCount} of ${filtered.length} cases`} value={activePct} />
        </div>

        {message ? <div className="ok-note" style={{ marginTop: 12 }}>{message}</div> : null}
      </div>

      <div className="grid-auto">
        {filtered.map((item) => (
          <article key={item.id} className="card">
            <label className="ai-generator-checkbox" style={{ marginBottom: 10 }}>
              <input type="checkbox" checked={selected.includes(item.id)} onChange={() => toggleSelection(item.id)} />
              Select
            </label>
            <h3 style={{ marginTop: 0 }}>{item.title}</h3>
            <p className="sub" style={{ marginTop: 0 }}>{item.category} · {item.difficulty || '—'}</p>
            <div className="form-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
              <div className="field"><label>Location</label><input value={item.location || ''} readOnly /></div>
              <div className="field"><label>Status</label><input value={item.is_active ? 'Active' : 'Inactive'} readOnly /></div>
            </div>
            <div className="logbook-actions">
              <Link className="ghost" to={`/superadmin/ai-generator?contentId=${item.id}&contentType=case_study`}>Customize</Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
