import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ContentCustomizer from '../../components/common/ContentCustomizer';

export default function TeacherContentCustomizerPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [draftId, setDraftId] = useState(searchParams.get('contentId') || '');
  const contentId = searchParams.get('contentId') || draftId.trim();
  const contentType = searchParams.get('contentType') || 'case_study';

  const heading = useMemo(() => (
    contentId ? 'Content customizer' : 'Open a content item to start editing'
  ), [contentId]);

  return (
    <section className="page-stack">
      <div className="page-head">
        <div>
          <h1>Content Customizer</h1>
          <div className="sub">Brand a case for a class, review its questions, and post the tailored version to students.</div>
        </div>
      </div>

      <div className="card">
        <div className="form-grid">
          <div className="field">
            <label>Content ID</label>
            <input
              value={draftId}
              onChange={(event) => setDraftId(event.target.value)}
              placeholder="Paste a case UUID or content id"
            />
          </div>
          <div className="field">
            <label>Content type</label>
            <input value={contentType} readOnly />
          </div>
        </div>
        <div className="logbook-actions">
          <button type="button" className="primary" onClick={() => setSearchParams({ contentId: draftId.trim(), contentType })} disabled={!draftId.trim()}>
            Load content
          </button>
          <button type="button" className="ghost" onClick={() => setSearchParams({})}>
            Clear
          </button>
        </div>
        <div className="sub" style={{ marginTop: 10 }}>{heading}</div>
      </div>

      {contentId ? (
        <ContentCustomizer contentId={contentId} contentType={contentType} />
      ) : (
        <div className="card">
          <p style={{ margin: 0 }}>Select a content item from the content bank or paste an ID to open the editor.</p>
        </div>
      )}
    </section>
  );
}

