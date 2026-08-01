import { useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import ImageUploader from './ImageUploader';

function toQuestionList(item) {
  const content = item?.content_json || item?.content || {};
  return Array.isArray(content.questions) ? content.questions : Array.isArray(content.sections) ? content.sections : [];
}

export default function ContentCustomizer({ contentId, contentType, onSaved }) {
  const [item, setItem] = useState(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState([]);
  const [customization, setCustomization] = useState({
    schoolName: '',
    logoUrl: '',
    instructions: '',
    notes: '',
  });
  const [images, setImages] = useState([]);

  useEffect(() => {
    if (!contentId || !contentType) return;
    api(`/ai/customize/${encodeURIComponent(contentType)}/${contentId}`)
      .then((data) => {
        setItem(data.item);
        setSelected(toQuestionList(data.item).map((question, index) => ({ id: question.id || String(index + 1), selected: true })));
        setCustomization((current) => ({
          ...current,
          schoolName: data.item?.customization_json?.schoolName || '',
          logoUrl: data.item?.customization_json?.logoUrl || '',
          instructions: data.item?.customization_json?.instructions || '',
          notes: data.item?.customization_json?.notes || '',
        }));
        setImages(data.item?.customization_json?.images || []);
      })
      .catch((error) => setStatus(error.message));
  }, [contentId, contentType]);

  const questions = useMemo(() => toQuestionList(item), [item]);

  function toggleQuestion(id) {
    setSelected((current) => current.map((question) => (question.id === id ? { ...question, selected: !question.selected } : question)));
  }

  function updateQuestionField(index, field, value) {
    setItem((current) => {
      const nextQuestions = [...toQuestionList(current)];
      nextQuestions[index] = { ...nextQuestions[index], [field]: value };
      return {
        ...current,
        content_json: { ...(current?.content_json || {}), questions: nextQuestions },
      };
    });
  }

  async function save() {
    setBusy(true);
    setStatus('');
    try {
      const response = await api('/ai/customize/save', {
        method: 'POST',
        body: {
          type: contentType,
          id: contentId,
          customization: {
            ...customization,
            images,
            questions: questions.map((question, index) => ({
              ...question,
              selected: selected[index]?.selected !== false,
            })),
            content_json: item?.content_json || item?.content || {},
          },
        },
      });
      setStatus('Customization saved.');
      setItem(response.item);
      onSaved?.(response.item);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  }

  function printPreview() {
    const win = window.open('', '_blank', 'width=980,height=1200');
    if (!win) return;
    const printable = `
      <html>
        <head>
          <title>${customization.schoolName || item?.title || 'Content Preview'}</title>
          <style>
            body{font-family:Inter,Arial,sans-serif;padding:32px;color:#111827;}
            h1,h2{margin:0 0 12px;}
            .brand{font-size:14px;font-weight:700;color:#b91c1c;text-transform:uppercase;letter-spacing:.08em;}
            .box{border:1px solid #e5e7eb;border-radius:14px;padding:16px;margin:16px 0;}
            .question{margin:12px 0;padding:12px;border-left:4px solid #e63935;background:#f8f9fb;}
            img{max-width:180px;display:block;margin-bottom:12px;}
            @media print { button { display:none; } }
          </style>
        </head>
        <body>
          <div class="brand">${customization.schoolName || 'MedProHub'}</div>
          ${customization.logoUrl ? `<img src="${customization.logoUrl}" alt="School logo" />` : ''}
          <h1>${item?.title || 'Preview'}</h1>
          <div class="box">${customization.instructions || item?.description || ''}</div>
          ${(questions || []).filter((question, index) => selected[index]?.selected !== false).map((question, index) => `
            <div class="question">
              <strong>${question.title || question.prompt || question.text || `Question ${index + 1}`}</strong>
            </div>
          `).join('')}
        </body>
      </html>
    `;
    win.document.write(printable);
    win.document.close();
    win.focus();
    win.print();
  }

  if (!item) return <div className="card">{status || 'Loading content...'}</div>;

  return (
    <section className="card">
      <div className="section-head">
        <div>
          <h2>Content customizer</h2>
          <p>Update the selected content, brand it for a school, and preview before posting to students.</p>
        </div>
      </div>

      <div className="form-grid">
        <div className="field">
          <label>School name</label>
          <input value={customization.schoolName} onChange={(event) => setCustomization({ ...customization, schoolName: event.target.value })} />
        </div>
        <div className="field">
          <label>Logo URL</label>
          <input value={customization.logoUrl} onChange={(event) => setCustomization({ ...customization, logoUrl: event.target.value })} />
        </div>
      </div>

      <div className="field">
        <label>Custom instructions</label>
        <textarea rows={4} value={customization.instructions} onChange={(event) => setCustomization({ ...customization, instructions: event.target.value })} />
      </div>

      <ImageUploader
        label="Brand images"
        helper="Upload logos or supporting graphics for the branded version."
        images={images}
        onChange={setImages}
        multiple
      />

      <div className="card" style={{ marginTop: 16 }}>
        <h3>Selected content</h3>
        <div className="content-customizer-list">
          {questions.map((question, index) => (
            <div key={question.id || index} className="content-customizer-item">
              <label className="ai-generator-checkbox">
                <input
                  type="checkbox"
                  checked={selected[index]?.selected !== false}
                  onChange={() => toggleQuestion(question.id || String(index + 1))}
                />
                Include
              </label>
              <div className="field">
                <label>Question text</label>
                <textarea
                  rows={2}
                  value={question.title || question.prompt || question.text || ''}
                  onChange={(event) => updateQuestionField(index, 'title', event.target.value)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="logbook-actions" style={{ marginTop: 16 }}>
        <button type="button" className="primary" onClick={save} disabled={busy}>
          {busy ? 'Saving...' : 'Post to Students'}
        </button>
        <button type="button" className="ghost" onClick={printPreview}>
          Print Preview
        </button>
      </div>

      {status ? <div className="ok-note">{status}</div> : null}
    </section>
  );
}
