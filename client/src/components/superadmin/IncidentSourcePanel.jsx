import { useEffect, useState } from 'react';
import { api } from '../../services/api';

export default function IncidentSourcePanel() {
  const [title,setTitle]=useState('');
  const [program,setProgram]=useState('Paramedic');
  const [url,setUrl]=useState('');
  const [text,setText]=useState('');
  const [draft,setDraft]=useState(null);
  const [pending,setPending]=useState(null);
  useEffect(()=>{
    if (!pending) return undefined;
    let active=true;
    const load=async()=>{try{const result=await api(`/ai/v2/jobs/${pending}`);if(!active)return;
      if(result.job.status==='completed'){setDraft({id:pending,items:result.job.result_json.previewQuestions || []});setPending(null);setBusy(false);setStatus('Draft ready for review.');}
      else if(result.job.status==='failed'){setPending(null);setBusy(false);setStatus('Generation failed. Check the report and provider configuration, then try again.');}
    }catch(error){if(active)setStatus(error.message);}};
    void load();const timer=setInterval(load,12000);return()=>{active=false;clearInterval(timer);};
  },[pending]);
  const [selected,setSelected]=useState([]);
  const [confirmed,setConfirmed]=useState(false);
  const [busy,setBusy]=useState(false);
  const [status,setStatus]=useState('');
  async function generate(event) {
    event.preventDefault();setBusy(true);setStatus('Reading the report and preparing an evidence-linked draft…');setDraft(null);setConfirmed(false);setSelected([]);
    try { const result=await api('/ai/books/incidents',{method:'POST',body:{title,program,url,text}});setPending(result.id);setStatus('Incident queued. Generation continues in the background. You can also find this draft in the review archive.'); }
    catch(error){setStatus(error.message);setBusy(false);}
  }
  async function publish() {
    setBusy(true);
    try { const result=await api(`/ai/v2/jobs/${draft.id}/publish`,{method:'POST',body:{decisions:selected.map(itemId=>({itemId,decision:'approved',duplicateAction:'skip'}))}});setStatus(`${result.published.length} incident studies published to Kenya EMS Cases for ${program}. Duplicate matches are skipped.`);setDraft(null); }
    catch(error){setStatus(error.message);}finally{setBusy(false);}
  }
  return <section className="card incident-workspace" aria-labelledby="incident-heading"><span className="platform-eyebrow">Incident reports → Kenya EMS Cases</span><h2 id="incident-heading">Turn a reported incident into a learning case</h2><p>Paste a news link or report. The draft separates reported facts, unknown details, and learning prompts. Reported incidents use this workspace; books use the source library.</p>
    <form onSubmit={generate}><div className="grid-auto"><label className="field">Incident study title<input required maxLength={200} value={title} onChange={event=>setTitle(event.target.value)} placeholder="Incident name and location" /></label><label className="field">Student track<select value={program} onChange={event=>setProgram(event.target.value)} disabled={busy || !!draft}><option>EMT</option><option>Paramedic</option><option>Nursing</option></select></label></div><label className="field">Source link<input type="url" value={url} onChange={event=>setUrl(event.target.value)} placeholder="https://news-site.example/incident-report" /></label><label className="field">Report text<textarea rows={7} maxLength={50000} value={text} onChange={event=>setText(event.target.value)} placeholder="Paste the incident report here. If supplied, this text is used as evidence and the link is kept for attribution." /></label><small>Blocked or subscription-only article? Paste the report text. Never include patient identifiers.</small><div className="button-row"><button className="primary" disabled={busy || (!url.trim() && text.trim().length < 200)}>Generate incident draft</button></div></form>
    <p role="status">{status}</p>{draft && <section><h3>Review before students can see it</h3>{draft.items.map(item=><article className="card" key={item.id}><label><input type="checkbox" checked={selected.includes(item.id)} onChange={()=>setSelected(selected.includes(item.id)?selected.filter(id=>id!==item.id):[...selected,item.id])} />Approve this study</label><h4>{item.title}</h4><p>{item.summary}</p>{item.sections?.map((section,index)=><section key={index}><h4>{section.heading}</h4><p>{section.text}</p></section>)}{item.source_references?.map((reference,index)=><blockquote key={index}>{reference.evidence_quote}</blockquote>)}<small>{item.source_citation}</small></article>)}<label><input type="checkbox" checked={confirmed} onChange={event=>setConfirmed(event.target.checked)} />I checked the source attribution, reported facts, and clinical learning content.</label><div className="button-row"><button type="button" className="primary" disabled={busy || !confirmed || !selected.length} onClick={publish}>Publish reviewed incident studies</button></div></section>}
  </section>;
}
