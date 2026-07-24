export default function CaseQuestionBlock({ activity, value = '', onChange }) {
  const options = activity?.options || [];

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

      {activity.type === 'multiple_choice' ? (
        <div className="mcq-option-list">
          {options.map((option) => (
            <label key={`${activity.id}-${option.key}`} className={`mcq-option ${value === option.key ? 'selected' : ''}`}>
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
      ) : (
        <label className="field case-field">
          <span>Your reflection</span>
          <textarea
            rows={6}
            value={value}
            placeholder="Enter your reflection"
            onChange={(event) => onChange(event.target.value)}
          />
        </label>
      )}
    </div>
  );
}
