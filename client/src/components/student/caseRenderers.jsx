function valueForField(responseValue, fieldId) {
  if (responseValue == null) return '';
  if (typeof responseValue === 'string') return responseValue;
  return String(responseValue[fieldId] || '');
}

export function IncidentBackgroundRenderer({ title, locationLine, background }) {
  return (
    <section className="case-renderer-block">
      <h1 className="case-renderer-title">{title}</h1>
      {locationLine ? <p className="case-renderer-paragraph subtitle">{locationLine}</p> : null}
      <div className="case-renderer-document-body">
        {String(background || '').split(/\r?\n\r?\n/).map((paragraph, index) => (
          <p key={`${title || 'incident'}-${index}`} className="case-renderer-paragraph">
            {paragraph}
          </p>
        ))}
      </div>
    </section>
  );
}

export function StatisticsTableRenderer({ headers = [], rows = [] }) {
  return (
    <div className="case-renderer-table-wrap">
      <table className="case-renderer-table">
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th key={`header-${index}`}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={`row-${rowIndex}`}>
              {row.map((cell, cellIndex) => (
                <td key={`cell-${rowIndex}-${cellIndex}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DispatchRenderer({ text }) {
  return <pre className="case-renderer-info">{text}</pre>;
}

export function PatientTableRenderer({ headers = [], rows = [] }) {
  return (
    <div className="case-renderer-table-wrap">
      <table className="case-renderer-table">
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th key={`patient-header-${index}`}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={`patient-row-${rowIndex}`}>
              {row.map((cell, cellIndex) => (
                <td key={`patient-cell-${rowIndex}-${cellIndex}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function StudentResponseRenderer({ block, value, onChange }) {
  if (block.input_type === 'multiple_choice' && Array.isArray(block.options) && block.options.length > 0) {
    return (
      <div className="case-renderer-response">
        <div className="case-renderer-response-meta">
          <span>{block.grading?.points || 0} points</span>
        </div>
        <div className="case-renderer-options">
          {block.options.map((option) => {
            const optionKey = String(option.key || '').toUpperCase();
            return (
              <label key={`${block.id}-${optionKey}`} className="case-renderer-option">
                <input
                  type="radio"
                  name={block.activityId}
                  value={optionKey}
                  checked={String(value || '').toUpperCase() === optionKey}
                  onChange={(event) => onChange(block.activityId, event.target.value)}
                />
                <span>{optionKey}. {option.label}</span>
              </label>
            );
          })}
        </div>
      </div>
    );
  }

  const fields = Array.isArray(block.fields) ? block.fields : [];
  return (
    <div className="case-renderer-response">
      <div className="case-renderer-response-meta">
        <span>{block.grading?.points || 0} points</span>
        {block.grading?.criteria ? <span>{block.grading.criteria}</span> : null}
      </div>
      <div className="case-renderer-field-grid">
        {fields.length > 0 ? fields.map((field) => (
          <label key={`${block.id}-${field.id}`} className="case-renderer-field">
            <span>{field.label}</span>
            <textarea
              rows={field.type === 'textarea' ? 5 : 3}
              value={valueForField(value, field.id)}
              onChange={(event) => onChange(block.activityId, {
                ...(typeof value === 'object' && value ? value : {}),
                [field.id]: event.target.value,
              })}
            />
          </label>
        )) : (
          <label className="case-renderer-field">
            <span>Your Response</span>
            <textarea
              rows={6}
              value={typeof value === 'string' ? value : ''}
              onChange={(event) => onChange(block.activityId, event.target.value)}
            />
          </label>
        )}
      </div>
    </div>
  );
}

export function TriageRenderer({ block, value, onChange }) {
  return (
    <div className="case-renderer-response">
      <div className="case-renderer-response-meta">
        <span>{block.grading?.points || 0} points</span>
        {block.grading?.criteria ? <span>{block.grading.criteria}</span> : null}
      </div>
      <div className="case-renderer-field-grid">
        {(Array.isArray(block.fields) ? block.fields : []).map((field) => (
          <label key={`${block.id}-${field.id}`} className="case-renderer-field">
            <span>{field.label}</span>
            <textarea
              rows={4}
              value={valueForField(value, field.id)}
              onChange={(event) => onChange(block.activityId, {
                ...(typeof value === 'object' && value ? value : {}),
                [field.id]: event.target.value,
              })}
            />
          </label>
        ))}
      </div>
    </div>
  );
}

export function ReflectionRenderer({ block, value, onChange }) {
  return (
    <div className="case-renderer-reflection">
      {Array.isArray(block.fields) && block.fields.length > 0 ? block.fields.map((field) => (
        <label key={`${block.id}-${field.id}`} className="case-renderer-field">
          <span>{field.label}</span>
          <textarea
            rows={5}
            value={valueForField(value, field.id)}
            onChange={(event) => onChange(block.activityId, {
              ...(typeof value === 'object' && value ? value : {}),
              [field.id]: event.target.value,
            })}
          />
        </label>
      )) : (
        <label className="case-renderer-field">
          <span>Reflection</span>
          <textarea
            rows={6}
            value={typeof value === 'string' ? value : ''}
            onChange={(event) => onChange(block.activityId, event.target.value)}
          />
        </label>
      )}
    </div>
  );
}

