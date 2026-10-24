import { useEffect,useRef,useState } from 'react';
import { Link,useNavigate,useParams } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import KenyaCaseWorksheet from '../shared/KenyaCaseWorksheet';
function CaseCatalog(){
 const {user}=useAuth(),navigate=useNavigate();const [cases,setCases]=useState(null),[error,setError]=useState('');
 useEffect(()=>{let active=true;api('/kenya-cases').then(data=>{if(active)setCases(data.cases);}).catch(error=>{if(active)setError(error.message);});return()=>{active=false;};},[]);
 const completed=(cases || []).filter(item=>item.completed).length;
 return <div className="ke-course"><header className="ke-course-intro"><span className="platform-eyebrow">{user.program} · Kenya EMS</span><h1>Learn one case at a time</h1><p>Work through each incident worksheet, submit your responses, and review the reference answers to unlock the next case.</p><div className="ke-course-progress"><strong>{completed} of {cases?.length || 0} cases completed</strong><progress max={cases?.length || 1} value={completed}/></div></header>{error && <p role="alert">{error}</p>}{!cases && !error && <p>Loading your case sequence…</p>}{cases?.length===0 && <section className="ke-empty"><h2>Your case course is being prepared</h2><p>Published {user.program} worksheets will appear here after administrator review.</p></section>}<ol className="ke-course-list">{cases?.map(item=><li key={item.id} className={`ke-course-item is-${item.status}`}><span className="ke-case-number">{item.number}</span><div><span className="platform-eyebrow">{item.status==='locked'?'Complete the previous case':item.status==='completed'?'Completed':'Ready to study'}</span><h2>{item.title}</h2><p>{item.case_code}</p></div><button type="button" disabled={item.status==='locked'} onClick={()=>navigate(`/student/learn/kenya-ems/${item.id}`)}>{item.status==='locked'?'Locked':item.status==='completed'?'Review case':'Start case'}</button></li>)}</ol></div>;
}
function CaseWorksheet({id}){
 const [data,setData]=useState(null),[responses,setResponses]=useState({}),[error,setError]=useState(''),[saved,setSaved]=useState(''),[busy,setBusy]=useState(false),[dirty,setDirty]=useState(false);const active=useRef(true),token=useRef(null),latestResponses=useRef({}),editVersion=useRef(0),saveChain=useRef(Promise.resolve());
 useEffect(()=>{active.current=true;api(`/kenya-cases/${id}`).then(result=>{if(active.current){setData(result);setResponses(result.responses);latestResponses.current=result.responses;}}).catch(error=>{if(active.current)setError(error.message);});return()=>{active.current=false;};},[id]);
 async function save(){
  if(!data)return;
  saveChain.current=saveChain.current.catch(()=>{}).then(async()=>{
   if(!active.current)return;
   const version=editVersion.current,snapshot=latestResponses.current;
   try{await api(`/kenya-cases/${id}/draft`,{method:'POST',body:{revision:data.caseStudy.revision,responses:snapshot}});if(active.current && version===editVersion.current){setSaved('Progress saved');setDirty(false);}}
   catch(error){if(active.current)setSaved(error.message);}
  });
  return saveChain.current;
 }
 useEffect(()=>{if(!dirty || busy || !data)return undefined;const timer=setTimeout(save,1500);return()=>clearTimeout(timer);},[dirty,responses,busy,data]);
 function change(table,row,column,value){token.current=null;editVersion.current++;const current=latestResponses.current;const next={...current,[table]:{...current[table],[row]:{...current[table]?.[row],[column]:value}}};latestResponses.current=next;setResponses(next);setDirty(true);setSaved('Unsaved changes');}
 async function submit(event){event.preventDefault();setBusy(true);setError('');if(!token.current)token.current=crypto.randomUUID();try{await saveChain.current;const result=await api(`/kenya-cases/${id}/submit`,{method:'POST',body:{revision:data.caseStudy.revision,responses,clientToken:token.current}});if(active.current){setData(current=>({...current,attempt:result.attempt,cases:result.cases}));setDirty(false);setSaved('Worksheet submitted');}}catch(error){if(active.current)setError(error.message);}finally{if(active.current)setBusy(false);}}
 if(!data)return <div className="ke-course"><Link to="/student/learn/kenya-ems">← Back to case sequence</Link><p role={error?'alert':'status'}>{error || 'Loading worksheet…'}</p></div>;
 const doc=data.caseStudy;let total=0,filled=0;for(const table of doc.tables)for(const row of table.rows)if(row.required)for(const column of table.columns){total++;if(responses[table.table_key]?.[row.row_key]?.[column.key]?.trim())filled++;}
 const next=data.cases?.find(item=>item.number>doc.number && item.status==='available');
 return <div className="ke-course"><Link className="ke-back" to="/student/learn/kenya-ems">← Back to case sequence</Link>{error && <p role="alert">{error}</p>}<form onSubmit={submit}><KenyaCaseWorksheet caseStudy={doc} responses={responses} onChange={change} readOnly={busy || data.attempt?.completed===true} review={data.attempt?.review || []}/>{data.attempt && <section className="ke-completion" role="status"><h2>{data.attempt.completed?'Case completed':'Review your responses and try again'}</h2><p>{data.attempt.score===null?'Written responses submitted. Compare your reasoning with the reference answers.':`Configured answer score: ${data.attempt.score}%.`}</p>{next && <Link className="primary" to={`/student/learn/kenya-ems/${next.id}`}>Continue to case {next.number} →</Link>}{data.attempt.completed && !next && <p>You have completed every case currently available in your track.</p>}</section>}<footer className="ke-submit-bar"><div><strong>{filled}/{total} required cells filled</strong><small role="status">{saved}</small></div>{!data.attempt?.completed && <><button type="button" disabled={busy} onClick={save}>Save progress</button><button className="primary" disabled={busy || filled!==total} type="submit">{busy?'Submitting…':'Submit and review answers'}</button></>}</footer></form></div>;
}
export default function KenyaCaseCourse(){const {caseNumber}=useParams();return caseNumber?<CaseWorksheet key={caseNumber} id={caseNumber}/>:<CaseCatalog/>;}
