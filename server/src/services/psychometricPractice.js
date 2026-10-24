import {createHash} from 'node:crypto';
import { withTransaction } from '../config/database.js';
export const PSYCHOMETRIC_AREAS=['psychometric_clinical','psychometric_situational','psychometric_readiness'];
export const practicePrompt=item=>[item?.question || item?.prompt || '',item?.scenario || ''].filter(Boolean).join(' ').trim();
const programSql="CASE WHEN lower(trim(p.program)) IN ('nursing','nurse') THEN 'Nursing' WHEN lower(trim(p.program)) IN ('paramedic','emt-paramedic') THEN 'Paramedic' WHEN lower(trim(p.program)) IN ('emt','emt-basic','emt-intermediate') THEN 'EMT' ELSE NULL END";
const words=value=>new Set(String(value || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').split(/\s+/).filter(Boolean));
export function similarPractice(left,right){
 const a=words(left),b=words(right);if(!a.size || !b.size)return false;
 const intersection=[...a].filter(word=>b.has(word)).length;
 return intersection/new Set([...a,...b]).size>=0.72;
}
// Resume the current activity across reloads/devices. Assign one fresh prompt only after submission.
export async function nextPsychometricActivity(studentId,program,destination){
 return withTransaction(async db=>{
  await db.query('SELECT pg_advisory_xact_lock(hashtext($1))',[`psychometric:${studentId}`]);
  const {rows:current}=await db.query(`SELECT p.* FROM psychometric_assignments a JOIN ai_published_content p ON p.id=a.content_id
   WHERE a.student_id=$1 AND a.destination_key=$2 AND p.status='published' AND (${programSql})=$3
   AND NOT EXISTS(SELECT 1 FROM published_content_responses r WHERE r.student_id=$1 AND r.content_id=p.id)
   ORDER BY a.assigned_at LIMIT 1`,[studentId,destination,program]);
  if(current.length)return current;
  const {rows:history}=await db.query(`SELECT prompt_snapshot AS prompt FROM psychometric_assignments WHERE student_id=$1
   UNION ALL SELECT coalesce(content_snapshot->>'question',content_snapshot->>'prompt','') || ' ' || coalesce(content_snapshot->>'scenario','')
   FROM published_content_responses WHERE student_id=$1`,[studentId]);
  const {rows:candidates}=await db.query(`SELECT p.* FROM ai_published_content p WHERE p.status='published' AND (${programSql})=$1 AND p.destination_key=$2
   AND NOT EXISTS(SELECT 1 FROM psychometric_assignments a WHERE a.student_id=$3 AND a.content_id=p.id)
   AND NOT EXISTS(SELECT 1 FROM published_content_responses r WHERE r.student_id=$3 AND r.content_id=p.id)
   ORDER BY random()`,[program,destination,studentId]);
  const {rows:usage}=await db.query('SELECT prompt_snapshot,count(*)::int AS n FROM psychometric_assignments WHERE destination_key=$1 GROUP BY prompt_snapshot',[destination]);
  const normalize=value=>String(value || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
  const frequency=new Map();for(const row of usage){const key=normalize(row.prompt_snapshot);frequency.set(key,(frequency.get(key) || 0)+row.n);}
  candidates.sort((a,b)=>(frequency.get(normalize(practicePrompt(a.content_json))) || 0)-(frequency.get(normalize(practicePrompt(b.content_json))) || 0));
  const chosen=candidates.find(row=>{const prompt=practicePrompt(row.content_json);return prompt && !history.some(previous=>similarPractice(prompt,previous.prompt));});
  if(!chosen)return [];
  await db.query('INSERT INTO psychometric_assignments(student_id,content_id,destination_key,prompt_snapshot) VALUES($1,$2,$3,$4)',[studentId,chosen.id,destination,practicePrompt(chosen.content_json)]);
  return [chosen];
 });
}

export function orderPracticeOptions(options,studentId,contentId){return options.map(value=>({value,key:createHash('sha256').update(JSON.stringify([studentId,contentId,value])).digest('hex')})).sort((a,b)=>a.key.localeCompare(b.key)).map(row=>row.value);}
