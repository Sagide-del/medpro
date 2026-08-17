import { Link } from 'react-router-dom';
import UiIcon from '../shared/UiIcon';

const PREP_MODULES = [
  {
    to: '/student/mcq-questions',
    title: 'MCQ Questions',
    description: 'Topic-based questions with instant review.',
    icon: 'exam',
    accent: '#c62828',
    meta: 'Question bank',
  },
  {
    to: '/student/mock-prep-tests',
    title: 'Mock Prep Tests',
    description: 'Timed topic tests with score review.',
    icon: 'simulation',
    accent: '#ef6c00',
    meta: 'Timed practice',
  },
];

export default function ExamPreparation() {
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Exam Center</h1>
          <div className="sub">Topic-based exam practice.</div>
        </div>
      </div>

      <div className="exam-center-meta">
        <div className="exam-center-chip"><span>MCQ</span><strong>Topic drills</strong></div>
        <div className="exam-center-chip"><span>Mock</span><strong>Timed prep tests</strong></div>
        <div className="exam-center-chip"><span>Review</span><strong>Answers after submission</strong></div>
      </div>

      <div className="student-action-grid">
        {PREP_MODULES.map((module) => (
          <Link key={module.to} to={module.to} style={{ textDecoration: 'none' }}>
            <div className="card student-action-card" style={{ borderTop: `4px solid ${module.accent}` }}>
              <div className="student-action-head">
                <span className="student-action-icon" style={{ color: module.accent }}>
                  <UiIcon name={module.icon} />
                </span>
                <div>
                  <div className="student-action-title">{module.title}</div>
                  <div className="student-action-meta">{module.meta}</div>
                </div>
              </div>
              <p className="student-action-copy">{module.description}</p>
              <div className="student-action-label" style={{ color: module.accent }}>Open</div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
