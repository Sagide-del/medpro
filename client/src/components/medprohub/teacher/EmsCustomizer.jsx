import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../../services/api';
import CaseRenderer from '../../student/CaseRenderer';
import UiIcon from '../../shared/UiIcon';
import Loading from '../../shared/Loading';

function cloneSections(sections = []) {
  return sections.map((section) => ({
    ...section,
    fields: Array.isArray(section.fields) ? section.fields.map((field) => ({ ...field })) : section.fields,
    options: Array.isArray(section.options) ? section.options.map((option) => ({ ...option })) : section.options,
  }));
}

export default function EmsCustomizer() {
  const { id } = useParams();
  const [master, setMaster] = useState(null);
  const [editedBlocks, setEditedBlocks] = useState([]);
  const [selectedBlocks, setSelectedBlocks] = useState([]);
  const [customizationId, setCustomizationId] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [schoolLogo, setSchoolLogo] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id || id === 'new') return undefined;
    setBusy(true);
    api(`/v1/teacher/medprohub/ems/bank/${id}`)
      .then((data) => {
        const item = data?.caseStudy || null;
        setMaster(item);
        const sections = cloneSections(item?.content_json?.sections || []);
        setEditedBlocks(sections);
        setSelectedBlocks(sections.map((section) => section.id));
        setCustomTitle(item?.title || '');
        setCustomDescription(item?.description || '');
      })
      .catch((error) => setStatus(error.message))
      .finally(() => setBusy(false));
  }, [id]);

  const previewBlocks = useMemo(
    () => editedBlocks.filter((block) => selectedBlocks.includes(block.id)),
    [editedBlocks, selectedBlocks]
  );

  function toggleBlock(blockId) {
    setSelectedBlocks((current) => (current.includes(blockId)
      ? current.filter((item) => item !== blockId)
      : [...current, blockId]));
  }

  function updateBlock(blockId, field, value) {
    setEditedBlocks((current) => current.map((block) => {
      if (block.id !== blockId) return block;
      if (field === 'text') return { ...block, text: value };
      if (field === 'title') return { ...block, title: value };
      if (field === 'fieldLabel') {
        const fields = Array.isArray(block.fields) ? block.fields.map((item, index) => (index === 0 ? { ...item, label: value } : item)) : block.fields;
        return { ...block, fields };
      }
      return block;
    }));
  }

  async function saveCustomization(nextStatus = 'draft') {
    if (!master?.id) return;
    setBusy(true);
    setStatus('');
    try {
      const response = await api('/v1/teacher/medprohub/ems/customize', {
        method: 'POST',
        body: {
          masterId: master.id,
          customTitle,
          customDescription,
          schoolLogo,
          selectedQuestions: selectedBlocks,
          customQuestions: previewBlocks,
          status: nextStatus,
        },
      });
      setCustomizationId(response?.content?.id || '');
      setStatus('Customization saved.');
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function publishCustomization() {
    if (!customizationId) {
      await saveCustomization('draft');
      return;
    }
    setBusy(true);
    setStatus('');
    try {
      const response = await api('/v1/teacher/medprohub/ems/publish', {
        method: 'POST',
        body: { id: customizationId },
      });
      setStatus(`Published ${response.content?.title || customTitle || 'customized content'}.`);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  }

  if (!id || id === 'new') {
    return (
      <section className="page-stack">
        <div className="page-head">
          <div>
            <h1>Customize EMS Case</h1>
            <div className="sub">Open a case from the bank to create a class-specific version.</div>
          </div>
          <Link className="ghost" to="/teacher/medprohub/bank">Back to bank</Link>
        </div>
        <div className="card">
          <p style={{ margin: 0 }}>Choose a case from the EMS bank to customize it for your class.</p>
        </div>
      </section>
    );
  }

  if (busy && !master) return <Loading label="Loading customizer..." />;
  if (!master) return <div className="alert">Open a case from the bank to begin customizing.</div>;

  return (
    <section className="page-stack">
      <div className="page-head">
        <div>
          <h1>Customize EMS Case</h1>
          <div className="sub">Rename the case, adjust the worksheet, and publish it to your students.</div>
        </div>
        <div className="logbook-actions">
          <Link className="ghost" to="/teacher/medprohub/bank">Back to bank</Link>
          <button type="button" className="ghost" onClick={() => saveCustomization('draft')} disabled={busy}>Save customization</button>
          <button type="button" className="primary" onClick={publishCustomization} disabled={busy}>Post to students</button>
        </div>
      </div>

      <div className="grid-auto">
        <div className="card">
          <div className="form-grid">
            <label className="field">
              <span>Custom Title</span>
              <input value={customTitle} onChange={(event) => setCustomTitle(event.target.value)} />
            </label>
            <label className="field">
              <span>School Logo URL</span>
              <input value={schoolLogo} onChange={(event) => setSchoolLogo(event.target.value)} placeholder="https://..." />
            </label>
          </div>
          <label className="field">
            <span>Custom Description</span>
            <textarea rows={3} value={customDescription} onChange={(event) => setCustomDescription(event.target.value)} />
          </label>

          <div className="logbook-actions" style={{ marginTop: 12 }}>
            <button type="button" className="ghost" onClick={() => setSelectedBlocks(master?.content_json?.sections?.map((section) => section.id) || [])}>
              Select all
            </button>
            <button type="button" className="ghost" onClick={() => setSelectedBlocks([])}>
              Clear all
            </button>
          </div>

          <div style={{ marginTop: 12 }} className="grid-auto">
            {editedBlocks.map((block) => {
              const editable = ['heading', 'paragraph', 'question', 'instruction', 'dispatch_box', 'dispatch'].includes(block.type);
              return (
                <article key={block.id} className="card" style={{ margin: 0 }}>
                  <label className="ai-generator-checkbox" style={{ marginBottom: 8 }}>
                    <input type="checkbox" checked={selectedBlocks.includes(block.id)} onChange={() => toggleBlock(block.id)} />
                    Include block
                  </label>
                  <div className="sub" style={{ marginBottom: 6 }}>{block.type}</div>
                  {editable ? (
                    <textarea
                      rows={block.type === 'question' ? 5 : 3}
                      value={block.text || ''}
                      onChange={(event) => updateBlock(block.id, 'text', event.target.value)}
                    />
                  ) : block.type === 'response_field' ? (
                    <textarea
                      rows={3}
                      value={Array.isArray(block.fields) && block.fields.length ? block.fields[0]?.label || '' : ''}
                      onChange={(event) => updateBlock(block.id, 'fieldLabel', event.target.value)}
                    />
                  ) : (
                    <pre className="case-renderer-info" style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                      {JSON.stringify(block, null, 2)}
                    </pre>
                  )}
                </article>
              );
            })}
          </div>

          {status ? <div className="ok-note" style={{ marginTop: 12 }}>{status}</div> : null}
        </div>

        <div className="card">
          <div className="page-head" style={{ marginBottom: 8 }}>
            <div>
              <h2 style={{ marginTop: 0 }}>{customTitle || master.title}</h2>
              <div className="sub">{master.level} · {master.difficulty}</div>
            </div>
            <UiIcon name="learn" />
          </div>
          <CaseRenderer blocks={previewBlocks} responses={{}} onChange={() => {}} />
        </div>
      </div>
    </section>
  );
}

