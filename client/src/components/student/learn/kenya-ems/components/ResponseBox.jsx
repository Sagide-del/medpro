// Every blank area from the original worksheet ("HOT ZONE: ________") becomes
// a labeled <textarea/> here. Used for both scored response fields and
// reflection prompts -- when a case has no discrete fields (a single open
// reflection blank), one full-width textarea is rendered instead.
const RECOMMENDED_WORDS = 250;

function wordCount(text) {
  const trimmed = String(text || '').trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

function valueForField(value, fieldId) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  return String(value[fieldId] || '');
}

export default function ResponseBox({ fields = [], value, onChange, points, placeholder = 'Enter your response', reflection = false }) {
  if (fields.length === 0) {
    const text = typeof value === 'string' ? value : '';
    const count = wordCount(text);
    return (
      <div className={`kems-response-box${reflection ? ' kems-response-box-reflection' : ''}`}>
        {Number.isFinite(points) && <div className="kems-points-badge">{points} pts</div>}
        <label className="kems-response-field">
          <span>{reflection ? 'Reflection' : 'Your Response'}</span>
          <textarea
            rows={6}
            value={text}
            placeholder={placeholder}
            onChange={(event) => onChange(event.target.value)}
          />
        </label>
        <div className={`kems-word-hint${count > RECOMMENDED_WORDS ? ' over' : ''}`}>
          {count} words · {RECOMMENDED_WORDS} words recommended
        </div>
      </div>
    );
  }

  const combinedCount = fields.reduce((sum, field) => sum + wordCount(valueForField(value, field.id)), 0);

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
      <div className={`kems-word-hint${combinedCount > RECOMMENDED_WORDS ? ' over' : ''}`}>
        {combinedCount} words · {RECOMMENDED_WORDS} words recommended
      </div>
    </div>
  );
}
