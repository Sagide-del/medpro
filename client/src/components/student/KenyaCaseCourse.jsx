import { useEffect,useRef,useState } from 'react';
import { Link,useNavigate,useParams } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import KenyaCaseWorksheet from '../shared/KenyaCaseWorksheet';
function CaseCatalog(){
 const {user}=useAuth(),navigate=useNavigate();const [cases,setCases]=useState(null),[error,setError]=useState('');
 useEffect(()=>{let active=true;api('/kenya-cases').then(data=>{if(active)setCases(data.cases);}).catch(error=>{if(active)setError(error.message);});return()=>{active=false;};},[]);
 const completed=(cases || []).filter(item=>item.completed).length;
 const current=cases?.find(item=>item.status==='available');
 const previous=cases?.filter(item=>item.status==='completed') || [];
 return <div className="ke-course ke-student-workspace"><header className="ke-student-heading"><div><h1>Kenya EMS Cases</h1><span>{user.program}</span></div>{cases?.length>0 && <p>{completed} / {cases.length} completed</p>}</header>{error && <p role="alert">{error}</p>}{!cases && !error && <p>Loading…</p>}{cases?.length===0 && <section className="ke-empty"><p>No cases available yet.</p></section>}{current && <section className="ke-current-case"><div className="ke-current-case-top"><span className="platform-eyebrow">Case {String(current.number).padStart(2,'0')}</span><span className="ke-case-state">Current case</span></div><h2>{current.title}</h2><div className="ke-current-case-footer"><span>{current.case_code || user.program}</span><button type="button" className="primary" onClick={()=>navigate(`/student/learn/kenya-ems/${current.id}`)}>Open case <span aria-hidden="true">→</span></button></div></section>}{cases?.length>0 && !current && <section className="ke-empty"><h2>All cases completed</h2></section>}{previous.length>0 && <details className="ke-previous-cases"><summary>Completed cases ({previous.length})</summary><ul>{previous.map(item=><li key={item.id}><span>{item.title}</span><Link to={`/student/learn/kenya-ems/${item.id}`}>Review</Link></li>)}</ul></details>}</div>;

}
function CaseWorksheet({id}){
 const [section,setSection]=useState(0),[showUnanswered,setShowUnanswered]=useState(false);
 const [data,setData]=useState(null),[responses,setResponses]=useState({}),[error,setError]=useState(''),[saved,setSaved]=useState(''),[busy,setBusy]=useState(false),[dirty,setDirty]=useState(false);const active=useRef(true),token=useRef(null),latestResponses=useRef({}),editVersion=useRef(0),saveChain=useRef(Promise.resolve());
 useEffect(()=>{active.current=true;api(`/kenya-cases/${id}`).then(result=>{if(active.current){setData(result);setResponses(result.responses);latestResponses.current=result.responses;const first=result.caseStudy.tables.findIndex(table=>table.rows.some(row=>row.required && table.columns.some(column=>!result.responses[table.table_key]?.[row.row_key]?.[column.key]?.trim())));setSection(first<0?0:first);}}).catch(error=>{if(active.current)setError(error.message);});return()=>{active.current=false;};},[id]);
 async function save(){
  if(!data)return;
  saveChain.current=saveChain.current.catch(()=>{}).then(async()=>{
   if(!active.current)return;
   const version=editVersion.current,snapshot=latestResponses.current;
   try{await api(`/kenya-cases/${id}/draft`,{method:'POST',body:{revision:data.caseStudy.revision,responses:snapshot}});if(active.current && version===editVersion.current){setSaved('Saved');setDirty(false);}}
   catch(error){if(active.current)setSaved(error.message);}
  });
  return saveChain.current;
 }
 useEffect(()=>{if(!dirty || busy || !data)return undefined;const timer=setTimeout(save,1500);return()=>clearTimeout(timer);},[dirty,responses,busy,data]);
 function change(table,row,column,value){token.current=null;editVersion.current++;const current=latestResponses.current;const next={...current,[table]:{...current[table],[row]:{...current[table]?.[row],[column]:value}}};latestResponses.current=next;setResponses(next);setDirty(true);setSaved('Unsaved changes');}
 async function submit(event){event.preventDefault();setBusy(true);setError('');if(!token.current)token.current=crypto.randomUUID();try{await saveChain.current;const result=await api(`/kenya-cases/${id}/submit`,{method:'POST',body:{revision:data.caseStudy.revision,responses,clientToken:token.current}});if(active.current){setData(current=>({...current,attempt:result.attempt,cases:result.cases}));setDirty(false);setSaved('Submitted');}}catch(error){if(active.current)setError(error.message);}finally{if(active.current)setBusy(false);}}
 if(!data)return <div className="ke-course"><Link to="/student/learn/kenya-ems">← Cases</Link><p role={error?'alert':'status'}>{error || 'Loading…'}</p></div>;
 const doc=data.caseStudy;let total=0,filled=0;for(const table of doc.tables)for(const row of table.rows)if(row.required)for(const column of table.columns){total++;if(responses[table.table_key]?.[row.row_key]?.[column.key]?.trim())filled++;}
 function goSection(index){setSection(index);requestAnimationFrame(()=>{const heading=document.getElementById(`ke-section-${index}`);heading?.focus({preventScroll:true});heading?.scrollIntoView({behavior:'smooth',block:'start'});});}
 function reviewUnanswered(){setShowUnanswered(true);const index=doc.tables.findIndex(table=>table.rows.some(row=>row.required && table.columns.some(column=>!responses[table.table_key]?.[row.row_key]?.[column.key]?.trim())));if(index>=0)goSection(index);}
 const next=data.cases?.find(item=>item.number>doc.number && item.status==='available');
 return <div className="ke-course ke-student-workspace"><Link className="ke-back" to="/student/learn/kenya-ems">← Cases</Link>{error && <p role="alert">{error}</p>}<form onSubmit={submit} noValidate><KenyaCaseWorksheet caseStudy={doc} activeTable={section} onSectionChange={goSection} showUnanswered={showUnanswered} responses={responses} onChange={change} readOnly={busy || data.attempt?.completed===true} review={data.attempt?.review || []}/>{data.attempt && <section className="ke-completion" role="status"><h2>{data.attempt.completed?'Case completed':'Try again'}</h2>{data.attempt.score!==null && <p>Score: {data.attempt.score}%</p>}{next && <Link className="primary" to={`/student/learn/kenya-ems/${next.id}`}>Next case →</Link>}{data.attempt.completed && !next && <p>All cases completed.</p>}</section>}<footer className="ke-submit-bar"><div><strong>Section {section+1}/{doc.tables.length} · {filled}/{total} answered</strong><small role="status">{saved || 'Autosave on'}</small></div><div className="ke-step-actions">{!data.attempt?.completed && <button type="button" disabled={busy} onClick={save}>Save</button>}<button type="button" disabled={busy || section===0} onClick={()=>goSection(section-1)}>Previous</button>{section<doc.tables.length-1?<button type="button" className="primary" disabled={busy} onClick={()=>goSection(section+1)}>Next section</button>:!data.attempt?.completed && (filled!==total?<button type="button" className="primary" onClick={reviewUnanswered}>Unanswered ({total-filled})</button>:<button className="primary" disabled={busy} type="submit">{busy?'Submitting…':'Submit case'}</button>)}</div></footer></form></div>;
}
export default function KenyaCaseCourse(){const {caseNumber}=useParams();return caseNumber?<CaseWorksheet key={caseNumber} id={caseNumber}/>:<CaseCatalog/>;}
