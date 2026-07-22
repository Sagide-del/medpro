import { Link } from 'react-router-dom';

const PREP_MODULES = [
  {
    to: '/student/question-bank',
    title: 'Question Bank',
    description: 'Browse published EMS questions across quizzes, exams, and scenario-based assessments.',
  },
  {
    to: '/student/mock-exams',
    title: 'Mock Exams',
    description: 'Use the current assessment catalogue as timed prep while dedicated mock-exam tracks are expanded.',
  },
  {
    to: '/student/cats',
    title: 'CATs',
    description: 'Practice continuous assessment tests using the live MedProHub assessment engine.',
  },
  {
    to: '/student/assessments',
    title: 'Assessments',
    description: 'Open the full assessment catalogue, including quizzes, exams, and clinical judgment scenarios.',
  },
  {
    to: '/student/flashcards',
    title: 'Clinical Recall Cards',
    description: 'Use spaced repetition to reinforce drugs, procedures, and critical EMS knowledge points.',
  },
  {
    to: '/student/reference-cards',
    title: 'Clinical Reference Cards',
    description: 'Review airway, trauma, cardiology, and other visual bedside references from the content library.',
  },
];

export default function ExamPreparation() {
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Exam Preparation</h1>
          <div className="sub">Build readiness across question practice, recall, and clinical reference review.</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <h2>How this section works today</h2>
        <p style={{ color: 'var(--ink-soft)', marginBottom: 0 }}>
          MedProHub already has a working assessment engine, subscription checks, and study content. This portal groups
          those tools into a cleaner EMS exam-preparation flow while we continue the deeper stage-by-stage rollout.
        </p>
      </div>

      <div className="form-grid">
        {PREP_MODULES.map((module) => (
          <Link key={module.to} to={module.to} style={{ textDecoration: 'none' }}>
            <div className="card" style={{ height: '100%' }}>
              <h2>{module.title}</h2>
              <p style={{ color: 'var(--ink-soft)', fontSize: 13, marginBottom: 0 }}>{module.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
