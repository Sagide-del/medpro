import { useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { CARD_CATEGORIES, DIFFICULTY_OPTIONS } from './catalog';

const EMPTY_FORM = {
  category: CARD_CATEGORIES[0],
  difficulty: 'intermediate',
};

function titleFromFilename(filename) {
  return String(filename || 'Clinical Reference Card')
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase()) || 'Clinical Reference Card';
}

function cardDocumentUrl(card) {
  return card.pdf_url || '';
}

function openDocument(url, onError) {
  if (!url) {
    if (onError) onError('This PDF is not available right now. Try refreshing the list.');
    return;
  }
  const opened = window.open(url, '_blank', 'noopener,noreferrer');
  if (!opened && onError) {
    onError('Your browser blocked the PDF from opening in a new tab. Allow pop-ups for this site and try again.');
  }
}

export default function ClinicalReferenceCardsManager({ title, subtitle }) {
  const [cards, setCards] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [files, setFiles] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [openErrors, setOpenErrors] = useState({});

  function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (categoryFilter) params.set('category', categoryFilter);
    api(`/clinical-reference-cards${params.toString() ? `?${params.toString()}` : ''}`)
      .then((data) => setCards(data.cards || []))
      .catch((err) => setStatus({ kind: 'err', text: err.message }))
      .finally(() => setLoading(false));
  }

  useEffect(load, [statusFilter, categoryFilter]);

  const previewFiles = useMemo(() => files.map((file) => ({
    file,
    title: titleFromFilename(file.name),
  })), [files]);

  async function save(publishNow = false) {
    if (!files.length) {
      setStatus({ kind: 'err', text: 'Select one or more PDF files to upload.' });
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));
      formData.append('category', form.category);
      formData.append('difficulty', form.difficulty);
      formData.append('is_active', publishNow ? 'true' : 'false');
      const response = await api('/clinical-reference-cards/bulk-upload', { method: 'POST', body: formData });
      const firstUrl = response?.fileUrls?.[0] || response?.cards?.[0]?.file_url || '';
      setStatus({
        kind: 'ok',
        text: firstUrl
          ? `Uploaded ${response?.cards?.length || files.length} card(s). Saved file URL: ${firstUrl}`
          : `Uploaded ${response?.cards?.length || files.length} card(s).`,
      });
      setFiles([]);
      load();
    } catch (err) {
      setStatus({ kind: 'err', text: err.message });
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(card) {
    await api(`/clinical-reference-cards/${card.clinical_card_id || card.id}/${card.is_active ? 'unpublish' : 'publish'}`, { method: 'PATCH' });
    load();
  }

  async function remove(cardId) {
    if (!confirm('Delete this clinical reference card? This cannot be undone.')) return;
    await api(`/clinical-reference-cards/${cardId}`, { method: 'DELETE' });
    load();
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{title}</h1>
          <div className="sub">{subtitle}</div>
        </div>
      </div>

      <div className="card">
        <h2>Bulk PDF upload</h2>
        <div className="form-grid">
          <div className="field">
            <label>Category</label>
            <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
              {CARD_CATEGORIES.map((category) => <option key={category}>{category}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Difficulty</label>
            <select value={form.difficulty} onChange={(event) => setForm({ ...form, difficulty: event.target.value })}>
              {DIFFICULTY_OPTIONS.map((difficulty) => <option key={difficulty}>{difficulty}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Select PDF files</label>
            <input type="file" accept=".pdf,application/pdf" multiple onChange={(event) => setFiles([...event.target.files || []])} />
          </div>
        </div>

        {previewFiles.length > 0 && (
          <div className="ref-card-upload-preview-grid">
            {previewFiles.map(({ file, title: generatedTitle }) => (
              <div className="ref-card-upload-preview" key={`${file.name}-${file.size}`}>
                <div className="ref-card-upload-preview-file">PDF</div>
                <div>
                  <div className="ref-card-kicker">{form.category}</div>
                  <strong>{generatedTitle}</strong>
                  <div style={{ color: 'var(--ink-soft)', fontSize: 12 }}>{file.name}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="ref-card-upload-actions">
          <button className="primary" onClick={() => save(false)} disabled={busy || files.length === 0}>
            {busy ? 'Uploading...' : 'Save as draft'}
          </button>
          <button className="ghost" onClick={() => save(true)} disabled={busy || files.length === 0}>
            {busy ? 'Publishing...' : 'Upload and publish'}
          </button>
          <button className="ghost" onClick={() => setFiles([])} disabled={busy || files.length === 0}>Clear</button>
        </div>
        {status && <div className={status.kind === 'ok' ? 'ok-note' : 'error-note'}>{status.text}</div>}
      </div>

      <div className="card">
        <div className="ref-card-admin-toolbar">
          <div className="field">
            <label>Status</label>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="">All statuses</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
          <div className="field">
            <label>Category</label>
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
              <option value="">All categories</option>
              {CARD_CATEGORIES.map((category) => <option key={category}>{category}</option>)}
            </select>
          </div>
        </div>

        <div className="ref-card-admin-grid">
          {loading && <div className="dashboard-empty">Loading clinical reference cards…</div>}
          {!loading && cards.map((card) => {
            const cardKey = card.clinical_card_id || card.id;
            return (
              <div className="ref-card-admin-item" key={cardKey}>
                <div className="ref-card-admin-item-body">
                  <div className="ref-card-kicker">{card.category || card.module || 'Uncategorised'}</div>
                  <h3>{card.title}</h3>
                  <div className="ref-card-admin-meta">
                    <span>{card.difficulty || 'intermediate'}</span>
                    <span>{card.file_type || 'pdf'}</span>
                    <span>{card.is_active ? 'Active' : 'Draft'}</span>
                  </div>
                  {openErrors[cardKey] && <div className="error-note">{openErrors[cardKey]}</div>}
                </div>
                <div className="ref-card-admin-actions">
                  <button
                    className="ghost"
                    disabled={!cardDocumentUrl(card)}
                    title={!cardDocumentUrl(card) ? 'PDF is not available right now.' : undefined}
                    onClick={() => openDocument(cardDocumentUrl(card), (message) =>
                      setOpenErrors((prev) => ({ ...prev, [cardKey]: message })))}
                  >
                    Open PDF
                  </button>
                  <button className="ghost" onClick={() => toggleActive(card)}>{card.is_active ? 'Unpublish' : 'Publish'}</button>
                  <button className="ghost danger" onClick={() => remove(card.clinical_card_id || card.id)}>Delete</button>
                </div>
              </div>
            );
          })}
          {!loading && cards.length === 0 && <div className="dashboard-empty">No clinical reference cards yet.</div>}
        </div>
      </div>
    </>
  );
}
