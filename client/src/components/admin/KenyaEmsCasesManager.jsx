import { useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import Loading from '../shared/Loading';
import CaseRenderer from '../student/CaseRenderer';

const EMPTY_FORM = {
  title: '',
  category: 'Mass Casualty',
  difficulty: 'advanced',
  passing_percentage: 80,
  order_number: '',
  is_active: false,
};

function safeJsonParse(text) {
  try {
    return { value: JSON.parse(text), error: null };
  } catch (error) {
    return { value: null, error: 'Invalid JSON file. Please check the case structure.' };
  }
}

function extractPreviewCase(parsed) {
  if (!parsed || typeof parsed !== 'object') return null;
  const caseJson = parsed.content_json && typeof parsed.content_json === 'object' ? parsed.content_json : parsed;
  const blocks = Array.isArray(caseJson.blocks) ? caseJson.blocks : [];

  return {
    title: parsed.title || caseJson.title || '',
    category: parsed.category || caseJson.category || '',
    difficulty: parsed.difficulty || caseJson.difficulty || '',
    content_json: {
      ...caseJson,
      blocks,
    },
    grading_json: parsed.grading_json && typeof parsed.grading_json === 'object' ? parsed.grading_json : caseJson.grading_json || {},
    passing_percentage: Number(parsed.passing_percentage || caseJson.passing_percentage || 80),
    is_active: Boolean(parsed.is_active),
    order_number: parsed.order_number || caseJson.order_number || '',
  };
}

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('en-KE');
  } catch {
    return '—';
  }
}

