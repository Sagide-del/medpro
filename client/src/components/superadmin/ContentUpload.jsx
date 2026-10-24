import { Link } from 'react-router-dom';
import UiIcon from '../shared/UiIcon';
import './contentWorkspace.css';

const workspaces = [
  ['/superadmin/ai-generator?workspace=books', 'learn', 'Books & learning resources', 'Use RAG to draft Cheat Sheets, Drug Reference, Study Guides and the three Psychometric Test areas from reviewed PDFs.', 'Add a learning resource'],
  ['/superadmin/kenya-ems-cases', 'cases', 'Kenya EMS Cases', 'Build your permanent case repository. Upload JSON, save drafts, and publish cases for each student track.', 'Manage case repository'],
  ['/superadmin/ai-generator?workspace=advanced', 'document', 'Generated drafts', 'Review generated material, check evidence, and manage publication across student sections.', 'Review drafts'],
];
export default function ContentUpload() {
  return <section className="page-stack content-studio-home"><header className="content-workspace-intro"><span className="platform-eyebrow">Super admin · Content management</span><h1>Your learning content, in one place</h1><p>Choose what you want to add. Each workspace takes you from a source or upload to reviewed student content.</p></header><div className="content-studio-grid">{workspaces.map(([to,icon,title,description,action])=><Link className="content-studio-card" to={to} key={to}><span className="content-studio-icon"><UiIcon name={icon}/></span><h2>{title}</h2><p>{description}</p><strong>{action} <span aria-hidden="true">→</span></strong></Link>)}</div><aside className="content-studio-note"><h2>Adding cases over time?</h2><p>Every JSON upload adds to Kenya EMS Cases. Existing cases stay in your repository. Reuse a case code only when you intend to update that case.</p><Link to="/superadmin/ai-generator?workspace=incidents">Create a draft from a news link or incident report →</Link></aside></section>;
}
