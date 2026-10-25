import {useEffect,useRef,useState} from 'react';
import {useSearchParams} from 'react-router-dom';
import PsychometricActivity from './PsychometricActivity';
import UiIcon from '../shared/UiIcon';
import './psychometricTabs.css';

const AREAS=[
 {key:'psychometric_clinical',title:'Clinical Judgment',label:'Clinical',icon:'heart'},
 {key:'psychometric_situational',title:'Situational Judgment',label:'Situational',icon:'community'},
 {key:'psychometric_readiness',title:'Readiness Reflection',label:'Readiness',icon:'document'},
];
export default function PsychometricTest(){
 const [params]=useSearchParams();
 const initial=Math.max(0,AREAS.findIndex(item=>item.key===params.get('area')));
 const [index,setIndex]=useState(initial),[visited,setVisited]=useState([initial]),tabs=useRef([]);
 useEffect(()=>{activate(Math.max(0,AREAS.findIndex(item=>item.key===params.get('area'))));},[params]);
 function activate(next){setIndex(next);setVisited(previous=>previous.includes(next)?previous:[...previous,next]);}
 function navigate(event){
  let next=Math.max(0,tabs.current.indexOf(event.currentTarget));
  if(event.key==='ArrowRight')next=(next+1)%AREAS.length;
  else if(event.key==='ArrowLeft')next=(next+AREAS.length-1)%AREAS.length;
  else if(event.key==='Home')next=0;
  else if(event.key==='End')next=AREAS.length-1;
  else return;
  event.preventDefault();activate(next);tabs.current[next]?.focus();
 }
 return <div className="psychometric-workspace">
  <header className="pt-heading"><span className="pt-heading-icon"><UiIcon name="practice"/></span><h1>Psychometric Test</h1></header>
  <nav className="pt-tabs" role="tablist" aria-label="Assessment areas">{AREAS.map((item,i)=><button key={item.key} ref={element=>{tabs.current[i]=element;}} id={`pt-tab-${i}`} type="button" role="tab" aria-selected={index===i} aria-controls={`pt-panel-${i}`} tabIndex={index===i?0:-1} onClick={()=>activate(i)} onKeyDown={navigate}><UiIcon name={item.icon}/><span>{item.label}</span></button>)}</nav>
  {AREAS.map((item,i)=><section key={item.key} role="tabpanel" id={`pt-panel-${i}`} aria-labelledby={`pt-tab-${i}`} hidden={index!==i}><div className="pt-area-heading"><h2>{item.title}</h2></div>{visited.includes(i)&&<PsychometricActivity destination={item.key} title={item.title} compact/>}</section>)}
  <details className="pt-exam-details"><summary>Licensing exam guidance</summary><p>Confirm the current blueprint for your profession with your regulator.</p><div><a href="https://scfhs.org.sa/en" target="_blank" rel="noreferrer">Saudi Arabia · SCFHS <span aria-hidden="true">↗</span></a><a href="https://dhp.moph.gov.qa/en/Pages/QualifyingExamination.aspx" target="_blank" rel="noreferrer">Qatar · DHP <span aria-hidden="true">↗</span></a></div></details>
 </div>;
}
