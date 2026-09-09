import { useState } from 'react';
import { Link } from 'react-router-dom';
import UiIcon from '../shared/UiIcon';

const RESOURCES = [
  ['Study Guides', 'High-yield study guides for all topics.', 'learn', 'blue', '/student/notes'],
  ['Quick Notes', 'Condensed notes for last-minute review.', 'document', 'pink', '/student/notes'],
  ['Cheat Sheets', 'Fast clinical references for focused revision.', 'learn', 'violet', '/student/reference-cards'],
  ['Podcasts', 'Listen to module audio reviews on the go.', 'activity', 'cyan', '/student/videos'],
  ['Flashcards', 'Practice key terms and concepts.', 'bookmark', 'orange', '/student/flashcards'],
  ['Mnemonics', 'Easy ways to remember important information.', 'result', 'yellow', '/student/notes'],
  ['Images & Diagrams', 'Visual aids for complex topics.', 'cases', 'cyan', '/student/graphics'],
];

export default function MyContent() {
  const [category, setCategory] = useState('All');
  return <div className="new-reference-page new-resources-page"><header><h1>Resources</h1><p>Access study materials, guides, and helpful tools to support your learning.</p></header><nav className="new-resource-tabs" aria-label="Resource categories">{['All', 'Notes', 'Guides', 'Videos', 'Flashcards', 'Other'].map((item) => <button type="button" className={category === item ? 'is-active' : ''} onClick={() => setCategory(item)} key={item}>{item}</button>)}</nav><div className="new-resource-cards">{RESOURCES.map(([title, text, icon, tone, to]) => <Link className="new-resource-card" to={to} key={title}><span className={`new-resource-icon ${tone}`}><UiIcon name={icon} /></span><strong>{title}</strong><p>{text}</p><span className="new-resource-view">View <UiIcon name="arrowRight" /></span></Link>)}</div></div>;
}
