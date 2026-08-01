import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../../services/api';
import CaseRenderer from '../../student/CaseRenderer';
import ProgressBar from '../../common/ProgressBar';
import UiIcon from '../../shared/UiIcon';
import Loading from '../../shared/Loading';

const INITIAL_FORM = {
  eventType: 'MCI',
  location: 'Nairobi, Kenya',
  incidentDate: new Date().toISOString().slice(0, 10),
  difficulty: 'Intermediate',
  level: 'BOTH',
  patientCount: 8,
  incidentDescription: '',
  description: '',
};

function listToArray(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function countBlocks(sections = []) {
  return sections.filter((block) => block?.activityId || ['question', 'response_field', 'response_table', 'reflection'].includes(block?.type)).length;
}

export default function EmsCaseGenerator() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [form, setForm] = useState(INITIAL_FORM);
  const [draft, setDraft] = useState(null);
  const [cases, setCases] = useState(null);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [sourceFile, setSourceFile] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [publishTarget, setPublishTarget] = useState('selected_schools');
  const [studentIds, setStudentIds] = useState('');
  const [schoolIds, setSchoolIds] = useState('');

  const caseId = searchParams.get('caseId') || '';
  const sections = useMemo(() => draft?.content_json?.sections || draft?.stages || [], [draft]);

  useEffect(() => {
    api('/v1/admin/medprohub/ems/cases')
      .then((data) => setCases(Array.isArray(data?.cases) ? data.cases : []))
      .catch((error) => setStatus(error.message));
  }, []);

  useEffect(() => {
    if (!caseId) return undefined;
    let ignore = false;
    setBusy(true);
    api(`/v1/admin/medprohub/ems/${caseId}`)
      .then((data) => {
        if (ignore) return;
        const item = data?.caseStudy || null;
        setDraft(item);
        if (item) {
          setForm({
            eventType: item.event_type || 'MCI',
            location: item.location || 'Nairobi, Kenya',
            incidentDate: item.incident_date ? String(item.incident_date).slice(0, 10) : new Date().toISOString().slice(0, 10),
            difficulty: item.difficulty || 'Intermediate',
            level: item.level || 'BOTH',
            patientCount: Array.isArray(item.patient_table?.[0]?.rows) ? item.patient_table[0].rows.length : 8,
            incidentDescription: item.incident_briefing || '',
            description: item.description || '',
          });
        }
      })
      .catch((error) => setStatus(error.message))
      .finally(() => {
        if (!ignore) setBusy(false);
      });
    return () => {
      ignore = true;
    };
  }, [caseId]);

  async function loadCase(targetId) {
    setBusy(true);
    setStatus('');
    try {
      const data = await api(`/v1/admin/medprohub/ems/${targetId}`);
      setDraft(data.caseStudy || null);
      setSearchParams({ caseId: targetId });
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function generateCase() {
    setBusy(true);
    setStatus('');
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => payload.append(key, String(value ?? '')));
      payload.set('patientCount', String(form.patientCount || 8));
      if (sourceFile) payload.append('sourceFile', sourceFile);
      const data = await api('/v1/admin/medprohub/ems/generate', {
        method: 'POST',
        body: payload,
      });
      setDraft(data.draft);
      setStatus('EMS case generated and saved to the master bank.');
      setSearchParams({ caseId: data.draft.id });
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveDraft(nextStatus) {
    if (!draft?.id) return;
    setBusy(true);
    setStatus('');
    try {
      const response = await api(`/v1/admin/medprohub/ems/${draft.id}`, {
        method: 'PUT',
        body: {
          ...draft,
          ...form,
          status: nextStatus || draft.status,
        },
      });
      setDraft(response.caseStudy);
      setStatus(`Saved ${response.caseStudy.title}.`);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function setCaseStatus(nextStatus) {
    if (!draft?.id) return;
    setBusy(true);
    setStatus('');
    try {
      const response = await api(`/v1/admin/medprohub/ems/${draft.id}/${nextStatus}`, { method: 'POST' });
      setDraft(response.caseStudy);
      setStatus(`Case marked ${nextStatus}.`);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function publishDraft() {
    if (!draft?.id) return;
    setBusy(true);
    setStatus('');
    try {
      const response = await api(`/v1/admin/medprohub/ems/${draft.id}/publish`, {
        method: 'POST',
        body: {
          publishTarget,
          studentIds: listToArray(studentIds),
          schoolIds: listToArray(schoolIds),
        },
      });
      setDraft(response.caseStudy);
      setStatus('Case published.');
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function uploadImages(files) {
    if (!draft?.id || !files.length) return;
    setBusy(true);
    setStatus('');
    try {
      const payload = new FormData();
      files.forEach((file) => payload.append('images', file));
      const response = await api(`/v1/admin/medprohub/ems/${draft.id}/images`, {
        method: 'POST',
        body: payload,
      });
      setDraft(response.caseStudy);
      setStatus(`${response.imageUrls?.length || 0} image(s) attached.`);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  }

  if (cases === null && !draft) {
    return <Loading label="Loading Master AI Generator..." />;
  }

  return (
    <section className="page-stack">
      <div className="page-head">
        <div>
          <h1>Master AI Generator</h1>
          <div className="sub">Generate EMS cases, review the worksheet, approve, and publish to students or schools.</div>
        </div>
        <div className="logbook-actions">
          <Link className="ghost" to="/superadmin/medprohub/bank">Open EMS Bank</Link>
          <Link className="ghost" to="/superadmin/content">Legacy uploader</Link>
        </div>
      </div>

      <div className="grid-auto">
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Generate EMS Case</h2>
          <div className="form-grid">
            <label className="field">
              <span>Event Type</span>
              <select value={form.eventType} onChange={(event) => setForm((current) => ({ ...current, eventType: event.target.value }))}>
                <option>MCI</option>
                <option>Trauma</option>
                <option>Medical</option>
                <option>Terror</option>
                <option>Natural Disaster</option>
              </select>
            </label>
            <label className="field">
              <span>Location</span>
              <input value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} />
            </label>
            <label className="field">
              <span>Incident Date</span>
              <input type="date" value={form.incidentDate} onChange={(event) => setForm((current) => ({ ...current, incidentDate: event.target.value }))} />
            </label>
            <label className="field">
              <span>Difficulty</span>
              <select value={form.difficulty} onChange={(event) => setForm((current) => ({ ...current, difficulty: event.target.value }))}>
                <option>Basic</option>
                <option>Intermediate</option>
                <option>Advanced</option>
                <option>Paramedic</option>
              </select>
            </label>
            <label className="field">
              <span>Level</span>
              <select value={form.level} onChange={(event) => setForm((current) => ({ ...current, level: event.target.value }))}>
                <option value="EMT">EMT</option>
                <option value="PARAMEDIC">Paramedic</option>
                <option value="BOTH">Both</option>
              </select>
            </label>
            <label className="field">
              <span>Patient Count</span>
              <input
                type="range"
                min="5"
                max="15"
                value={form.patientCount}
                onChange={(event) => setForm((current) => ({ ...current, patientCount: Number(event.target.value) }))}
              />
              <small className="sub">{form.patientCount} patients</small>
            </label>
          </div>

          <label className="field">
            <span>Source mode</span>
            <input
              type="file"
              accept=".pdf,.txt,.doc,.docx"
              onChange={(event) => setSourceFile(event.target.files?.[0] || null)}
            />
            <small className="sub">Optional PDF or text source upload.</small>
          </label>

          <label className="field">
            <span>Incident Description</span>
            <textarea
              rows={6}
              value={form.incidentDescription}
              onChange={(event) => setForm((current) => ({ ...current, incidentDescription: event.target.value }))}
              placeholder="Paste the incident brief or extracted summary here."
            />
          </label>

          <div className="logbook-actions">
            <button type="button" className="primary" onClick={generateCase} disabled={busy}>
              {busy ? 'Generating...' : 'Generate EMS Case'}
            </button>
            <button type="button" className="ghost" onClick={() => setForm(INITIAL_FORM)} disabled={busy}>
              Reset
            </button>
          </div>

          {status ? <div className="ok-note" style={{ marginTop: 12 }}>{status}</div> : null}
        </div>

        <div className="card">
          <h2 style={{ marginTop: 0 }}>Master Bank Snapshot</h2>
          <ProgressBar
            label="Cases in bank"
            status={`${cases.length} cases loaded`}
            value={Math.min(100, cases.length * 5)}
          />
          <div style={{ marginTop: 12 }} className="grid-auto">
            {cases.slice(0, 4).map((item) => (
              <article key={item.id} className="card" style={{ margin: 0 }}>
                <h3 style={{ marginTop: 0 }}>{item.title}</h3>
                <p className="sub" style={{ marginTop: 0 }}>{item.level} · {item.difficulty} · {item.status}</p>
                <div className="logbook-actions">
                  <button type="button" className="ghost" onClick={() => loadCase(item.id)}>Load</button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      {draft ? (
        <div className="card">
          <div className="page-head" style={{ marginBottom: 0 }}>
            <div>
              <h2 style={{ marginTop: 0 }}>{draft.title}</h2>
              <div className="sub">{draft.level} · {draft.difficulty} · {draft.status}</div>
            </div>
            <div className="logbook-actions">
              <button type="button" className="ghost" onClick={() => saveDraft()}>Save draft</button>
              <button type="button" className="ghost" onClick={() => setCaseStatus('approved')}>Approve</button>
              <button type="button" className="ghost danger" onClick={() => setCaseStatus('rejected')}>Reject</button>
            </div>
          </div>

          <div className="form-grid">
            <label className="field">
              <span>Title</span>
              <input value={draft.title || ''} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} />
            </label>
            <label className="field">
              <span>Description</span>
              <textarea
                rows={3}
                value={draft.description || ''}
                onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
              />
            </label>
          </div>

          <div className="form-grid">
            <label className="field">
              <span>Publish target</span>
              <select value={publishTarget} onChange={(event) => setPublishTarget(event.target.value)}>
                <option value="selected_schools">Selected schools</option>
                <option value="all_schools">All schools</option>
                <option value="independent_students">Independent students</option>
              </select>
            </label>
            <label className="field">
              <span>Student IDs</span>
              <input value={studentIds} onChange={(event) => setStudentIds(event.target.value)} placeholder="Comma-separated student UUIDs" />
            </label>
            <label className="field">
              <span>School IDs</span>
              <input value={schoolIds} onChange={(event) => setSchoolIds(event.target.value)} placeholder="Comma-separated school UUIDs" />
            </label>
            <label className="field">
              <span>Attach images</span>
              <input type="file" multiple accept="image/*" onChange={(event) => setImageFiles(Array.from(event.target.files || []))} />
            </label>
          </div>

          <div className="logbook-actions">
            <button type="button" className="ghost" onClick={() => uploadImages(imageFiles)} disabled={!imageFiles.length || busy}>
              Upload images
            </button>
            <button type="button" className="primary" onClick={publishDraft} disabled={busy}>
              Publish case
            </button>
          </div>

          <div style={{ marginTop: 16 }}>
            <ProgressBar
              label="Worksheet completeness"
              status={`${countBlocks(sections)} editable blocks`}
              value={Math.min(100, countBlocks(sections) * 5)}
            />
          </div>

          <div style={{ marginTop: 16 }}>
            <CaseRenderer blocks={sections} responses={{}} onChange={() => {}} />
          </div>
        </div>
      ) : null}
    </section>
  );
}
