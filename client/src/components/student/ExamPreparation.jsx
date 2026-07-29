import { Link } from 'react-router-dom';
import UiIcon from '../shared/UiIcon';

const PREP_MODULES = [
  {
    to: '/student/mcq-questions',
    title: 'MCQ Questions',
    description: 'Practice the active EMT-B question bank.',
    icon: 'exam',
    accent: '#c62828',
    action: 'Open',
  },
  {
    to: '/student/mock-prep-tests',
    title: 'Mock Prep Tests',
    description: 'Timed revision sets with review after submission.',
    icon: 'simulation',
    accent: '#ef6c00',
    action: 'Open',
  },
];

export default function ExamPreparation() {
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Exam Center</h1>
          <div className="sub">Focused exam practice without the clutter.</div>
        </div>
      </div>

      <div className="student-action-grid">
        {PREP_MODULES.map((module) => (
          <Link key={module.to} to={module.to} style={{ textDecoration: 'none' }}>
            <div className="card student-action-card" style={{ borderTop: `4px solid ${module.accent}` }}>
              <div className="student-action-head">
                <span className="student-action-icon" style={{ color: module.accent }}>
                  <UiIcon name={module.icon} />
                </span>
                <div className="student-action-title">{module.title}</div>
              </div>
              <p className="student-action-copy">{module.description}</p>
              <div className="student-action-label" style={{ color: module.accent }}>{module.action}</div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
