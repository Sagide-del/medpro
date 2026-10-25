import {useEffect,useRef,useState} from 'react';
import {useAuth} from '../../context/AuthContext';
import {api,mediaUrl} from '../../services/api';
import UiIcon from '../shared/UiIcon';
import starterEpisodes from '../../data/emtPodcasts.json';
const starters=program=>program==='EMT'?starterEpisodes.map(item=>({...item,content_json:{transcript:item.transcript,media_url:item.media_url,media_type:item.media_type,duration_seconds:item.duration_seconds,voice:item.voice}})):[];
const duration=value=>{const seconds=Math.round(Number(value));return seconds>0?`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`:'';};
export default function PublishedPodcasts(){
 const {user}=useAuth(),program=user?.program||'EMT';
 const [episodes,setEpisodes]=useState(()=>starters(program)),[selected,setSelected]=useState(()=>starters(program)[0]?.id||null),[status,setStatus]=useState(''),[loading,setLoading]=useState(program!=='EMT'),[refresh,setRefresh]=useState(0);
 const audio=useRef(null),previousProgram=useRef(program);
 useEffect(()=>{
  let active=true;if(previousProgram.current!==program){setEpisodes(starters(program));setSelected(starters(program)[0]?.id||null);previousProgram.current=program;}
  setStatus('');setLoading(true);
  Promise.allSettled([api(`/podcasts?program=${program}`,{timeoutMs:8000}),api(`/published-content?program=${program}&destination=podcasts`,{timeoutMs:8000})]).then(([studio,legacy])=>{
   if(!active)return;
   const authoritative=studio.status==='fulfilled'&&Array.isArray(studio.value.content);
   const base=authoritative?studio.value.content:starters(program);
   const old=legacy.status==='fulfilled'&&Array.isArray(legacy.value.content)?legacy.value.content:[];
   const result=[...base,...old.filter(item=>!base.some(existing=>existing.id===item.id))];
   setEpisodes(result);setSelected(current=>result.some(item=>item.id===current)?current:result[0]?.id||null);
   if(!authoritative&&studio.status==='rejected'&&studio.reason.status!==404&&legacy.status==='rejected')setStatus('The library could not refresh. Saved episodes are still available.');
  }).finally(()=>{if(active)setLoading(false);});
  return()=>{active=false;};
 },[program,refresh]);
 const current=episodes.find(item=>item.id===selected),content=current?.content_json||{},playable=content.media_type?.startsWith('audio/')&&mediaUrl(content.media_url);
 return <>
  <div className="page-head podcast-page-head"><div><h1>Podcasts</h1><div className="sub">{program} audio revision</div></div><div className="podcast-page-count"><UiIcon name="activity"/><span>{episodes.length} episodes</span><button type="button" aria-label="Refresh podcast library" disabled={loading} onClick={()=>setRefresh(value=>value+1)} style={{background:'transparent',border:0,color:'#2675a0',cursor:'pointer',padding:8}}><UiIcon name="history"/></button></div></div>
  {status&&<p role="alert">{status}</p>}{loading&&!episodes.length&&<p role="status">Loading episodes…</p>}
  {current&&<section className="podcast-feature" aria-labelledby="podcast-title"><div className="podcast-feature-art" aria-hidden="true"><UiIcon name="activity"/><strong>{program}<br/>Audio Review</strong></div><div className="podcast-feature-content"><div className="podcast-kicker">{current.topic}{duration(content.duration_seconds)&&` · ${duration(content.duration_seconds)}`}</div><h2 id="podcast-title">{current.title}</h2>{content.summary&&<p>{content.summary}</p>}
   {playable?<audio ref={audio} key={`${current.id}-${playable}`} src={playable} className="podcast-player" controls preload="metadata" onError={()=>setStatus('Audio could not load. Refresh the library to renew the audio link.')}/>:<p>Transcript available. Audio has not been published yet.</p>}
   <div className="podcast-feature-actions"><details className="podcast-transcript"><summary><UiIcon name="document"/>Transcript</summary><p style={{whiteSpace:'pre-wrap'}}>{content.transcript||content.sections?.map(section=>`${section.heading}\n${section.text}`).join('\n\n')||'No transcript published.'}</p>{current.source_citation&&<p>{current.source_citation}</p>}</details><button type="button" disabled={!playable} className="new-button new-button-primary" onClick={()=>audio.current?.play().catch(()=>setStatus('Press play on the audio controls to begin.'))}>Listen <UiIcon name="arrowRight"/></button></div>
  </div></section>}
  <section className="podcast-library"><div className="podcast-library-head"><h2>Episodes</h2><span>{episodes.length} episodes</span></div><div className="podcast-list">{episodes.map((episode,index)=><button type="button" className={episode.id===selected?'is-selected':''} key={episode.id} onClick={()=>{setSelected(episode.id);setStatus('');}}><span className="podcast-list-number">{String(index+1).padStart(2,'0')}</span><span className="podcast-list-copy"><strong>{episode.title}</strong><small>{episode.topic}{duration(episode.content_json.duration_seconds)&&` · ${duration(episode.content_json.duration_seconds)}`}</small></span><span className="podcast-list-action">{episode.content_json.media_url?'Listen':'Transcript'} <UiIcon name="arrowRight"/></span></button>)}</div>{!loading&&!episodes.length&&<p>No {program} episodes have been published yet.</p>}</section>
 </>;
}
