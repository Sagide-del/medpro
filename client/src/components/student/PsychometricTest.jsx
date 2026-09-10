import UiIcon from '../shared/UiIcon';
import heroImage from '../../assets/hero-paramedics.png';

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
    <div className="psychometric-page psychometric-reference-layout">
      <div className="psychometric-main-column">
        <header className="psychometric-intro" style={{ '--psychometric-hero-image': `url(${heroImage})` }}>
          <div className="psychometric-intro-copy"><span className="platform-eyebrow">Assessment workspace</span><h1>Psychometric Test</h1><p>Measure the judgment, professionalism, and resilience required in emergency medical services.</p><button type="button" className="psychometric-begin">Begin assessment <UiIcon name="arrowRight" /></button></div>
          <div className="psychometric-hero-badge"><UiIcon name="shield" /><span>Be prepared.<br />Make a difference.</span></div>
        </header>
        <section className="psychometric-metrics" aria-label="Assessment metrics"><div><UiIcon name="learn" /><strong>3</strong><span>Assessment sections</span><small>Complete all sections</small></div><div><UiIcon name="document" /><strong>75</strong><span>Total questions</span><small>Across all sections</small></div><div><UiIcon name="simulation" /><strong>90</strong><span>Estimated time</span><small>Approximately 90 minutes</small></div></section>
        <section className="psychometric-overview"><div className="psychometric-overview-head"><div><UiIcon name="document" /><div><h2>Assessment overview</h2><p>Review the three assessment areas before you begin.</p></div></div></div><div className="psychometric-card-grid">
        {SECTIONS.map((section) => (
          <article className={`psychometric-card ${section.tone}`} key={section.number}>
            <div className="psychometric-card-top">
              <span>{section.number}</span>
              <UiIcon name={section.icon} />
            </div>
            <h2>{section.title}</h2>
            <strong>{section.format}</strong>
            <p>{section.detail}</p>
            <div className="psychometric-card-meta"><span><UiIcon name="document" />25 questions</span><span><UiIcon name="simulation" />~30 min</span><span><i />Not started</span></div><button type="button">View details <UiIcon name="arrowRight" /></button>
          </article>
        ))}
        </div></section>
      </div>
      <aside className="psychometric-side-column"><section className="psychometric-readiness"><h2>Assessment readiness</h2><div className="psychometric-ring"><strong>0%</strong><span>Complete</span></div><b>Not started yet</b><p>Review the sections and instructions before beginning.</p></section><section className="psychometric-instructions"><div className="psychometric-side-title"><UiIcon name="document" /><h2>Instructions</h2></div>{[['practice', 'Review all sections', 'Familiarize yourself with the assessment areas.'], ['simulation', 'Find a quiet space', 'Minimize distractions for the best experience.'], ['document', 'Answer honestly', 'There are no right or wrong answers.'], ['shield', 'Take your time', 'Complete all sections in one sitting if possible.']].map(([icon, title, detail]) => <div className="psychometric-instruction" key={title}><span><UiIcon name={icon} /></span><div><strong>{title}</strong><p>{detail}</p></div></div>)}<div className="psychometric-side-note"><UiIcon name="alert" /><span>Your results help identify your strengths and areas for growth in EMS practice.</span></div></section></aside>
    </div>
  );
}
