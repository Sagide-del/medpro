import { Link } from 'react-router-dom';
import UiIcon from '../shared/UiIcon';
import './contentWorkspace.css';

export default function ContentUpload() {
  return <section className="page-stack"><header className="content-workspace-intro"><span className="platform-eyebrow">Super admin · Content studio</span><h1>Build your student learning library</h1><p>Start with a book, a report, or an existing draft. Publish reviewed material to EMT, Paramedic, or Nursing students.</p><ol className="content-workspace-steps"><li>Add source</li><li>Choose sections</li><li>Review drafts</li><li>Publish to students</li></ol></header><div className="grid-auto">{[
    ['books','Books & learning resources','Upload a PDF once. Select chapters, question formats, difficulty, and student sections.','learn'],
    ['incidents','Kenya EMS incidents','Paste a news link or incident report. Create attributed incident learning studies.','cases'],
    ['advanced','Draft review & archive','Review generated content, resolve duplicates, and manage publication.','document'],
  ].map(([key,title,description,icon])=><Link className="card" to={`/superadmin/ai-generator?workspace=${key}`} key={key} style={{textDecoration:'none'}}><UiIcon name={icon} /><h2>{title}</h2><p>{description}</p><strong>Open workspace →</strong></Link>)}</div><details className="card"><summary>Import existing worksheet cases</summary><p>Use the worksheet manager for prepared JSON cases in the simulation course.</p><Link to="/admin/kenya-ems-cases">Open worksheet importer</Link></details></section>;
}
