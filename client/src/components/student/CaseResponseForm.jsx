export default function CaseResponseForm({ activity, value = {}, onChange }) {
  const fields = activity?.fields || [];

  return (
    <div className="card case-activity-card">
      <div className="mcq-review-head">
        <div>
          <div className="case-section-kicker">{activity.phase}</div>
          <h2>{activity.title}</h2>
        </div>
        <span className="badge draft">{activity.points} pts</span>
      </div>

      <pre className="case-phase-body">{activity.prompt}</pre>

      <div className="case-form-grid">
        {fields.map((field) => (
          <label key={field.id} className="field case-field">
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
    </div>
  );
}
