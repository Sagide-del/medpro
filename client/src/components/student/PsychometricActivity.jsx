import './psychometricActivity.css';
import {useEffect,useRef,useState} from 'react';
import {api} from '../../services/api';
import {clinicalHeading,clinicalText} from './drugReferenceFormat';
import UiIcon from '../shared/UiIcon';

function Explanation({text}){
 return <div className="pt-rationales">{String(text).split(/\n\n+/).filter(Boolean).map((paragraph,index)=>{
  const lines=paragraph.trim().split('\n');
  return lines.length>1?<section key={index}><h4>{lines[0]}</h4><p>{lines.slice(1).join('\n')}</p></section>:<p key={index}>{paragraph}</p>;
 })}</div>;
}
export default function PsychometricActivity({destination,title,compact=false}){
 const [item,setItem]=useState(null),[response,setResponse]=useState(''),[feedback,setFeedback]=useState(null),[error,setError]=useState(''),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[round,setRound]=useState(0);
 const token=useRef(null),resultRef=useRef(null),activityRef=useRef(null),questionRef=useRef(null);
 useEffect(()=>{
  let active=true;setLoading(true);setError('');setItem(null);setFeedback(null);setResponse('');token.current=null;
  api(`/published-content?destination=${destination}`).then(data=>{if(active)setItem(data.content?.[0]||null);}).catch(err=>{if(active)setError(err.message);}).finally(()=>{if(active)setLoading(false);});
  return()=>{active=false;};
 },[destination,round]);
 useEffect(()=>{if(feedback&&resultRef.current?.getClientRects().length){resultRef.current.focus({preventScroll:true});resultRef.current.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'nearest'});}},[feedback]);
 useEffect(()=>{if(round>0&&!loading&&item&&questionRef.current?.getClientRects().length)questionRef.current.focus({preventScroll:true});},[round,loading,item]);
 async function submit(event){
  event.preventDefault();if(!item||busy||feedback||!response.trim())return;
  setBusy(true);setError('');if(!token.current)token.current=crypto.randomUUID();
  try{setFeedback(await api(`/published-content/${item.id}/responses`,{method:'POST',body:{response,clientToken:token.current}}));}
  catch(err){setError(err.message);}finally{setBusy(false);}
 }
 function next(){setRound(value=>value+1);activityRef.current?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});}
 const content=item?.content_json||{},multipleChoice=Array.isArray(content.options)&&content.options.length>0;
 const score=feedback?.submission?.score,review=feedback?.status==='awaiting_review',provisional=feedback?.status==='provisional';
 const resultTitle=review?'Awaiting review':provisional?'Provisional score':multipleChoice&&score!=null?(Number(score)===100?'Correct answer':'Incorrect answer'):'Response submitted';
 const resultTone=review||provisional?'review':multipleChoice&&score!=null&&Number(score)<100?'incorrect':'correct';
 const wordCount=response.trim()?response.trim().split(/\s+/).length:0;
 return <section className="psychometric-activity" ref={activityRef}>
  {!compact&&<header><h1>{title}</h1></header>}
  {loading?<div className="pt-loading" role="status"><span className="pt-loading-spinner" aria-hidden="true"/>Loading activity…</div>:!item?<div className="pt-empty"><span className="pt-empty-icon"><UiIcon name={error?'alert':'practice'}/></span><h3>{error?'Activity unavailable':'No new activities available'}</h3>{error&&<p role="alert">{error}</p>}<button type="button" className="pt-secondary" onClick={()=>setRound(value=>value+1)}>{error?'Try again':'Refresh'}</button></div>:<article className="pt-assessment">
   <header className="pt-assessment-header"><div>{item.topic&&<span className="pt-topic">{clinicalHeading(item.topic)}</span>}{item.title&&item.title!==title&&<h3>{clinicalHeading(item.title)}</h3>}</div><span className="pt-answer-format"><UiIcon name={multipleChoice?'exam':'document'}/>{multipleChoice?'Single answer':'Written response'}</span></header>
   <div className="pt-assessment-body">
    {content.scenario&&<section className="pt-scenario" aria-label="Scenario"><h4>Scenario</h4><p>{clinicalText(content.scenario)}</p></section>}
    <form onSubmit={submit}>
     <fieldset disabled={busy||!!feedback}><legend ref={questionRef} tabIndex={-1}>{clinicalText(content.question)}</legend>
      {multipleChoice?<div className="pt-options">{content.options.map((option,index)=>{const text=typeof option==='string'?option:option.text;return <label className={`psychometric-answer${response===text?' is-selected':''}`} key={index}><input type="radio" name="response" required value={text} checked={response===text} onChange={event=>{setResponse(event.target.value);token.current=null;}}/><span className="pt-option-key" aria-hidden="true">{String.fromCharCode(65+index)}</span><span className="pt-option-text">{text}</span><span className="pt-option-indicator" aria-hidden="true">{response===text?<UiIcon name="result"/>:null}</span></label>;})}</div>:<div className="pt-written"><label className="sr-only" htmlFor={`pt-response-${destination}`}>Your response</label><textarea id={`pt-response-${destination}`} required rows={7} maxLength={20000} placeholder="Write your response…" value={response} onChange={event=>{setResponse(event.target.value);token.current=null;}}/><span className="pt-word-count">{wordCount} {wordCount===1?'word':'words'}</span></div>}
     </fieldset>
     {error&&<p className="pt-error" role="alert">{error}</p>}
     {!feedback&&<footer className="pt-submit-row"><button type="submit" className="primary" disabled={busy||!response.trim()}>{busy?'Submitting…':multipleChoice?'Submit answer':'Submit reflection'}{!busy&&<UiIcon name="arrowRight"/>}</button></footer>}
    </form>
    {feedback&&<section ref={resultRef} className={`pt-feedback pt-feedback-${resultTone}`} role="status" tabIndex={-1}><header><span className="pt-feedback-icon"><UiIcon name={review||provisional?'history':resultTone==='incorrect'?'alert':'result'}/></span><h3>{resultTitle}</h3>{score!=null&&<strong className="pt-feedback-score">{Number(score)}<span>%</span></strong>}</header>{feedback.submission?.feedback&&<Explanation text={feedback.submission.feedback}/>}<footer><button type="button" className="primary" onClick={next}>Next activity <UiIcon name="arrowRight"/></button></footer></section>}
   </div>
   {item.source_citation&&<details className="pt-reference"><summary>Reference</summary><p>{item.source_citation}</p></details>}
  </article>}
 </section>;
}