export default function KenyaEmsCasesManager() {
  const [cases, setCases] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [jsonText, setJsonText] = useState('');
  const [previewCase, setPreviewCase] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  function loadCases() {
    setLoading(true);
    api('/admin/cases')
      .then((data) => setCases(Array.isArray(data?.cases) ? data.cases : []))
      .catch((error) => setStatus({ kind: 'err', text: error.message }))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadCases();
  }, []);

  function applyParsedCase(parsed) {
    const preview = extractPreviewCase(parsed);
    if (!preview) {
      setStatus({ kind: 'err', text: 'The uploaded file does not contain a valid case object.' });
      return;
    }

    setPreviewCase(preview);
    setForm({
      title: preview.title || '',
      category: preview.category || 'Mass Casualty',
      difficulty: preview.difficulty || 'advanced',
      passing_percentage: preview.passing_percentage || 80,
      order_number: preview.order_number || '',
      is_active: Boolean(preview.is_active),
    });
    setJsonText(JSON.stringify(parsed, null, 2));
    setStatus({ kind: 'ok', text: 'JSON loaded. Review the preview before publishing.' });
  }

  function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const { value, error } = safeJsonParse(String(reader.result || ''));
      if (error) {
        setPreviewCase(null);
        setStatus({ kind: 'err', text: error });
        return;
      }
      applyParsedCase(value);
    };
    reader.readAsText(file);
  }

  function validatePayload() {
    const { value, error } = safeJsonParse(jsonText);
    if (error) return { error };
    const parsed = value;
    const caseJson = parsed?.content_json && typeof parsed.content_json === 'object' ? parsed.content_json : parsed;
    const blocks = Array.isArray(caseJson?.blocks) ? caseJson.blocks : [];
    const issues = [];

    if (!String(parsed?.title || caseJson?.title || '').trim()) issues.push('title is required');
    if (!String(parsed?.category || caseJson?.category || '').trim()) issues.push('category is required');
    if (!String(parsed?.difficulty || caseJson?.difficulty || '').trim()) issues.push('difficulty is required');
    if (blocks.length === 0) issues.push('content_json.blocks must contain at least one block');

    return {
      error: issues.length ? issues.join('; ') : null,
      parsed,
    };
  }

  async function saveCase(publishNow = false) {
    const { error, parsed } = validatePayload();
    if (error) {
      setStatus({ kind: 'err', text: error });
      return;
    }

    setBusy(true);
    setStatus(null);
    try {
      const payload = {
        ...(parsed || {}),
        ...form,
        title: String(form.title || parsed?.title || '').trim(),
        category: String(form.category || parsed?.category || '').trim(),
        difficulty: String(form.difficulty || parsed?.difficulty || 'advanced').trim(),
        passing_percentage: Number(form.passing_percentage || parsed?.passing_percentage || 80),
        order_number: form.order_number === '' ? null : Number(form.order_number),
        is_active: publishNow ? true : Boolean(form.is_active),
      };

      let response;
      if (editingId) {
        response = await api(`/admin/cases/${editingId}`, { method: 'PUT', body: payload });
      } else {
        response = await api('/admin/cases/upload', { method: 'POST', body: payload });
      }

      setStatus({
        kind: 'ok',
        text: publishNow ? 'Case saved and published.' : 'Case saved as draft.',
      });
      setEditingId(null);
      setPreviewCase(response?.caseStudy || previewCase);
      loadCases();
    } catch (error) {
      setStatus({ kind: 'err', text: error.message });
    } finally {
      setBusy(false);
    }
  }

  function editCase(studyCase) {
    setEditingId(studyCase.id);
    setForm({
      title: studyCase.title || '',
      category: studyCase.category || '',
      difficulty: studyCase.difficulty || 'advanced',
      passing_percentage: Number(studyCase.passing_percentage || 80),
      order_number: studyCase.order_number || '',
      is_active: Boolean(studyCase.is_active),
    });
    setPreviewCase({
      ...studyCase,
      content_json: studyCase.content_json || {},
      grading_json: studyCase.grading_json || {},
    });
    setJsonText(JSON.stringify({
      ...studyCase,
      content_json: studyCase.content_json || {},
      grading_json: studyCase.grading_json || {},
    }, null, 2));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function togglePublish(studyCase) {
    setBusy(true);
    try {
      await api(`/admin/cases/${studyCase.id}`, {
        method: 'PUT',
        body: {
          ...studyCase,
          is_active: !studyCase.is_active,
          order_number: studyCase.order_number ?? null,
          passing_percentage: studyCase.passing_percentage ?? 80,
        },
      });
      loadCases();
    } catch (error) {
      setStatus({ kind: 'err', text: error.message });
    } finally {
      setBusy(false);
    }
  }

  async function reorderCase(studyCase, nextOrder) {
    try {
      await api(`/admin/cases/${studyCase.id}`, {
        method: 'PUT',
        body: {
          ...studyCase,
          order_number: Number(nextOrder),
        },
      });
      loadCases();
    } catch (error) {
      setStatus({ kind: 'err', text: error.message });
    }
  }

  async function removeCase(studyCase) {
    if (!confirm(`Delete "${studyCase.title}"? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await api(`/admin/cases/${studyCase.id}`, { method: 'DELETE' });
      loadCases();
    } catch (error) {
      setStatus({ kind: 'err', text: error.message });
    } finally {
      setBusy(false);
    }
  }

  const previewBlocks = useMemo(
    () => previewCase?.content_json?.blocks || [],
    [previewCase]
  );

  if (loading) return <Loading label="Loading Kenya EMS Cases manager..." />;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Kenya EMS Cases JSON Upload Manager</h1>
          <div className="sub">Upload, preview, publish, reorder, and remove EMS worksheet cases.</div>
        </div>
      </div>

      <div className="card">
        <h2>Upload JSON case</h2>
        <div className="form-grid">
          <div className="field">
            <label>Title</label>
            <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="CASE STUDY 1: THE DUSIT D2 HOTEL TERROR ATTACK" />
          </div>
          <div className="field">
            <label>Category</label>
            <input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder="Mass Casualty / Terror Incident" />
          </div>
          <div className="field">
            <label>Difficulty</label>
            <input value={form.difficulty} onChange={(event) => setForm({ ...form, difficulty: event.target.value })} placeholder="advanced" />
          </div>
          <div className="field">
            <label>Passing percentage</label>
            <input type="number" min="0" max="100" value={form.passing_percentage} onChange={(event) => setForm({ ...form, passing_percentage: event.target.value })} />
          </div>
          <div className="field">
            <label>Order number</label>
            <input type="number" min="1" value={form.order_number} onChange={(event) => setForm({ ...form, order_number: event.target.value })} />
          </div>
          <div className="field">
            <label>Published</label>
            <select value={String(form.is_active)} onChange={(event) => setForm({ ...form, is_active: event.target.value === 'true' })}>
              <option value="false">Draft</option>
              <option value="true">Published</option>
            </select>
          </div>
        </div>

        <div className="field">
          <label>Upload JSON file</label>
          <input type="file" accept="application/json,.json" onChange={handleFile} />
        </div>

        <div className="field">
          <label>Case JSON</label>
          <textarea
            rows={12}
            value={jsonText}
            onChange={(event) => {
              setJsonText(event.target.value);
              const { value, error } = safeJsonParse(event.target.value);
              if (!error && value) setPreviewCase(extractPreviewCase(value));
            }}
            placeholder='Paste a full case JSON object here.'
          />
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="primary" onClick={() => saveCase(false)} disabled={busy}>
            {busy && !editingId ? 'Saving...' : editingId ? 'Update case' : 'Save draft'}
          </button>
          <button className="ghost" onClick={() => saveCase(true)} disabled={busy}>
            {busy && !editingId ? 'Publishing...' : editingId ? 'Update and publish' : 'Publish'}
          </button>
          {editingId ? (
            <button
              className="ghost"
              onClick={() => {
                setEditingId(null);
                setForm(EMPTY_FORM);
                setJsonText('');
                setPreviewCase(null);
              }}
            >
              Cancel edit
            </button>
          ) : null}
        </div>

        {status ? <div className={status.kind === 'ok' ? 'ok-note' : 'error-note'}>{status.text}</div> : null}
      </div>

      <div className="card">
        <h2>Preview</h2>
        {previewCase ? (
          <>
            <div className="sub" style={{ marginBottom: 12 }}>
              {previewCase.title} | {previewCase.category} | {previewCase.difficulty} | Pass mark {previewCase.passing_percentage}%
            </div>
            <CaseRenderer blocks={previewBlocks} responses={{}} onChange={() => {}} />
          </>
        ) : (
          <div className="sub">Upload a JSON case file to preview the worksheet before publishing.</div>
        )}
      </div>

      <div className="card">
        <h2>Published and draft cases</h2>
        <table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Title</th>
              <th>Category</th>
              <th>Difficulty</th>
              <th>Status</th>
              <th>Created by</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {cases.map((studyCase) => (
              <tr key={studyCase.id}>
                <td style={{ width: 88 }}>
                  <input
                    type="number"
                    min="1"
                    defaultValue={studyCase.order_number || ''}
                    onBlur={(event) => {
                      const nextOrder = event.target.value;
                      if (String(nextOrder || '').trim() && String(nextOrder) !== String(studyCase.order_number || '')) {
                        reorderCase(studyCase, nextOrder);
                      }
                    }}
                    style={{ width: 72 }}
                  />
                </td>
                <td>{studyCase.title}</td>
                <td>{studyCase.category}</td>
                <td>{studyCase.difficulty}</td>
                <td><span className={`badge ${studyCase.is_active ? 'published' : 'draft'}`}>{studyCase.is_active ? 'Published' : 'Draft'}</span></td>
                <td>{studyCase.created_by_name || '—'}</td>
                <td>{formatDate(studyCase.created_at)}</td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button className="ghost" onClick={() => editCase(studyCase)}>Edit</button>{' '}
                  <button className="ghost" onClick={() => togglePublish(studyCase)}>{studyCase.is_active ? 'Unpublish' : 'Publish'}</button>{' '}
                  <button className="ghost danger" onClick={() => removeCase(studyCase)}>Delete</button>
                </td>
              </tr>
            ))}
            {cases.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ color: 'var(--ink-soft)' }}>No Kenya EMS cases uploaded yet.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </>
  );
}
