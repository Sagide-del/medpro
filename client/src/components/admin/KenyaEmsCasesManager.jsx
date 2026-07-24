import { useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import Loading from '../shared/Loading';

function extractCaseArray(parsed) {
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed?.cases)) return parsed.cases;
  if (Array.isArray(parsed?.kenya_ems_cases)) return parsed.kenya_ems_cases;
  return [];
}

function validateCaseItem(caseItem, index) {
  const issues = [];
  const contentJson = caseItem?.content_json && typeof caseItem.content_json === 'object'
    ? caseItem.content_json
    : {};
  const caseNumber = Number(caseItem?.case_number ?? caseItem?.order_number);
  const passingScore = Number(caseItem?.passing_score ?? caseItem?.passing_percentage);

  if (!Number.isFinite(caseNumber)) issues.push('case_number is required');
  if (!String(caseItem?.title || '').trim()) issues.push('title is required');
  if (!String(caseItem?.category || '').trim()) issues.push('category is required');
  if (!String(caseItem?.difficulty || '').trim()) issues.push('difficulty is required');
  if (!Number.isFinite(passingScore)) issues.push('passing_score is required');
  if (!contentJson || typeof contentJson !== 'object') issues.push('content_json must be an object');
  if (String(contentJson.type || '').toLowerCase() !== 'worksheet') issues.push('content_json.type must be "worksheet"');
  if (!Array.isArray(contentJson.sections) || contentJson.sections.length === 0) issues.push('content_json.sections must contain at least one block');
  if (
    !Array.isArray(contentJson.blocks)
    && !Array.isArray(contentJson.sections)
    && !String(contentJson.source_text || '').trim()
    && !Array.isArray(contentJson.activities)
    && !contentJson.incident
    && !contentJson.dispatch_information
  ) {
    issues.push('content_json must include worksheet content');
  }

  return issues.map((issue) => `case ${index + 1}${caseItem?.title ? ` (${caseItem.title})` : ''}: ${issue}`);
}

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('en-KE');
  } catch {
    return '—';
  }
}

function previewText(caseItem) {
  const contentJson = caseItem?.content_json || {};
  return String(contentJson.source_text || contentJson.dispatch_information || JSON.stringify(contentJson, null, 2));
}

