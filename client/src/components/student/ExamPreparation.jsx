import { Link } from 'react-router-dom';

const PREP_MODULES = [
  {
    to: '/student/mcq-questions',
    title: 'MCQ Questions',
    description: 'Question practice',
    accent: '#c62828',
    action: 'Open',
  },
  {
    to: '/student/mock-prep-tests',
    title: 'Mock Prep Tests',
    description: 'Timed revision sets',
    accent: '#ef6c00',
    action: 'Open',
  },
  {
    to: '/student/assessments',
    title: 'Assessments',
    description: 'Scored assessments',
    accent: '#1565c0',
    action: 'Open',
  },
  {
    to: '/student/reference-cards',
    title: 'Clinical Reference Cards',
    description: 'Clinical review library',
    accent: '#2e7d32',
    action: 'Open',
  },
];

export default function ExamPreparation() {
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Exam Center</h1>
          <div className="sub">Choose a study lane.</div>
        </div>
      </div>

      <div className="student-action-grid">
        {PREP_MODULES.map((module) => (
          <Link key={module.to} to={module.to} style={{ textDecoration: 'none' }}>
            <div
              className="card student-action-card"
              style={{
                borderTop: `4px solid ${module.accent}`,
              }}
            >
              <div className="student-icon-dot" style={{ background: module.accent }} />
              <h2 style={{ marginBottom: 8 }}>{module.title}</h2>
              <p style={{ color: 'var(--ink-soft)', fontSize: 13, marginBottom: 12 }}>{module.description}</p>
              <div className="student-action-label" style={{ color: module.accent }}>{module.action}</div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
