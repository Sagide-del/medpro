import { useId, useState } from 'react';
import UiIcon from '../shared/UiIcon';
import './visualFlashcard.css';

export default function VisualFlashcard({ card, index = 0 }) {
  const [revealed,setRevealed]=useState(false);
  const id=useId();
  const steps=card.visual?.kind === 'sequence' && Array.isArray(card.visual.steps) ? card.visual.steps.slice(0,5) : [];
  return <article className={`visual-flashcard ${revealed ? 'is-revealed' : ''}`}><div className="visual-flashcard-art" aria-hidden="true"><svg viewBox="0 0 400 130" focusable="false"><defs><linearGradient id={id} x2="1" y2="1"><stop stopColor="#087f9c" /><stop offset="1" stopColor="#243b80" /></linearGradient></defs><rect width="400" height="130" rx="20" fill={`url(#${id})`} /><circle cx="340" cy="20" r="85" fill="white" opacity=".07" /><path d="M0 75 H70 L87 75 L100 43 L120 98 L139 63 L150 75 H250" stroke="#91eee1" strokeWidth="3" fill="none" /><circle cx="320" cy="75" r="25" fill="white" opacity=".12" /><text x="320" y="83" fill="white" fontSize="24" textAnchor="middle">{String(index+1).padStart(2,'0')}</text></svg><span><UiIcon name="learn" /> Active recall</span></div><div className="visual-flashcard-body"><span className="platform-eyebrow">{revealed ? 'Answer & explanation' : 'Test your recall'}</span><h3>{card.front}</h3>{revealed && <><p id={`${id}-answer`}>{card.back}</p>{steps.length >= 2 && <ol className="flashcard-sequence" aria-label="Source-based process">{steps.map((step,position)=><li key={position}><span>{position+1}</span><p>{String(step)}</p></li>)}</ol>}</>}<button type="button" aria-expanded={revealed} onClick={()=>setRevealed(!revealed)}>{revealed ? 'Study question again' : 'Reveal answer'} <UiIcon name={revealed ? 'learn' : 'arrowRight'} /></button></div></article>;
}
