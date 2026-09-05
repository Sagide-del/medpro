import { Link } from 'react-router-dom';
import UiIcon from '../shared/UiIcon';

const PREP_MODULES = [
  {
    to: '/student/mcq-questions',
    title: 'MCQ Questions',
    icon: 'exam',
    accent: '#c62828',
    meta: 'Topic practice',
  },
  {
    to: '/student/mock-prep-tests',
    title: 'Mock Prep Tests',
    icon: 'simulation',
    accent: '#ef6c00',
    meta: 'Timed preparation',
  },
];

export default function ExamPreparation() {
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Exam Center</h1>
          <div className="sub">Practice by topic. Test your readiness.</div>
        </div>
      </div>

      <div className="exam-center-grid">
        {PREP_MODULES.map((module) => (
          <Link key={module.to} to={module.to} style={{ textDecoration: 'none' }}>
            <div className="card exam-center-module" style={{ '--module-accent': module.accent }}>
              <div className="student-action-head">
                <span className="student-action-icon" style={{ color: module.accent }}>
                  <UiIcon name={module.icon} />
                </span>
                <div>
                  <div className="student-action-title">{module.title}</div>
                  <div className="student-action-meta">{module.meta}</div>
                </div>
              </div>
              <div className="student-action-label" style={{ color: module.accent }}>Start <span aria-hidden="true">→</span></div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
