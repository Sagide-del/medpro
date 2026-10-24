import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { PROGRAMS } from '../../data/programs';

const DESTINATIONS = { question_bank: 'Question Bank', psychometric_clinical: 'Psychometric: Clinical Judgment', psychometric_situational: 'Psychometric: Situational Judgment', psychometric_readiness: 'Psychometric: Readiness Reflection', study_guides: 'Study Guides', drug_reference: 'Drug Reference', cheat_sheets: 'Cheat Sheets', podcasts: 'Podcast Scripts', flashcards: 'Visual Flashcards', notes: 'Study Notes', mnemonics: 'Mnemonics', diagrams: 'Visual Study Briefs' };
const supports = (source, program) => source.program === program || source.program === 'all' || (source.program === 'both' && program !== 'Nursing');
export default function BookGenerationPanel({ sources }) {
  const [config, setConfig] = useState(null);
  const [sourceId, setSourceId] = useState('');
  const [coverage, setCoverage] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [targets, setTargets] = useState([]);
  const [moduleOptions, setModuleOptions] = useState({});
  const [destinations, setDestinations] = useState(['cheat_sheets','drug_reference','study_guides','psychometric_clinical','psychometric_situational','psychometric_readiness']);
  const [count, setCount] = useState(10);
  const [difficulty, setDifficulty] = useState('intermediate');
  const [questionTypes, setQuestionTypes] = useState(['multiple_choice']);
  const [pageStart, setPageStart] = useState(1);
  const [pageEnd, setPageEnd] = useState(1);
  const [plan, setPlan] = useState(null);
  const [clientToken, setClientToken] = useState('');
  const [runs, setRuns] = useState([]);
  const [detail, setDetail] = useState(null);
  const [review, setReview] = useState(null);
  const [selected, setSelected] = useState([]);
  const [reviewConfirmed, setReviewConfirmed] = useState(false);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  async function refresh() {
    const nextRuns = await api('/ai/books/runs');
    setRuns(nextRuns.runs);
  }
  useEffect(() => {
    let active = true;
    const load = async () => { try { if (active) await refresh(); } catch (error) { if (active) setStatus(error.message); } };
    api('/ai/books/config').then((data) => { if (active) setConfig(data); }).catch((error) => { if (active) setStatus(error.message); });
    void load(); const timer = setInterval(load, 15000);
    return () => { active = false; clearInterval(timer); };
  }, []);
  useEffect(() => {
    let active = true;
    Promise.all(PROGRAMS.map(async (program) => [program, (await api(`/ai/v2/modules?program=${program}`)).modules]))
      .then((entries) => { if (active) setModuleOptions(Object.fromEntries(entries)); }).catch((error) => { if (active) setStatus(error.message); });
    return () => { active = false; };
  }, []);
  useEffect(() => { setPlan(null); }, [sourceId, chapters, targets, destinations, count, difficulty, questionTypes, pageStart, pageEnd]);
  useEffect(() => {
    if (!detail) return undefined;
    let active = true;
    const timer = setInterval(() => api(`/ai/books/runs/${detail.run.id}`).then((data) => { if (active) setDetail(data); }).catch((error) => { if (active) setStatus(error.message); }), 15000);
    return () => { active = false; clearInterval(timer); };
  }, [detail?.run.id]);

  async function chooseSource(id) {
    setSourceId(id); setCoverage(null); setPlan(null); setTargets([]); setChapters([]); setStatus('');
    if (!id) return;
    try {
      const data = await api(`/ai/books/sources/${id}/coverage`);
      setPageStart(1); setPageEnd(data.source.pageCount);
      setCoverage(data); setChapters(data.chapters.map((chapter) => chapter.chapter_title));
      setTargets(PROGRAMS.filter((program) => supports(data.source, program)).map((program) => ({ program, moduleId: '' })));
    } catch (error) { setStatus(error.message); }
  }
  const input = { sourceId, targets, destinations, questionsPerBatch: Number(count), chapters, pageStart, pageEnd, difficulty, questionTypes };
  async function act(action) {
    setBusy(true); setStatus('');
    try {
      if (action === 'plan') { setPlan(await api('/ai/books/plan', { method: 'POST', body: input })); setClientToken(crypto.randomUUID()); }
      else {
        const run = await api('/ai/books/runs', { method: 'POST', body: { ...input, clientToken } });
        setDetail(await api(`/ai/books/runs/${run.id}`)); setPlan(null);
        setStatus('Run queued. Batches continue in the background; review is required before publication.'); await refresh();
      }
    } catch (error) { setStatus(error.message); }
    finally { setBusy(false); }
  }
  async function control(id, action) {
    setBusy(true);
    try { await api(`/ai/books/runs/${id}/${action}`, { method: 'POST' }); await refresh(); if (detail?.run.id === id) setDetail(await api(`/ai/books/runs/${id}`)); }
    catch (error) { setStatus(error.message); }
    finally { setBusy(false); }
  }
  async function reviewTask(task) {
    setBusy(true); setReview(null); setSelected([]); setReviewConfirmed(false);
    try { const data = await api(`/ai/v2/jobs/${task.job_id}`); setReview({ ...data, task }); }
    catch (error) { setStatus(error.message); }
    finally { setBusy(false); }
  }
  async function publish() {
    setBusy(true);
    try {
      const data = await api(`/ai/v2/jobs/${review.job.id}/publish`, { method: 'POST', body: { decisions: selected.map((itemId) => ({ itemId, decision: 'approved', duplicateAction: 'skip' })) } });
      setStatus(`${data.published.length} reviewed items published to the selected track and destination. Duplicate matches are skipped.`);
      setReview(null); setSelected([]); await refresh(); setDetail(await api(`/ai/books/runs/${detail.run.id}`));
    } catch (error) { setStatus(error.message); }
    finally { setBusy(false); }
  }
  const toggle = (list, value) => list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
  const readySources = sources.filter((source) => source.status === 'ready');
  return <section className="card book-generation-panel" aria-labelledby="book-generation-title">
    <h2 id="book-generation-title">2. Create content from this resource</h2>
    <p>Select an indexed resource and chapters. RAG uses the source passages to draft your selected resources and assessment activities, with page references for review.</p>
    {config && (!config.indexingEnabled || !config.generationConfigured) && <p role="status">Setup required: {!config.indexingEnabled && 'set RAG_ENABLED=true on the medpro API service and deploy it. '}{!config.generationConfigured && 'configure the generation provider in server settings. '}Plans can be previewed once passages are indexed.</p>}
    <label className="field">Indexed book<select aria-label="Indexed book" value={sourceId} onChange={(event) => chooseSource(event.target.value)}><option value="">Choose a ready source</option>{readySources.map((source) => <option key={source.id} value={source.id}>{source.filename} · {source.program} · {source.version}</option>)}</select></label>
    {coverage && <>
      <p>{coverage.source.pageCount} PDF pages · {coverage.chapters.length} sections with readable passages. PDFs without bookmarks use passage batches instead of invented chapter names.</p>
      {!coverage.source.global && <p>Private sources remain draft-only. Student publication requires an approved global source.</p>}
      {!coverage.chapters.length && <p role="alert">This source was indexed before book coverage was added. Deploy the updated private indexing service, then use “Reindex for book generation” in the source library.</p>}
<div className="book-track-row"><label>PDF page from<input type="number" min="1" max={coverage.source.pageCount} value={pageStart} onChange={(event) => setPageStart(Number(event.target.value))} /></label><label>PDF page to<input type="number" min={pageStart} max={coverage.source.pageCount} value={pageEnd} onChange={(event) => setPageEnd(Number(event.target.value))} /></label></div>
      <fieldset><legend>Chapters to cover</legend><div className="book-chapters">{coverage.chapters.map((chapter) => <label key={chapter.chapter_title}><input type="checkbox" checked={chapters.includes(chapter.chapter_title)} onChange={() => setChapters(toggle(chapters, chapter.chapter_title))} />{chapter.chapter_title} · pages {chapter.first_page}–{chapter.last_page}</label>)}</div></fieldset>
      <fieldset><legend>Study tracks and Question Bank routing</legend>{PROGRAMS.filter((program) => supports(coverage.source, program)).map((program) => <div className="book-track-row" key={program}><label><input type="checkbox" checked={targets.some((target) => target.program === program)} onChange={() => setTargets(targets.some((target) => target.program === program) ? targets.filter((target) => target.program !== program) : [...targets, { program, moduleId: '' }])} />{program}</label><select aria-label={`${program} question module`} disabled={!targets.some((target) => target.program === program)} value={targets.find((target) => target.program === program)?.moduleId || ''} onChange={(event) => setTargets(targets.map((target) => target.program === program ? { ...target, moduleId: event.target.value } : target))}><option value="">Create/use “{coverage.source.subject}” module</option>{(moduleOptions[program] || []).map((module) => <option key={module.id} value={module.id}>{module.title}</option>)}</select></div>)}</fieldset>
      <p>Cheat Sheets, Drug Reference and Study Guides build your revision library. Clinical Judgment, Situational Judgment and Readiness feed Psychometric Test. Unsupported content is omitted; drafts require approval.</p><fieldset><legend>Content to create</legend><div className="button-row"><button type="button" onClick={()=>setDestinations(['cheat_sheets','drug_reference','study_guides'])}>Revision resources</button><button type="button" onClick={()=>setDestinations(['psychometric_clinical','psychometric_situational','psychometric_readiness'])}>Psychometric areas</button><button type="button" onClick={()=>setDestinations(['cheat_sheets','drug_reference','study_guides','psychometric_clinical','psychometric_situational','psychometric_readiness'])}>Both</button></div><div className="book-output-groups">{[['Revision resources',['cheat_sheets','drug_reference','study_guides']],['Psychometric Test',['psychometric_clinical','psychometric_situational','psychometric_readiness']]].map(([title,keys])=><section key={title}><h4>{title}</h4>{keys.map(key=><label className="book-inline-choice" key={key}><input type="checkbox" checked={destinations.includes(key)} onChange={()=>setDestinations(toggle(destinations,key))}/>{DESTINATIONS[key].replace('Psychometric: ','')}</label>)}</section>)}</div><details><summary>Other content sections</summary>{Object.entries(DESTINATIONS).filter(([key])=>!['cheat_sheets','drug_reference','study_guides','psychometric_clinical','psychometric_situational','psychometric_readiness'].includes(key)).map(([key,label])=><label className="book-inline-choice" key={key}><input type="checkbox" checked={destinations.includes(key)} onChange={()=>setDestinations(toggle(destinations,key))}/>{label}</label>)}</details></fieldset>
      <label className="field">Assessment difficulty<select value={difficulty} onChange={event => setDifficulty(event.target.value)}><option value="beginner">Easy</option><option value="intermediate">Medium</option><option value="advanced">Hard</option></select></label>
      {destinations.includes('question_bank') && <fieldset><legend>Question formats</legend>{[['multiple_choice','Multiple Choice'],['true_false','True / False'],['scenario','Scenario with choices']].map(([key,label]) => <label className="book-inline-choice" key={key}><input type="checkbox" checked={questionTypes.includes(key)} onChange={() => setQuestionTypes(toggle(questionTypes,key))} />{label}</label>)}</fieldset>}
      {destinations.includes('question_bank') && <label className="field">Questions per passage batch<select aria-label="Questions per passage batch" value={count} onChange={(event) => setCount(Number(event.target.value))}>{[5,10,15,20].map((number) => <option key={number}>{number}</option>)}</select></label>}
      <button type="button" disabled={busy || !chapters.length || !targets.length || !destinations.length || (destinations.includes('question_bank') && !questionTypes.length)} onClick={() => act('plan')}>Preview coverage and workload</button>
      {plan && <div className="book-plan-summary"><p>{plan.readablePages} readable pages · {plan.passageCount} passages · {plan.estimatedModelCalls / 2} batches · up to {plan.questionDraftTarget} question drafts, plus selected case/resource drafts. About {plan.estimatedModelCalls} model calls. Actual output depends on evidence and duplicate checks.</p><button type="button" className="primary" disabled={busy || !config?.indexingEnabled || config?.indexingConfigured === false || !config?.generationConfigured} onClick={() => act('start')}>Start this bounded generation run</button></div>}
    </>}
    {status && <p role="status">{status}</p>}
    <h3>Book generation runs</h3>{!runs.length && <p>No book runs yet.</p>}
    {runs.map((run) => <article className="book-run-row" key={run.id}><strong>{run.filename}</strong><p>{run.total} batches · {run.queued} queued · {run.generating} generating · {run.review} ready for review · {run.failed} failed · {run.published} batches with published items · {run.drafts} drafts · {run.duplicates} duplicates skipped{run.paused ? ' · Paused' : ''}</p><div className="button-row"><button type="button" onClick={async () => { try { setDetail(await api(`/ai/books/runs/${run.id}`)); } catch (error) { setStatus(error.message); } }}>View batches</button><button type="button" disabled={busy} onClick={() => control(run.id, run.paused ? 'resume' : 'pause')}>{run.paused ? 'Resume queue' : 'Pause queue'}</button>{run.failed > 0 && <button type="button" disabled={busy} onClick={() => control(run.id, 'retry_failed')}>Retry failed batches</button>}</div></article>)}
    {detail && <section><h3>Batch coverage</h3><p>Pause stops new batches; a batch already running may finish. Completed drafts are retained.</p>{detail.tasks.map((task) => <article className="book-task-row" key={task.id}><strong>{task.chapter_title}</strong><p>{task.program} · {DESTINATIONS[task.destination]} · PDF pages {task.first_page}–{task.last_page} · {task.job_status === 'published' ? 'published' : task.status} · {task.generated_count} drafts</p>{task.content_notes?.map((note,index)=><p key={index}>{note}</p>)}{task.error && <p role="alert">{task.error}</p>}{task.status === 'review' && task.generated_count > 0 && task.published_count < task.generated_count && <button type="button" disabled={busy} onClick={() => reviewTask(task)}>Review this batch</button>}</article>)}</section>}
    {review && <section className="book-review"><h3>Review: {review.job.title}</h3><p>Check each answer, scope, rationale, and page citation. Only selected items are approved for publication.</p>{(review.job.result_json.previewQuestions || []).map((item) => <article className="card" key={item.id}><label><input type="checkbox" checked={selected.includes(item.id)} onChange={() => setSelected(toggle(selected, item.id))} />Approve this item</label><h4>{item.question || item.title}</h4>{item.options && <ul>{item.options.map((option) => <li key={option}>{option}</li>)}</ul>}{item.answer && <p><strong>Answer:</strong> {item.answer}</p>}<p>{item.feedback || item.summary}</p>{item.sections?.map((section, index) => <div key={index}><strong>{section.heading}</strong><p>{section.text}</p></div>)}{item.cards?.map((card,index) => <section key={index}><h4>{card.front}</h4><p>{card.back}</p>{card.visual?.steps && <ol>{card.visual.steps.map((step,position)=><li key={position}>{step}</li>)}</ol>}</section>)}{item.rubric?.map((row, index) => <p key={index}>{row.criterion}: {row.expected} ({row.points} points)</p>)}<small>{item.source_citation}</small>{(item.source_references || [item.source_reference]).filter(Boolean).map((reference, index) => <blockquote key={index}>PDF page {reference.page_number}: {reference.evidence_quote}</blockquote>)}{review.duplicates.find((duplicate) => duplicate.itemId === item.id)?.duplicate && <p>Potential existing duplicate: publication will skip this item unless handled in the main review workspace.</p>}</article>)}<label><input type="checkbox" checked={reviewConfirmed} onChange={(event) => setReviewConfirmed(event.target.checked)} />I reviewed the selected clinical content and its source evidence.</label><div className="button-row"><button type="button" className="primary" disabled={busy || !reviewConfirmed || !selected.length || detail?.run.scope_key !== 'global'} onClick={publish}>Publish selected reviewed items</button><button type="button" onClick={() => setReview(null)}>Close review</button></div></section>}
  </section>;
}
