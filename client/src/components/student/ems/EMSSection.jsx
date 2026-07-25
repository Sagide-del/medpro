import DispatchCard from './DispatchCard';
import PatientAssessmentTable from './PatientAssessmentTable';
import QuestionCard from './QuestionCard';

function iconAndLabelForHeading(text) {
  const label = String(text || '').toLowerCase();
  if (label.includes('dispatch')) return ['📡', 'Dispatch'];
  if (label.includes('safety') || label.includes('hot zone') || label.includes('ppe')) return ['⚠️', 'Safety Alert'];
  if (label.includes('triage') || label.includes('patient') || label.includes('assessment')) return ['🩸', 'Patient Assessment'];
  if (label.includes('certification') || label.includes('documentation') || label.includes('checklist')) return ['📋', 'Documentation'];
  if (label.includes('reflection') || label.includes('reasoning') || label.includes('takeaway') || label.includes('analysis')) return ['🧠', 'Clinical Reasoning'];
  return ['🚑', 'Scenario'];
}

// Every worksheet block becomes a styled card here -- the student page never
// shows a bare, unstyled paragraph.
export default function EMSSection({ node, response, onChange }) {
  if (node.type === 'heading') {
    if (node.level === 1) return null; // shown once in the EMSCaseContainer header instead
    const [icon, label] = iconAndLabelForHeading(node.text);
    return (
      <div className="ems-section-divider">
        <span className="ems-card-icon" aria-hidden="true">{icon}</span>
        <span className="ems-section-divider-label">{label}</span>
        <h2 className="ems-section-divider-text">{node.text}</h2>
      </div>
    );
  }

  if (node.type === 'paragraph') {
    return (
      <section className="ems-card ems-card-paragraph" aria-label="Scenario briefing">
        <span className="ems-card-icon" aria-hidden="true">🚑</span>
        <p>{node.text}</p>
      </section>
    );
  }

  if (node.type === 'dispatch') {
    return <DispatchCard text={node.text} />;
  }

  if (node.type === 'table') {
    return <PatientAssessmentTable headers={node.headers} rows={node.rows} />;
  }

  if (node.type === 'qa') {
    return (
      <QuestionCard
        question={node.question}
        answer={node.answer}
        value={response}
        onChange={onChange}
      />
    );
  }

  return null;
}
