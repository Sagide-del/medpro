// Every blank area from the original worksheet ("HOT ZONE: ________") becomes
// a labeled <textarea/> here. Used for both scored response fields and
// reflection prompts -- when a case has no discrete fields (a single open
// reflection blank), one full-width textarea is rendered instead.
function valueForField(value, fieldId) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  return String(value[fieldId] || '');
}

export default function ResponseBox({ fields = [], value, onChange, points, placeholder = 'Enter your response', reflection = false }) {
  if (fields.length === 0) {
    return (
      <div className={`kems-response-box${reflection ? ' kems-response-box-reflection' : ''}`}>
        {Number.isFinite(points) && <div className="kems-points-badge">{points} pts</div>}
        <label className="kems-response-field">
          <span>{reflection ? 'Reflection' : 'Your Response'}</span>
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
    <div className={`kems-response-box${reflection ? ' kems-response-box-reflection' : ''}`}>
      {Number.isFinite(points) && <div className="kems-points-badge">{points} pts</div>}
      <div className="kems-response-field-grid">
        {fields.map((field) => (
          <label key={field.id} className="kems-response-field">
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
