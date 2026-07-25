// 📋 Renders the narrative worksheet blocks that aren't dispatch/table/question
// content: section-divider headings (background, incident statistics, EMT role
// briefing, etc.) and the paragraph text underneath them.
function iconAndLabelForHeading(text) {
  const label = String(text || '').toLowerCase();
  if (label.includes('dispatch')) return ['📡', 'Dispatch'];
  if (label.includes('safety') || label.includes('hot zone') || label.includes('ppe')) return ['⚠️', 'Safety Alert'];
  if (label.includes('statistic')) return ['📊', 'Incident Statistics'];
  if (label.includes('triage') || label.includes('patient') || label.includes('assessment')) return ['🩸', 'Patient Assessment'];
  if (label.includes('role') || label.includes('briefing')) return ['🚑', 'EMT Role Briefing'];
  if (label.includes('certification') || label.includes('documentation') || label.includes('checklist')) return ['📋', 'Documentation'];
  if (label.includes('reflection') || label.includes('reasoning') || label.includes('takeaway') || label.includes('analysis')) return ['🧠', 'Clinical Reasoning'];
  return ['📋', 'Incident Background'];
}

export default function IncidentBriefing({ node }) {
  if (!node) return null;

  if (node.type === 'heading') {
    if (node.level === 1) return null; // shown once in ScenarioHeader instead
    const [icon, label] = iconAndLabelForHeading(node.text);
    return (
      <div className="kems-section-divider">
        <span className="kems-card-icon" aria-hidden="true">{icon}</span>
        <span className="kems-section-divider-label">{label}</span>
        <h2 className="kems-section-divider-text">{node.text}</h2>
      </div>
    );
  }

  if (node.type === 'paragraph') {
    return (
      <section className="kems-card kems-card-paragraph" aria-label="Incident background">
        <span className="kems-card-icon" aria-hidden="true">📋</span>
        <p>{node.text}</p>
      </section>
    );
  }

  return null;
}
