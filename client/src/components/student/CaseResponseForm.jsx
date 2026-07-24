function renderPrompt(text) {
  return String(text || '')
    .split('\n')
    .map((line, index) => (
      <div key={index} className={line.trim() ? 'case-document-line' : 'case-document-line blank'}>
        {line || '\u00A0'}
      </div>
    ));
}

function splitPromptAndResponseArea(prompt) {
  const marker = 'Your Response: (fill in)';
  const text = String(prompt || '');
  const index = text.indexOf(marker);
  if (index === -1) {
    return { promptText: text.trim(), responseLead: '' };
  }

  return {
    promptText: text.slice(0, index).trimEnd(),
    responseLead: marker,
  };
}

export default function CaseResponseForm({ activity, value = {}, onChange }) {
  const fields = activity?.fields || [];
  const { promptText, responseLead } = splitPromptAndResponseArea(activity.prompt);

  return (
    <section className="case-block case-block-form">
      <h3 className="case-question-heading">{activity.title}</h3>
      <div className="case-body-text">
        {renderPrompt(promptText)}
      </div>

      {responseLead && <div className="case-response-lead">{responseLead}</div>}

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
