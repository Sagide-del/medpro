import { Link } from 'react-router-dom';
import UiIcon from '../shared/UiIcon';

const CONTENT = [
  { title: 'Question Bank', label: 'MCQ practice', to: '/student/question-bank', icon: 'exam' },
  { title: 'Learning Paths', label: 'Timed mock tests', to: '/student/learning-paths', icon: 'result' },
  { title: 'Bookmarks', label: 'Saved difficult questions', to: '/student/bookmarks', icon: 'bookmark' },
  { title: 'Skill Simulations', label: 'Clinical practice', to: '/student/simulations', icon: 'simulation' },
  { title: 'Clinical Cases', label: 'Kenya EMS cases', to: '/student/learn/kenya-ems', icon: 'cases' },
];

export default function MyContent() {
  return (
    <div className="new-page">
      <header className="new-page-header"><div><div className="new-eyebrow">Your revision library</div><h1>My Content</h1><p className="new-muted">Everything you use to prepare for exams and clinical practice.</p></div></header>
      <div className="new-content-grid">
        {CONTENT.map((item) => (
          <Link className="new-content-item" to={item.to} key={item.title}>
            <span className="new-schedule-icon"><UiIcon name={item.icon} /></span>
            <span><strong>{item.title}</strong><small>{item.label}</small></span>
            <UiIcon name="arrowRight" />
          </Link>
        ))}
      </div>
    </div>
  );
}
