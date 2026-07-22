import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../services/api';
import Loading from '../shared/Loading';
import { kes } from '../format';
import { MODULES_BY_PROGRAM, PROGRAM_OPTIONS } from './catalog';

const MODE_META = {
  student: {
    title: 'Clinical Reference Cards',
    subtitle: 'Browse EMS-specific visual and PDF reference material by program, module, and topic.',
  },
  teacher: {
    title: 'Clinical Reference Cards',
    subtitle: 'Browse course-related published cards assigned through your current program scope.',
  },
  admin: {
    title: 'Clinical Reference Cards',
    subtitle: 'View institution-approved EMS reference cards.',
  },
};

function CardList({ mode }) {
  const location = useLocation();
  const [cards, setCards] = useState(null);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ program: '', module: '', topic: '', search: '' });
  const [searchDraft, setSearchDraft] = useState('');

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.program) params.set('program', filters.program);
    if (filters.module) params.set('module', filters.module);
    if (filters.topic) params.set('topic', filters.topic);
    if (filters.search) params.set('search', filters.search);

    api(`/clinical-reference-cards${params.toString() ? `?${params.toString()}` : ''}`)
      .then((data) => setCards(data.cards))
      .catch((err) => setError(err.message));
  }, [filters]);

  const modules = filters.program ? MODULES_BY_PROGRAM[filters.program] || [] : [];
  const topics = useMemo(() => {
    const set = new Set((cards || []).map((card) => card.topic).filter(Boolean));
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [cards]);
  const meta = MODE_META[mode] || MODE_META.student;

  if (error) return <div className="alert">{error}</div>;
  if (!cards) return <Loading label="Loading clinical reference cards..." />;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{meta.title}</h1>
          <div className="sub">{meta.subtitle}</div>
        </div>
      </div>

      <div className="card">
        <div className="form-grid">
          <div className="field">
            <label>Program</label>
            <select value={filters.program} onChange={(event) => setFilters({ ...filters, program: event.target.value, module: '' })}>
              <option value="">All programs</option>
              {PROGRAM_OPTIONS.map((program) => <option key={program}>{program}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Module</label>
            <select value={filters.module} onChange={(event) => setFilters({ ...filters, module: event.target.value })}>
              <option value="">All modules</option>
              {modules.map((module) => <option key={module}>{module}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Topic</label>
            <select value={filters.topic} onChange={(event) => setFilters({ ...filters, topic: event.target.value })}>
              <option value="">All topics</option>
              {topics.map((topic) => <option key={topic}>{topic}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Search</label>
            <input
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') setFilters({ ...filters, search: searchDraft.trim() });
              }}
              placeholder="Title, topic, or skill"
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="primary" onClick={() => setFilters({ ...filters, search: searchDraft.trim() })}>Apply filters</button>
          <button
            className="ghost"
            onClick={() => {
              setFilters({ program: '', module: '', topic: '', search: '' });
              setSearchDraft('');
            }}
          >
            Reset
          </button>
        </div>
      </div>

      <div className="form-grid">
        {cards.map((card) => (
          <Link key={card.clinical_card_id} to={`${location.pathname}/${card.clinical_card_id}`} style={{ textDecoration: 'none' }}>
            <div className="card" style={{ height: '100%' }}>
              {card.thumbnail_url ? (
                <img src={card.thumbnail_url} alt="" style={{ width: '100%', height: 170, objectFit: 'cover', borderRadius: 8, marginBottom: 10 }} />
              ) : (
                <div style={{ borderRadius: 8, marginBottom: 10, minHeight: 170, display: 'grid', placeItems: 'center', background: 'rgba(204,0,0,0.06)', color: 'var(--red)', fontWeight: 700 }}>
                  {card.file_kind === 'pdf' ? 'PDF Card' : 'Reference Card'}
                </div>
              )}
              <h2>{card.title}</h2>
              <p style={{ color: 'var(--ink-soft)', fontSize: 13, marginBottom: 10 }}>{card.description || 'No description provided yet.'}</p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                <span className="badge draft">{card.program}</span>
                <span className="badge draft">{card.module}</span>
                <span className="badge draft">{card.topic}</span>
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>Skill: {card.skill}</div>
            </div>
          </Link>
        ))}
        {cards.length === 0 && <div className="card"><p style={{ color: 'var(--ink-soft)', marginBottom: 0 }}>No clinical reference cards match the current filters.</p></div>}
      </div>
    </>
  );
}

function CardDetail({ mode }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [card, setCard] = useState(null);
  const [unlocked, setUnlocked] = useState(mode !== 'student');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  function load() {
    api(`/clinical-reference-cards/${id}`)
      .then((data) => {
        setCard(data.card);
        setUnlocked(data.unlocked !== false);
      })
      .catch((err) => setError(err.message));
  }

  useEffect(load, [id]);

  async function unlockCard() {
    setBusy(true);
    setStatus('');
    try {
      const response = await api('/payments/purchase', {
        method: 'POST',
        body: { itemType: 'graphic', itemId: card.graphic_id, phone },
      });
      setStatus(response.simulated ? 'Access granted in dev mode. Reloading card...' : 'Check your phone to complete the M-Pesa payment.');
      setTimeout(load, 1200);
    } catch (err) {
      setStatus(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (error) return <div className="alert">{error}</div>;
  if (!card) return <Loading label="Loading clinical reference card..." />;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{card.title}</h1>
          <div className="sub">{card.program} &middot; {card.module} &middot; {card.topic}</div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <span className="badge draft">{card.program}</span>
          <span className="badge draft">{card.module}</span>
          <span className="badge draft">{card.topic}</span>
          <span className="badge draft">{card.difficulty}</span>
        </div>
        <p style={{ marginBottom: 8 }}><strong>Skill:</strong> {card.skill}</p>
        <p style={{ marginBottom: 8 }}><strong>Description:</strong> {card.description || 'No description provided.'}</p>
        <p style={{ color: 'var(--ink-soft)', fontSize: 13 }}>
          Created by: {card.created_by_name || 'Unknown'} &middot; {new Date(card.created_at).toLocaleDateString('en-KE')}
        </p>

        {unlocked ? (
          <>
            <div style={{ marginTop: 14 }}>
              {card.file_kind === 'image' && card.file_url ? (
                <img src={card.file_url} alt={card.title} style={{ width: '100%', borderRadius: 8 }} />
              ) : card.file_kind === 'pdf' && card.file_url ? (
                <iframe title={card.title} src={card.file_url} style={{ width: '100%', minHeight: 640, border: '1px solid var(--line)', borderRadius: 8 }} />
              ) : (
                <div className="alert info">This card has been published but its file is not currently available.</div>
              )}
            </div>
            {card.file_url && (
              <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
                <a className="primary" href={card.file_url} target="_blank" rel="noreferrer">View / Download</a>
                <button className="ghost" onClick={() => navigate(-1)}>Back</button>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="alert info" style={{ marginTop: 14 }}>
              This clinical reference card uses the existing content-access flow. Unlock it for {kes(card.price)} to view or download the full file.
            </div>
            <div className="field">
              <label>M-Pesa phone number</label>
              <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="07XX XXX XXX" />
            </div>
            <button className="primary" onClick={unlockCard} disabled={busy || !phone}>
              {busy ? 'Processing...' : `Unlock for ${kes(card.price)}`}
            </button>
            {status && <div className="ok-note">{status}</div>}
          </>
        )}
      </div>
    </>
  );
}

export default function ClinicalReferenceCardsBrowser({ mode = 'student' }) {
  const { id } = useParams();
  return id ? <CardDetail mode={mode} /> : <CardList mode={mode} />;
}
