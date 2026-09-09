import UiIcon from '../shared/UiIcon';

const SECTIONS = [
  {
    number: '01',
    title: 'Clinical Judgment',
    format: 'Adaptive assessment',
    detail: 'Clinical reasoning and decision-making across emergency basics, trauma, and medical emergencies.',
    icon: 'exam',
    tone: 'blue',
  },
  {
    number: '02',
    title: 'Situational Judgment',
    format: 'Scenario assessment',
    detail: 'Ethics, leadership, professionalism, patient safety, and communication in EMS situations.',
    icon: 'cases',
    tone: 'violet',
  },
  {
    number: '03',
    title: 'Psychological Readiness',
    format: 'Scale and scenarios',
    detail: 'Emotional stability, empathy, resilience, stress management, and readiness for EMS work.',
    icon: 'activity',
    tone: 'green',
  },
];

export default function PsychometricTest() {
  return (
    <div className="psychometric-page">
      <header className="psychometric-intro">
        <span className="platform-eyebrow">Assessment workspace</span>
        <h1>Psychometric Test</h1>
        <p>Measure the judgment, professionalism, and resilience required in emergency medical services.</p>
      </header>

      <section className="psychometric-start-panel" aria-label="Assessment overview">
        <div>
          <span className="psychometric-start-icon"><UiIcon name="practice" /></span>
          <div>
            <h2>Assessment overview</h2>
            <p>Review the three assessment areas before you begin.</p>
          </div>
        </div>
        <span className="psychometric-status">Ready to begin</span>
      </section>

      <div className="psychometric-card-grid">
        {SECTIONS.map((section) => (
          <article className={`psychometric-card ${section.tone}`} key={section.number}>
            <div className="psychometric-card-top">
              <span>{section.number}</span>
              <UiIcon name={section.icon} />
            </div>
            <h2>{section.title}</h2>
            <strong>{section.format}</strong>
            <p>{section.detail}</p>
            <button type="button">Review section <UiIcon name="arrowRight" /></button>
          </article>
        ))}
      </div>
    </div>
  );
}
