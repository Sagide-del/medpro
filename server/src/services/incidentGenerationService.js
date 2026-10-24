import { randomUUID } from 'node:crypto';
import { withTransaction } from '../config/database.js';
import { fetchIncidentReport, incidentUrl } from './incidentSource.js';
import { ragError } from './ragService.js';
import { generateRetrievedDraft } from './groundedGenerationService.js';
import { createPersistentJob, updatePersistentJob } from './aiGeneratorV2Service.js';

export async function generateIncident(user, input, { fetchReport = fetchIncidentReport } = {}) {
  if (!process.env.DEEPSEEK_API_KEY) throw ragError('Configure the generation provider before creating incident drafts.',503);
  if (!['EMT','Paramedic','Nursing'].includes(input.program)) throw ragError('Choose a student track.');
  const title=String(input.title || '').trim().slice(0,200);
  if (!title) throw ragError('Give this incident study a title.');
  let sourceUrl=input.url ? incidentUrl(input.url).href : null;
  let text=String(input.text || '').trim();
  if (text.length > 50000) throw ragError('Use up to 50,000 characters of report text.');
  if (!text && sourceUrl) {
    try { const fetched=await fetchReport(sourceUrl);text=fetched.text;sourceUrl=fetched.url; }
    catch(error) { throw error.publicMessage ? error : ragError('This article could not be fetched. Paste the report text instead.',422); }
  }
  if (text.length < 200) throw ragError('Provide at least 200 characters of incident reporting. If the link is blocked, paste the report text.',422);
  const job=await createPersistentJob({adminId:user.sub,contentType:'case_study',title,
    request:{audience:input.program,publishDestination:'kenya_cases',topic:title,incidentReport:true},
    source:{type:'incident_report',url:sourceUrl,excerpt:text,citation:sourceUrl || `Pasted report: ${title}`}});
  return {id:job.id};
}

export async function processNextIncidentTask({ generate = generateRetrievedDraft } = {}) {
  const job = await withTransaction(async db => {
    await db.query("UPDATE ai_generation_jobs SET status='failed',updated_at=now() WHERE status='generating' AND request_json->>'incidentReport'='true' AND updated_at < now()-interval '15 minutes'");
    const result=await db.query("SELECT * FROM ai_generation_jobs WHERE status='queued' AND request_json->>'incidentReport'='true' ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1");
    if (!result.rows[0]) return null;
    await db.query("UPDATE ai_generation_jobs SET status='generating',updated_at=now() WHERE id=$1",[result.rows[0].id]);
    return result.rows[0];
  });
  if (!job) return false;
  const text=job.source_excerpt;
  const chunks=Array.from({length:Math.ceil(text.length/4500)},(_,index)=>({document_id:job.id,chunk_id:`report-${index+1}`,page_number:1,version:'submitted report',source_document:job.source_url || job.title,text:text.slice(index*4500,(index+1)*4500)}));
  try {
    const result=await generate({chunks,program:job.request_json.audience,topic:job.title,difficulty:'intermediate',count:1,types:['short_answer'],destination:'kenya_cases'});
    if (!result.preview_questions?.length) throw ragError('The report did not support an incident study. Nothing was published.',422);
    const items=result.preview_questions.map(item=>({...item,id:randomUUID(),source_citation:job.source_url || `Pasted incident report: ${job.title}`}));
    await updatePersistentJob(job.id,{status:'completed',result:{previewQuestions:items,contentNotes:result.content_notes}});
  } catch(error) {
    await updatePersistentJob(job.id,{status:'failed',result:{contentNotes:['Generation failed. Check the source and provider settings, then submit a new draft. Nothing was published.']}});
    console.error('Incident generation failed:',error.name);
  }
  return true;
}
