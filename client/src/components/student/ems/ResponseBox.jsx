function valueForField(value, fieldId) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  return String(value[fieldId] || '');
}

export default function ResponseBox({ fields = [], value, onChange, points, placeholder = 'Enter your response', reflection = false }) {
  if (fields.length === 0) {
    return (
      <div className={`ems-response-box${reflection ? ' ems-response-box-reflection' : ''}`}>
        {Number.isFinite(points) && <div className="ems-points-badge">{points} points</div>}
        <label className="ems-response-field">
          <span>{reflection ? 'Reflection' : 'Your response'}</span>
          <textarea
            rows={6}
            value={typeof value === 'string' ? value : ''}
            placeholder={placeholder}
            onChange={(event) => onChange(event.target.value)}
          />
        </label>
      </div>
    );
  }

  return (
    <div className={`ems-response-box${reflection ? ' ems-response-box-reflection' : ''}`}>
      {Number.isFinite(points) && <div className="ems-points-badge">{points} points</div>}
      <div className="ems-response-field-grid">
        {fields.map((field) => (
          <label key={field.id} className="ems-response-field">
            <span>{field.label}</span>
            <textarea
              rows={field.type === 'textarea' ? 4 : 2}
              value={valueForField(value, field.id)}
              placeholder={field.placeholder || placeholder}
              onChange={(event) => onChange({
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
