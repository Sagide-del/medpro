import {useCallback,useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {useNavigate} from 'react-router-dom';
import {api} from '../../services/api';
import UiIcon from './UiIcon';
import './notificationBell.css';

function destination(item,role){
 const prefix=role==='super_admin'?'/superadmin/':role==='institution_admin'?'/admin/':role==='teacher'?'/teacher/':'/student/';
 const fallback=prefix+(role==='student'&&['payment','subscription'].includes(item.type)?'payments':'dashboard');
 try{const url=new URL(item.link,window.location.origin);return item.link && url.origin===window.location.origin && url.pathname.startsWith(prefix)?url.pathname+url.search+url.hash:fallback;}catch{return fallback;}
}
export default function NotificationBell({user}){
 const [open,setOpen]=useState(false),[filter,setFilter]=useState('all'),[items,setItems]=useState([]),[counts,setCounts]=useState({unread:0,action_needed:0}),[error,setError]=useState(''),[loading,setLoading]=useState(false),[busy,setBusy]=useState(false),[position,setPosition]=useState({top:72,right:12});
 const trigger=useRef(),panel=useRef(),closeButton=useRef(),inFlight=useRef(false),queued=useRef(false),latestRefresh=useRef(),lastFetch=useRef(0),retryAt=useRef(0),navigate=useNavigate();
 const refresh=useCallback(async()=>{
  if(Date.now()<retryAt.current)return;
  if(inFlight.current){queued.current=true;return;}
  lastFetch.current=Date.now();
  inFlight.current=true;setLoading(true);
  try{const data=await api(`/notifications?filter=${filter}`);setItems(Array.isArray(data.notifications)?data.notifications:[]);setCounts(data.counts||{unread:0,action_needed:0});setError('');}
  catch(err){setError(err.message||'Notifications are unavailable.');retryAt.current=Date.now()+Math.max(15,err.retryAfterSeconds||30)*1000;}
  finally{inFlight.current=false;setLoading(false);if(queued.current){queued.current=false;latestRefresh.current?.();}}
 },[filter,user?.user_id]);
 latestRefresh.current=refresh;
 useEffect(()=>{refresh();const tick=()=>{if(document.visibilityState==='visible')refresh();};const id=setInterval(tick,60000);window.addEventListener('medpro:notifications-refresh',tick);const focus=()=>{if(Date.now()-lastFetch.current>15000)tick();};window.addEventListener('focus',focus);document.addEventListener('visibilitychange',focus);return()=>{clearInterval(id);window.removeEventListener('medpro:notifications-refresh',tick);window.removeEventListener('focus',focus);document.removeEventListener('visibilitychange',focus);};},[refresh]);
 function dismiss(){setOpen(false);trigger.current?.focus();}
 useEffect(()=>{
  if(!open)return;
  const place=()=>{const rect=trigger.current.getBoundingClientRect();setPosition({top:Math.max(8,Math.min(rect.bottom+8,window.innerHeight-200)),right:Math.max(12,window.innerWidth-rect.right)});};
  place();refresh();closeButton.current?.focus();
  const outside=event=>{if(!panel.current?.contains(event.target)&&!trigger.current?.contains(event.target))setOpen(false);};
  const key=event=>{if(event.key==='Escape'){event.preventDefault();dismiss();}if(event.key==='Tab'){const nodes=panel.current?.querySelectorAll('button:not(:disabled),a[href]');if(!nodes?.length)return;const first=nodes[0],last=nodes[nodes.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}};
  document.addEventListener('pointerdown',outside);document.addEventListener('keydown',key);window.addEventListener('resize',place);
  return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',key);window.removeEventListener('resize',place);};
 },[open,refresh]);
 async function mark(item){await api(`/notifications/${item.notification_id}/read`,{method:'PATCH'});}
 async function follow(item){setBusy(true);try{if(!item.is_read)await mark(item);setOpen(false);navigate(destination(item,user?.role));await refresh();}catch(err){setError(err.message);}finally{setBusy(false);}}
 async function markAll(){setBusy(true);try{await api('/notifications/read-all',{method:'PATCH'});await refresh();}catch(err){setError(err.message);}finally{setBusy(false);}}
 return <><button ref={trigger} type="button" className="notification-trigger" aria-label={`Notifications, ${counts.unread} unread, ${counts.action_needed} actions needed`} aria-expanded={open} aria-haspopup="dialog" aria-controls={open?'notification-inbox':undefined} onClick={()=>setOpen(value=>!value)}><UiIcon name="bell"/>{(counts.unread>0||counts.action_needed>0)&&<span className="notification-count">{counts.unread>0?Math.min(counts.unread,99):'!'}</span>}</button>{open&&createPortal(<section ref={panel} id="notification-inbox" className="notification-inbox" role="dialog" aria-modal="true" aria-labelledby="notification-heading" style={position}><header><h2 id="notification-heading">Notifications</h2><button ref={closeButton} type="button" aria-label="Close notifications" onClick={dismiss}>×</button></header><nav aria-label="Notification filters">{[['all','All'],['unread',`Unread (${counts.unread})`],['action',`Action needed (${counts.action_needed})`]].map(([value,label])=><button key={value} type="button" aria-pressed={filter===value} onClick={()=>setFilter(value)}>{label}</button>)}</nav><div className="notification-toolbar"><span aria-live="polite">{loading?'Updating…':`${items.length} notification${items.length===1?'':'s'}`}</span><button type="button" onClick={markAll} disabled={busy||!counts.unread}>Mark all read</button></div>{error&&<div role="alert" className="notification-error">{error}<button type="button" onClick={refresh}>Retry</button></div>}<div className="notification-list" aria-busy={loading}>{!loading&&!error&&!items.length&&<p className="notification-empty">{filter==='action'?'You’re all caught up.':'No notifications.'}</p>}{items.map(item=><article key={item.notification_id} className={`notification-item ${item.is_read?'':'is-unread'}`}><div className="notification-item-heading"><UiIcon name={item.type==='payment'||item.type==='subscription'?'subscription':item.type==='grade'?'result':'calendar'}/><h3>{item.title}</h3>{!item.is_read&&<span className="notification-unread-dot" aria-label="Unread"/>}</div>{item.action_required&&<span className="notification-action-badge">Action needed</span>}{item.message&&<p>{item.message}</p>}<footer><time dateTime={item.updated_at||item.created_at}>{new Date(item.updated_at||item.created_at).toLocaleString('en-KE',{timeZone:'Africa/Nairobi',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</time><button type="button" disabled={busy} onClick={()=>follow(item)}>{item.action_label||'Open'} <span aria-hidden="true">→</span></button></footer></article>)}</div></section>,document.body)}</>;
}
