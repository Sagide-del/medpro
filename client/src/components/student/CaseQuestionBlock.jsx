function renderPrompt(text) {
  return String(text || '')
    .split('\n')
    .map((line, index) => (
      <div key={index} className={line.trim() ? 'case-document-line' : 'case-document-line blank'}>
        {line || '\u00A0'}
      </div>
    ));
}

function parseReflectionQuestions(prompt) {
  const matches = [...String(prompt || '').matchAll(/^\d+\.\s+(.+)$/gm)];
  return matches.map((match) => match[1].trim());
}

export default function CaseQuestionBlock({ activity, value = '', onChange }) {
  const options = activity?.options || [];
  const reflectionQuestions = activity.type === 'reflection' ? parseReflectionQuestions(activity.prompt) : [];
  const reflectionValues = typeof value === 'object' && value !== null ? value : {};

  return (
    <section className="case-block case-block-question">
      <h3 className="case-question-heading">{activity.title}</h3>
      <div className="case-body-text">
        {renderPrompt(activity.prompt)}
      </div>

      {activity.type === 'multiple_choice' ? (
        <div className="case-option-list">
          {options.map((option) => (
            <label key={`${activity.id}-${option.key}`} className="case-option">
              <input
                type="radio"
                name={activity.id}
                value={option.key}
                checked={value === option.key}
                onChange={() => onChange(option.key)}
              />
              <span>{option.key}. {option.label}</span>
            </label>
          ))}
        </div>
      ) : reflectionQuestions.length > 0 ? (
        <div className="case-response-form">
          {reflectionQuestions.map((question, index) => (
            <label key={`${activity.id}-reflection-${index}`} className="case-response-field">
              <span>{index + 1}. {question}</span>
              <textarea
                rows={5}
                value={reflectionValues[index] || ''}
                placeholder="Enter your response"
                onChange={(event) => onChange({
                  ...reflectionValues,
                  [index]: event.target.value,
                })}
              />
            </label>
          ))}
        </div>
      ) : (
        <label className="case-response-field">
          <span>Response</span>
          <textarea
            rows={6}
            value={typeof value === 'string' ? value : ''}
            placeholder="Enter your response"
            onChange={(event) => onChange(event.target.value)}
          />
        </label>
      )}
    </section>
  );
}