export default function KenyaEmsCasesManager() {
  const [cases, setCases] = useState([]);
  const [uploadedCases, setUploadedCases] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [jsonText, setJsonText] = useState('');
  const [errors, setErrors] = useState([]);
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

  const selectedCase = useMemo(() => uploadedCases[selectedIndex] || null, [uploadedCases, selectedIndex]);

  function handleJsonText(text) {
    setJsonText(text);
    try {
      const parsed = JSON.parse(text);
      const nextCases = extractCaseArray(parsed);
      setUploadedCases(nextCases);
      setSelectedIndex(0);
      const issues = nextCases.flatMap((caseItem, index) => validateCaseItem(caseItem, index));
      setErrors(issues);
      setStatus({
        kind: issues.length ? 'err' : 'ok',
        text: issues.length
          ? `Loaded ${nextCases.length} case(s) with validation issues.`
          : `Loaded ${nextCases.length} Kenya EMS case(s) successfully.`,
      });
    } catch {
      setUploadedCases([]);
      setErrors(['Invalid JSON file.']);
      setStatus({ kind: 'err', text: 'Invalid JSON file.' });
    }
  }

  function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => handleJsonText(String(reader.result || ''));
    reader.readAsText(file);
  }

  async function importCases(activateAll = false) {
    if (!uploadedCases.length) {
      setStatus({ kind: 'err', text: 'Upload a JSON file with Kenya EMS cases first.' });
      return;
    }
    if (errors.length) {
      setStatus({ kind: 'err', text: 'Resolve validation issues before importing.' });
      return;
    }

    setBusy(true);
    setStatus(null);
    try {
      const payload = {
        cases: uploadedCases.map((caseItem, index) => ({
          ...caseItem,
          is_active: activateAll ? true : Boolean(caseItem.is_active),
          case_number: Number(caseItem.case_number || caseItem.order_number || index + 1),
          order_number: Number(caseItem.order_number || caseItem.case_number || index + 1),
          passing_score: Number(caseItem.passing_score || caseItem.passing_percentage || 80),
        })),
      };

      const response = await api('/admin/cases/upload', {
        method: 'POST',
        body: payload,
      });

      setStatus({
        kind: 'ok',
        text: `Imported ${response?.cases?.length || uploadedCases.length} case(s) successfully.`,
      });
      loadCases();
    } catch (error) {
      setStatus({ kind: 'err', text: error.message });
    } finally {
      setBusy(false);
    }
  }

  async function togglePublish(studyCase) {
    setBusy(true);
    try {
      await api(`/admin/cases/${studyCase.id}`, {
        method: 'PUT',
        body: {
          ...studyCase,
          is_active: !studyCase.is_active,
          case_number: studyCase.case_number || studyCase.order_number || 1,
          order_number: studyCase.order_number || studyCase.case_number || 1,
          passing_score: studyCase.passing_score || studyCase.passing_percentage || 80,
          passing_percentage: studyCase.passing_percentage || studyCase.passing_score || 80,
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
          case_number: Number(nextOrder),
          order_number: Number(nextOrder),
        },
      });
      loadCases();
    } catch (error) {
      setStatus({ kind: 'err', text: error.message });
    }
  }

  async function deleteCase(studyCase) {
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

  if (loading) return <Loading label="Loading Kenya EMS Cases manager..." />;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Kenya EMS Cases JSON Upload Manager</h1>
          <div className="sub">Upload one JSON file containing all 15 cases, preview them, then import into the live content library.</div>
        </div>
      </div>

      <div className="card">
        <h2>Bulk JSON upload</h2>
        <div className="field">
          <label>Upload JSON case file</label>
          <input type="file" accept="application/json,.json" onChange={handleFile} />
        </div>
        <div className="field">
          <label>Paste JSON</label>
          <textarea
            rows={10}
            value={jsonText}
            onChange={(event) => handleJsonText(event.target.value)}
            placeholder="Upload or paste the full Kenya EMS cases JSON file."
          />
        </div>
        <div className="field">
          <label>Detected cases</label>
          <div className="sub">{uploadedCases.length} case(s) detected.</div>
        </div>
        {errors.length > 0 ? (
          <div className="error-note">
            {errors.slice(0, 6).map((error) => <div key={error}>{error}</div>)}
            {errors.length > 6 ? <div>...and {errors.length - 6} more</div> : null}
          </div>
        ) : null}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="primary" onClick={() => importCases(false)} disabled={busy || uploadedCases.length === 0 || errors.length > 0}>
            {busy ? 'Importing...' : 'Import cases'}
          </button>
          <button className="ghost" onClick={() => importCases(true)} disabled={busy || uploadedCases.length === 0 || errors.length > 0}>
            Import and publish all
          </button>
        </div>
        {status ? <div className={status.kind === 'ok' ? 'ok-note' : 'error-note'}>{status.text}</div> : null}
      </div>

      <div className="card">
        <h2>Detected case preview</h2>
        {selectedCase ? (
          <>
            <div className="form-grid">
              <div className="field">
                <label>Case title</label>
                <input readOnly value={selectedCase.title || ''} />
              </div>
              <div className="field">
                <label>Location</label>
                <input readOnly value={selectedCase.location || ''} />
              </div>
              <div className="field">
                <label>Incident date</label>
                <input readOnly value={selectedCase.incident_date || ''} />
              </div>
              <div className="field">
                <label>Passing score</label>
                <input readOnly value={selectedCase.passing_score ?? selectedCase.passing_percentage ?? 80} />
              </div>
            </div>
            <pre className="case-renderer-document" style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', marginTop: 16 }}>
              {previewText(selectedCase)}
            </pre>
          </>
        ) : (
          <div className="sub">Preview the uploaded file here before importing.</div>
        )}
        {uploadedCases.length > 1 ? (
          <div className="case-library-list" style={{ marginTop: 16 }}>
            {uploadedCases.map((caseItem, index) => (
              <button
                type="button"
                key={caseItem.id || `${caseItem.title}-${index}`}
                className="case-library-row"
                onClick={() => setSelectedIndex(index)}
                style={{ width: '100%', textAlign: 'left' }}
              >
                <div className="case-library-main">
                  <div className="case-study-order">Case {index + 1}</div>
                  <h2>{caseItem.title}</h2>
                  <p>{caseItem.location} | {caseItem.incident_date}</p>
                </div>
                <div className="case-library-side">
                  <span className={`badge ${caseItem.is_active ? 'published' : 'draft'}`}>{caseItem.is_active ? 'Published' : 'Draft'}</span>
                  <span>Pass mark: {caseItem.passing_score || caseItem.passing_percentage || 80}%</span>
                </div>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="card">
        <h2>Imported cases</h2>
        <table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Title</th>
              <th>Location</th>
              <th>Pass mark</th>
              <th>Status</th>
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
                    defaultValue={studyCase.case_number || studyCase.order_number || ''}
                    onBlur={(event) => {
                      const nextOrder = event.target.value;
                      if (String(nextOrder || '').trim() && String(nextOrder) !== String(studyCase.case_number || studyCase.order_number || '')) {
                        reorderCase(studyCase, nextOrder);
                      }
                    }}
                    style={{ width: 72 }}
                  />
                </td>
                <td>{studyCase.title}</td>
                <td>{studyCase.location || '—'}</td>
                <td>{studyCase.passing_score || studyCase.passing_percentage || 80}%</td>
                <td><span className={`badge ${studyCase.is_active ? 'published' : 'draft'}`}>{studyCase.is_active ? 'Published' : 'Draft'}</span></td>
                <td>{formatDate(studyCase.created_at)}</td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button className="ghost" onClick={() => togglePublish(studyCase)}>{studyCase.is_active ? 'Unpublish' : 'Publish'}</button>{' '}
                  <button className="ghost danger" onClick={() => deleteCase(studyCase)}>Delete</button>
                </td>
              </tr>
            ))}
            {cases.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ color: 'var(--ink-soft)' }}>No Kenya EMS cases imported yet.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </>
  );
}
