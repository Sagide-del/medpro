import UiIcon from '../../shared/UiIcon';
import DispatchCard from './DispatchCard';
import PatientAssessmentTable from './PatientAssessmentTable';
import QuestionCard from './QuestionCard';

function iconAndLabelForHeading(text) {
  const label = String(text || '').toLowerCase();
  if (label.includes('dispatch')) return ['dispatch', 'Dispatch'];
  if (label.includes('safety') || label.includes('hot zone') || label.includes('ppe')) return ['alert', 'Safety'];
  if (label.includes('triage') || label.includes('patient') || label.includes('assessment')) return ['cases', 'Patient assessment'];
  if (label.includes('certification') || label.includes('documentation') || label.includes('checklist')) return ['document', 'Documentation'];
  if (label.includes('reflection') || label.includes('reasoning') || label.includes('takeaway') || label.includes('analysis')) return ['activity', 'Clinical reasoning'];
  return ['cases', 'Scenario'];
}

export default function EMSSection({ node, response, onChange }) {
  if (node.type === 'heading') {
    if (node.level === 1) return null;
    const [icon, label] = iconAndLabelForHeading(node.text);
    return (
      <div className="ems-section-divider">
        <span className="ems-card-icon" aria-hidden="true"><UiIcon name={icon} /></span>
        <span className="ems-section-divider-label">{label}</span>
        <h2 className="ems-section-divider-text">{node.text}</h2>
      </div>
    );
  }

  if (node.type === 'paragraph') {
    return (
      <section className="ems-card ems-card-paragraph" aria-label="Scenario briefing">
        <span className="ems-card-icon" aria-hidden="true"><UiIcon name="document" /></span>
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
