import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import UiIcon from '../shared/UiIcon';

const RESOURCES = [
  ['Study Guides', 'High-yield study guides for all topics.', 'learn', 'Guides', '12 resources', '/student/study-guides'],
  ['Quick Notes', 'Condensed notes for last-minute review.', 'document', 'Notes', '18 resources', '/student/notes'],
  ['Cheat Sheets', 'Fast clinical references for focused revision.', 'learn', 'Other', '10 resources', '/student/reference-cards'],
  ['Podcasts', 'Listen to module audio reviews on the go.', 'activity', 'Videos', '14 resources', '/student/videos'],
  ['Flashcards', 'Practice key terms and concepts.', 'bookmark', 'Flashcards', '22 resources', '/student/flashcards'],
  ['Mnemonics', 'Easy ways to remember important information.', 'result', 'Other', '9 resources', '/student/notes'],
  ['Images & Diagrams', 'Visual aids for complex topics.', 'cases', 'Other', '8 resources', '/student/graphics'],
];

export default function MyContent() {
  const [category, setCategory] = useState('All');
  const visible = useMemo(() => RESOURCES.filter(([, , , group]) => category === 'All' || group === category), [category]);
  return <div className="resource-hub-v2"><header className="resource-hub-v2-head"><div><span className="platform-eyebrow">Your learning library</span><h1>Resources</h1><p>Study materials, guides, and tools to support your learning.</p></div><span className="resource-hub-v2-count"><UiIcon name="learn" />42 resources</span></header><nav className="resource-hub-v2-tabs" aria-label="Resource categories">{['All', 'Notes', 'Guides', 'Videos', 'Flashcards', 'Other'].map((item) => <button type="button" className={category === item ? 'is-active' : ''} onClick={() => setCategory(item)} key={item}>{item}</button>)}</nav><section className="resource-hub-v2-recommendation"><span className="resource-hub-v2-recommendation-icon"><UiIcon name="learn" /></span><div><span className="platform-eyebrow">Recommended for you</span><h2>Clinical Decision-Making Guide</h2><p>A practical framework for effective decision-making in the field.</p></div><Link className="new-button new-button-primary" to="/student/study-guides">Open guide <UiIcon name="arrowRight" /></Link><button className="resource-hub-v2-close" type="button" aria-label="Dismiss recommendation">x</button></section><div className="resource-hub-v2-grid">{visible.map(([title, text, icon, group, count, to]) => <Link className="resource-hub-v2-card" to={to} key={title}><span className="resource-hub-v2-icon"><UiIcon name={icon} /></span><span className="platform-eyebrow">{group}</span><h2>{title}</h2><p>{text}</p><div><span><UiIcon name="document" />{count}</span><span>View resources <UiIcon name="arrowRight" /></span></div></Link>)}</div></div>;
}
