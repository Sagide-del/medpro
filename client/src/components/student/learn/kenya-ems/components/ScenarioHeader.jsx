// Premium scenario header -- case number badge, title, location/date, and a
// row of meta chips (category, difficulty, pass mark, progress, save status).
export default function ScenarioHeader({ caseData, answeredCount, totalGradable, saveState }) {
  if (!caseData) return null;

  return (
    <header className="kems-case-header">
      <div className="kems-case-header-kicker">
        <span className="kems-card-icon" aria-hidden="true">🚑</span>
        Case {caseData.id}
        <span className="kems-alert-chip" aria-hidden="true">🚨 Live Scenario</span>
      </div>
      <h1 className="kems-case-title">{caseData.title}</h1>
      <p className="kems-case-subtitle">
        {caseData.location}{caseData.incidentDate ? ` · ${caseData.incidentDate}` : ''}
      </p>
      <div className="kems-case-meta-row">
        <span className="kems-meta-chip">{caseData.category}</span>
        <span className="kems-meta-chip">{caseData.difficulty}</span>
        <span className="kems-meta-chip">Pass mark: {caseData.passingScore}%</span>
        {Number.isFinite(totalGradable) && (
          <span className="kems-meta-chip">Answered {answeredCount} of {totalGradable}</span>
        )}
        {saveState && <span className="kems-meta-chip kems-save-chip">Save status: {saveState}</span>}
      </div>
    </header>
  );
}
