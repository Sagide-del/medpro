import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import UiIcon from '../shared/UiIcon';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const RESOURCES = [
  ['Study Guides', 'High-yield study guides for all topics.', 'learn', 'Guides', 'study_guides', '/student/study-guides'],
  ['Quick Notes', 'Condensed notes for last-minute review.', 'document', 'Notes', 'notes', '/student/notes'],
  ['Cheat Sheets', 'Fast clinical references for focused revision.', 'learn', 'Other', 'cheat_sheets', '/student/cheat-sheets'],
  ['Podcasts', 'Listen to module audio reviews on the go.', 'activity', 'Videos', 'podcasts', '/student/videos'],
  ['Flashcards', 'Practice key terms and concepts.', 'bookmark', 'Flashcards', 'flashcards', '/student/published-flashcards'],
  ['Mnemonics', 'Easy ways to remember important information.', 'result', 'Other', 'mnemonics', '/student/mnemonics'],
  ['Images & Diagrams', 'Visual aids for complex topics.', 'cases', 'Other', 'diagrams', '/student/published-diagrams'],
  ['Drug Reference', 'Reviewed medicine references for your pathway.', 'pill', 'Other', 'drug_reference', '/student/drug-reference'],
  ['Clinical Protocols', 'Structured clinical guidance.', 'document', 'Guides', 'clinical_protocols', '/student/clinical-protocols'],
  ['Skills Videos', 'Published demonstrations and skills scripts.', 'play', 'Videos', 'skills_videos', '/student/skills-videos'],
];

export default function MyContent() {
  const { user } = useAuth();
  const program = user?.program || 'EMT';
  const [counts, setCounts] = useState({});
  const [featured, setFeatured] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    setCounts({}); setFeatured(null); setError(''); setDismissed(false);
    api(`/published-content/summary?program=${program}`).then((data) => { if (active) setCounts(data.counts || {}); }).catch((err) => { if (active) setError(err.message); });
    api(`/published-content?program=${program}&destination=study_guides`).then((data) => { if (active) setFeatured(data.content?.[0] || null); }).catch((err) => { if (active) setError(err.message); });
    return () => { active = false; };
  }, [program]);
  const [category, setCategory] = useState('All');
  const visible = useMemo(() => RESOURCES.filter(([, , , group]) => category === 'All' || group === category), [category]);
  return <div className="resource-hub-v2"><header className="resource-hub-v2-head"><div><span className="platform-eyebrow">{program} learning library</span><h1>Resources</h1><p>Study materials, guides, and tools to support your learning.</p></div><span className="resource-hub-v2-count"><UiIcon name="learn" />{RESOURCES.reduce((sum, resource) => sum + (counts[resource[4]] || 0), 0)} resources</span></header>
    {error && <p role="alert">{error}</p>}
    <nav className="resource-hub-v2-tabs" aria-label="Resource categories">{['All', 'Notes', 'Guides', 'Videos', 'Flashcards', 'Other'].map((item) => <button type="button" className={category === item ? 'is-active' : ''} onClick={() => setCategory(item)} key={item}>{item}</button>)}</nav>
    {featured && !dismissed && <section className="resource-hub-v2-recommendation"><span className="resource-hub-v2-recommendation-icon"><UiIcon name="learn" /></span><div><span className="platform-eyebrow">Featured guide</span><h2>{featured.title}</h2><p>{featured.content_json.summary}</p></div><Link className="new-button new-button-primary" to={`/student/study-guides?id=${featured.id}`}>Open guide <UiIcon name="arrowRight" /></Link><button className="resource-hub-v2-close" type="button" aria-label="Dismiss recommendation" onClick={() => setDismissed(true)}>x</button></section>}
    <div className="resource-hub-v2-grid">{visible.map(([title, text, icon, group, key, to]) => <Link className="resource-hub-v2-card" to={to} key={title}><span className="resource-hub-v2-icon"><UiIcon name={icon} /></span><span className="platform-eyebrow">{group}</span><h2>{title}</h2><p>{text}</p><div><span><UiIcon name="document" />{counts[key] || 0} resources</span><span>View resources <UiIcon name="arrowRight" /></span></div></Link>)}</div></div>;
}
