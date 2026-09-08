import { Link } from 'react-router-dom';
import UiIcon from '../shared/UiIcon';

const CONTENT = [
  { title: 'Notes', label: 'Your saved study notes and summaries.', to: '/student/notes', icon: 'response' },
  { title: 'Flashcards, Files & Questions', label: 'Organise flashcards, files, and question sets in one place.', to: '/student/flashcards', icon: 'learn' },
  { title: 'Podcasts', label: 'Audio revision will appear here when available.', to: '/student/videos', icon: 'play', beta: true },
];

export default function MyContent() {
  return (
    <div className="new-page new-my-content-page">
      <header className="new-library-header"><div><h1>My Content</h1><p>This is your personalized hub for all your study materials.</p></div><label className="new-library-search"><span className="sr-only">Search content</span><input placeholder="Search your content" /><UiIcon name="question" /></label></header>
      <div className="new-content-grid">
        {CONTENT.map((item) => (
          <Link className="new-content-item" to={item.to} key={item.title}>
            {item.beta && <span className="new-beta">beta</span>}
            <span className="new-schedule-icon"><UiIcon name={item.icon} /></span>
            <span><strong>{item.title}</strong><small>{item.label}</small></span>
          </Link>
        ))}
      </div>
    </div>
  );
}
