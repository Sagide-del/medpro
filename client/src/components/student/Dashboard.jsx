import {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {api} from '../../services/api';
import {useAuth} from '../../context/AuthContext';
import Loading from '../shared/Loading';
import UiIcon from '../shared/UiIcon';
import './studentOverview.css';

const activities=[
 {title:'Question Bank',icon:'exam',to:'/student/question-bank'},
 {title:'Psychometric Test',icon:'practice',to:'/student/mock-prep-tests'},
 {title:'Kenya EMS Cases',icon:'cases',to:'/student/learn/kenya-ems'},
 {title:'Study Plan',icon:'calendar',to:'/student/study-planner'},
];
function activityDate(value){
 if(!value || Number.isNaN(new Date(value).getTime()))return null;
 return new Intl.DateTimeFormat('en-KE',{timeZone:'Africa/Nairobi',day:'numeric',month:'short'}).format(new Date(value));
}
export default function StudentDashboard(){
 const {user}=useAuth();
 const [data,setData]=useState({attempts:[],totalQuestions:0}),[loading,setLoading]=useState(true),[error,setError]=useState(''),[retry,setRetry]=useState(0);
 useEffect(()=>{
  let active=true;setLoading(true);setError('');
  api(`/published-content/activity?program=${encodeURIComponent(user.program||'EMT')}`)
   .then(result=>{if(active)setData({attempts:Array.isArray(result.attempts)?result.attempts:[],totalQuestions:result.totalQuestions||0});})
   .catch(err=>{if(active)setError(err.message||'Dashboard unavailable.');})
   .finally(()=>{if(active)setLoading(false);});
  return()=>{active=false;};
 },[user.id,user.program,retry]);
 const scored=data.attempts.filter(item=>item.score_pct!=null && Number.isFinite(Number(item.score_pct)));
 const average=scored.length?`${Math.round(scored.reduce((sum,item)=>sum+Number(item.score_pct),0)/scored.length)}%`:'—';
 const completed=data.attempts.filter(item=>['graded','submitted','completed'].includes(String(item.status||'').toLowerCase())).length;
 if(loading)return <Loading label="Loading dashboard…"/>;
 return <div className="student-overview">
  <header className="so-heading"><h1>Dashboard</h1><span>{new Intl.DateTimeFormat('en-KE',{timeZone:'Africa/Nairobi',day:'numeric',month:'long'}).format(new Date())}</span></header>
  {error?<div className="so-error" role="alert"><p>{error}</p><button type="button" onClick={()=>setRetry(value=>value+1)}>Retry</button></div>:<dl className="so-stats" aria-label="Revision overview">
   <div><dt>Questions available</dt><dd>{Number(data.totalQuestions).toLocaleString('en-KE')}</dd></div>
   <div><dt>Sessions completed</dt><dd>{completed}</dd></div>
   <div><dt>Average score</dt><dd>{average}</dd></div>
  </dl>}
  <section className="so-practice" aria-labelledby="so-practice-title"><h2 id="so-practice-title">Practice</h2><div className="so-activity-grid">{activities.map(item=><Link to={item.to} key={item.to}><span className="so-activity-icon"><UiIcon name={item.icon}/></span><strong>{item.title}</strong><UiIcon name="arrowRight"/></Link>)}</div></section>
  <div className="so-bottom-grid"><section className="so-panel" aria-labelledby="so-recent-title"><header><h2 id="so-recent-title">Recent results</h2><Link to="/student/progress-analytics">View progress <UiIcon name="arrowRight"/></Link></header>
   {error?<p className="so-empty">Results unavailable.</p>:data.attempts.length?<ul className="so-results">{data.attempts.slice(0,3).map((item,index)=><li key={item.attempt_id||index}><Link to="/student/progress-analytics"><span className="so-result-copy"><strong>{item.title||'Practice session'}</strong>{activityDate(item.completed_at)&&<time dateTime={item.completed_at}>{activityDate(item.completed_at)}</time>}</span><span className="so-score">{item.score_pct!=null?`${Number(item.score_pct)}%`:'Pending'}</span><UiIcon name="arrowRight"/></Link></li>)}</ul>:<p className="so-empty">No completed sessions yet.</p>}
  </section><section className="so-panel" aria-labelledby="so-resources-title"><header><h2 id="so-resources-title">Reference library</h2></header><nav className="so-reference" aria-label="Reference library">{[{title:'Cheat Sheets',to:'/student/cheat-sheets',icon:'document'},{title:'Drug Reference',to:'/student/drug-reference',icon:'pill'},{title:'Study Guides',to:'/student/study-guides',icon:'learn'}].map(item=><Link key={item.to} to={item.to}><UiIcon name={item.icon}/><span>{item.title}</span><UiIcon name="arrowRight"/></Link>)}</nav></section></div>
 </div>;
}
