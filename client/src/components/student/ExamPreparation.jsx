import { Link } from 'react-router-dom';

const PREP_MODULES = [
  {
    to: '/student/mcq-questions',
    title: 'MCQ Questions',
    description: 'Fast question drilling for short daily study sessions.',
    accent: '#c62828',
    action: 'Open MCQs',
  },
  {
    to: '/student/mock-prep-tests',
    title: 'Mock Prep Tests',
    description: 'Timed prep sets built for realistic revision on mobile or desktop.',
    accent: '#ef6c00',
    action: 'Start prep test',
  },
  {
    to: '/student/assessments',
    title: 'Assessments',
    description: 'Full assessment runs for deeper competency checks.',
    accent: '#1565c0',
    action: 'View assessments',
  },
  {
    to: '/student/reference-cards',
    title: 'Clinical Reference Cards',
    description: 'Quick-look clinical references for airway, trauma, anatomy, and cardiology.',
    accent: '#2e7d32',
    action: 'Open library',
  },
];

export default function ExamPreparation() {
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Exam Center</h1>
          <div className="sub">Focused revision lanes with less clutter.</div>
        </div>
      </div>

      <div className="card student-hero-card" style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {['Android ready', 'Fast review', 'Low clutter'].map((item) => (
            <span key={item} className="badge draft">{item}</span>
          ))}
        </div>
        <h2 style={{ marginBottom: 8 }}>Everything you need, grouped by action</h2>
        <div className="student-chip-row">
          {PREP_MODULES.map((module) => (
            <span key={module.title} className="student-chip">{module.title}</span>
          ))}
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
