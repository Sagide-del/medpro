import UiIcon from '../../../../shared/UiIcon';

function iconAndLabelForHeading(text) {
  const label = String(text || '').toLowerCase();
  if (label.includes('dispatch')) return ['dispatch', 'Dispatch'];
  if (label.includes('safety') || label.includes('hot zone') || label.includes('ppe')) return ['alert', 'Safety'];
  if (label.includes('statistic')) return ['progress', 'Incident statistics'];
  if (label.includes('triage') || label.includes('patient') || label.includes('assessment')) return ['cases', 'Patient assessment'];
  if (label.includes('role') || label.includes('briefing')) return ['document', 'Briefing'];
  if (label.includes('certification') || label.includes('documentation') || label.includes('checklist')) return ['document', 'Documentation'];
  if (label.includes('reflection') || label.includes('reasoning') || label.includes('takeaway') || label.includes('analysis')) return ['activity', 'Clinical reasoning'];
  return ['document', 'Incident background'];
}

export default function IncidentBriefing({ node }) {
  if (!node) return null;

  if (node.type === 'heading') {
    if (node.level === 1) return null;
    const [icon, label] = iconAndLabelForHeading(node.text);
    return (
      <div className="kems-section-divider">
        <span className="kems-card-icon" aria-hidden="true"><UiIcon name={icon} /></span>
        <span className="kems-section-divider-label">{label}</span>
        <h2 className="kems-section-divider-text">{node.text}</h2>
      </div>
    );
  }

  if (node.type === 'paragraph') {
    return (
      <section className="kems-card kems-card-paragraph" aria-label="Incident briefing">
        <div className="kems-card-head">
          <span className="kems-card-icon" aria-hidden="true"><UiIcon name="document" /></span>
          <span className="kems-card-label">Incident briefing</span>
        </div>
        <p>{node.text}</p>
      </section>
    );
  }

  return null;
}
