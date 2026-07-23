import { Link } from 'react-router-dom';

const PREP_MODULES = [
  {
    to: '/student/mcq-questions',
    title: 'MCQ Questions',
    description: 'Practice mobile-friendly multiple-choice drills built from the current EMS assessment catalogue.',
    accent: '#c62828',
  },
  {
    to: '/student/mock-prep-tests',
    title: 'Mock Prep Tests',
    description: 'Use realistic timed prep sets on Android or desktop while dedicated mock tracks continue to expand.',
    accent: '#ef6c00',
  },
  {
    to: '/student/assessments',
    title: 'Assessments',
    description: 'Open the full assessment library for quizzes, exams, and structured readiness checks.',
    accent: '#1565c0',
  },
  {
    to: '/student/reference-cards',
    title: 'Clinical Reference Cards',
    description: 'Review fast bedside references for airway, trauma, anatomy, cardiology, and core EMS workflows.',
    accent: '#2e7d32',
  },
];

export default function ExamPreparation() {
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Exam Preparation</h1>
          <div className="sub">Mobile-first revision tools for MCQ practice, mock prep, reference review, and assessment readiness.</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 18, padding: '18px 16px' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {['Android ready', 'Fast review', 'Responsive desktop'].map((item) => (
            <span key={item} className="badge draft">{item}</span>
          ))}
        </div>
        <h2 style={{ marginBottom: 8 }}>Focused exam prep, without the clutter</h2>
        <p style={{ color: 'var(--ink-soft)', marginBottom: 0 }}>
          MedProHub now groups student revision into four clearer lanes: MCQ Questions, Mock Prep Tests,
          Clinical Reference Cards, and Assessments. Legacy links still open if you already bookmarked them.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 14,
        }}
      >
        {PREP_MODULES.map((module) => (
          <Link key={module.to} to={module.to} style={{ textDecoration: 'none' }}>
            <div
              className="card"
              style={{
                height: '100%',
                padding: '18px 16px',
                borderTop: `4px solid ${module.accent}`,
              }}
            >
              <div className="badge draft" style={{ marginBottom: 10 }}>Exam Prep</div>
              <h2 style={{ marginBottom: 8 }}>{module.title}</h2>
              <p style={{ color: 'var(--ink-soft)', fontSize: 13, marginBottom: 12 }}>{module.description}</p>
              <div style={{ color: module.accent, fontWeight: 600, fontSize: 13 }}>Open module</div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
