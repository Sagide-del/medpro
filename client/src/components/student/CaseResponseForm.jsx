function renderPrompt(text) {
  return String(text || '')
    .split('\n')
    .map((line, index) => (
      <div key={index} className={line.trim() ? 'case-document-line' : 'case-document-line blank'}>
        {line || '\u00A0'}
      </div>
    ));
}

export default function CaseResponseForm({ activity, value = {}, onChange }) {
  const fields = activity?.fields || [];

  return (
    <section className="case-block case-block-form">
      <h3 className="case-question-heading">{activity.title}</h3>
      <div className="case-body-text">
        {renderPrompt(activity.prompt)}
      </div>

      <div className="case-response-form">
        {fields.map((field) => (
          <label key={field.id} className="case-response-field">
            <span>{field.label}</span>
            <textarea
              rows={4}
              value={value[field.id] || ''}
              placeholder={field.placeholder || 'Enter your response'}
              onChange={(event) => onChange(field.id, event.target.value)}
            />
          </label>
        ))}
      </div>
    </section>
  );
}
