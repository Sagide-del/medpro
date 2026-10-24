import { query, withTransaction } from '../config/database.js';
import { canonicalProgram } from '../utils/programs.js';
import { ragError } from './ragService.js';
import { normalizeKenyaCase, publicKenyaCase, validatePublication, evaluateWorksheet } from './kenyaCaseFormat.js';
const active="c.status='published' AND (c.published_content_id IS NULL OR EXISTS(SELECT 1 FROM ai_published_content p WHERE p.id=c.published_content_id AND p.status='published'))";
const courseLock=(db,program,shared=false)=>db.query(`SELECT pg_advisory_xact_lock${shared?'_shared':''}(hashtext($1))`,[`ke-course:${program}`]);
export async function importKenyaCases(user,input) {
 const raw=Array.isArray(input)?input:input.cases;
 if(Buffer.byteLength(JSON.stringify(input),'utf8')>8*1024*1024)throw ragError('Use a case JSON payload up to 8 MB.');
 if(!Array.isArray(raw) || !raw.length || raw.length>1000)throw ragError('Upload a cases array containing 1–1,000 cases.');
 const errors=[];
 const cases=raw.map((item,index)=>{try{return normalizeKenyaCase(item);}catch(error){if(error.status!==400)throw error;errors.push(`Case ${index+1}${item?.case_code?` (${String(item.case_code).slice(0,120)})`:''}: ${error.publicMessage || error.message}`);return null;}});
 if(errors.length)throw ragError(`Nothing was saved. Fix ${errors.length} invalid case(s): ${errors.slice(0,10).join(' | ')}${errors.length>10?' | More cases also need correction.':''}`);
 if(new Set(cases.map(doc=>doc.program+':'+doc.case_code)).size!==cases.length)throw ragError('Nothing was saved. The upload contains duplicate case codes within a track. Give each new case a unique case_code.');
 const publish=input.publish===true;
 if(publish && input.reviewConfirmed!==true)throw ragError('Confirm source and clinical review before publishing.');
 if(publish)cases.forEach(validatePublication);
 return withTransaction(async db=>{
  for(const program of [...new Set(cases.map(doc=>doc.program))].sort())await courseLock(db,program);
  const saved=[];
  for(const doc of cases){
   const existing=(await db.query('SELECT * FROM ke_cases WHERE program=$1 AND case_code=$2 FOR UPDATE',[doc.program,doc.case_code])).rows[0];
   const order=(input.appendNew===true?(existing?.order_number || null):(doc.order_number || existing?.order_number)) || (await db.query('SELECT COALESCE(max(order_number),0)+1 AS n FROM ke_cases WHERE program=$1',[doc.program])).rows[0].n;
   const document={...doc,order_number:undefined};
   const result=await db.query(`INSERT INTO ke_cases(case_code,program,order_number,title,document,status,created_by)
    VALUES($1,$2,$3,$4,$5::jsonb,$6,$7) ON CONFLICT(program,case_code) DO UPDATE SET order_number=EXCLUDED.order_number,title=EXCLUDED.title,
    revision=ke_cases.revision+CASE WHEN ke_cases.document<>EXCLUDED.document THEN 1 ELSE 0 END,
    document=EXCLUDED.document,status=EXCLUDED.status,updated_at=now() RETURNING *`,
   [doc.case_code,doc.program,order,doc.title,JSON.stringify(document),publish?'published':'draft',user.sub]);saved.push(...result.rows);
  }
  return saved;
 }).catch(error=>{if(error.code==='23505')throw ragError('Case order numbers conflict. Include both cases in a JSON update to swap their order, or omit order_number to append new cases.',409);throw error;});
}
export async function adminKenyaCases(){return (await query('SELECT * FROM ke_cases ORDER BY program,order_number,id')).rows;}
export async function setCaseStatus(id,publish,confirmed) {
 return withTransaction(async db=>{
  const record=(await db.query('SELECT program FROM ke_cases WHERE id=$1',[id])).rows[0];if(!record)throw ragError('Case not found.',404);
  await courseLock(db,record.program);
  const row=(await db.query('SELECT * FROM ke_cases WHERE id=$1 FOR UPDATE',[id])).rows[0];
  if(publish){if(!confirmed)throw ragError('Confirm source and clinical review before publishing.');validatePublication(row.document);}
  return (await db.query("UPDATE ke_cases SET status=$2,updated_at=now() WHERE id=$1 RETURNING *",[id,publish?'published':'draft'])).rows[0];
 });
}
async function catalog(db,user) {
 const rows=(await db.query(`SELECT c.id,c.case_code,c.title,c.order_number,c.revision,c.program,c.document->>'completion_rule' AS completion_rule,
  EXISTS(SELECT 1 FROM ke_case_attempts a WHERE a.student_id=$1 AND a.case_id=c.id AND a.revision=c.revision AND a.completed) AS completed
  FROM ke_cases c WHERE ${active} AND c.program=$2 ORDER BY c.order_number,c.id`,[user.sub,user.program])).rows;
 let earlierComplete=true;
 return rows.map((row,index)=>{const available=earlierComplete,status=available?(row.completed?'completed':'available'):'locked';earlierComplete=earlierComplete&&row.completed;return {...row,number:index+1,status};});
}
export async function studentKenyaCases(user){return catalog({query},user);}
async function accessible(db,user,id){
 const list=await catalog(db,user),item=list.find(item=>item.id===id);
 if(!item)throw ragError('Case not found in your study track.',404);
 if(item.status==='locked')throw ragError('Complete the previous case before opening this case.',423);
 const row=(await db.query(`SELECT c.* FROM ke_cases c WHERE id=$1 AND ${active}`,[id])).rows[0];
 if(!row)throw ragError('Case is no longer published.',404);
 return {row,item,list};
}
export async function readKenyaCase(user,id){
 return withTransaction(async db=>{
  await courseLock(db,user.program,true);
  const {row,item,list}=await accessible(db,user,id);
  const draft=(await db.query('SELECT responses FROM ke_case_drafts WHERE student_id=$1 AND case_id=$2 AND revision=$3',[user.sub,id,row.revision])).rows[0];
  const attempt=(await db.query('SELECT id,responses,review,score,completed,submitted_at FROM ke_case_attempts WHERE student_id=$1 AND case_id=$2 AND revision=$3 ORDER BY submitted_at DESC LIMIT 1',[user.sub,id,row.revision])).rows[0];
  return {cases:list,caseStudy:{...item,...publicKenyaCase(row.document)},responses:draft?.responses || attempt?.responses || {},attempt:attempt || null};
 });
}
export async function saveKenyaDraft(user,id,responses,revision){
 return withTransaction(async db=>{
  await courseLock(db,user.program,true);
  const {row,item}=await accessible(db,user,id);if(item.completed)throw ragError('Completed worksheets are read-only.',409);if(revision!==row.revision)throw ragError('This case was updated. Reload it before continuing.',409);
  const safe=evaluateWorksheet(row.document,responses,{partial:true});
  await db.query('INSERT INTO ke_case_drafts(student_id,case_id,revision,responses) VALUES($1,$2,$3,$4::jsonb) ON CONFLICT(student_id,case_id,revision) DO UPDATE SET responses=EXCLUDED.responses,updated_at=now()',[user.sub,id,row.revision,JSON.stringify(safe.responses)]);
 });
}
export async function submitKenyaCase(user,id,input){
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.clientToken || ''))throw ragError('A valid submission token is required.');
 return withTransaction(async db=>{
  await courseLock(db,user.program,true);await db.query('SELECT pg_advisory_xact_lock(hashtext($1))',[`ke-student:${user.sub}:${user.program}`]);
  const {row}=await accessible(db,user,id);if(input.revision!==row.revision)throw ragError('This case was updated. Reload it before submitting.',409);
  const existing=(await db.query('SELECT * FROM ke_case_attempts WHERE student_id=$1 AND client_token=$2',[user.sub,input.clientToken])).rows[0];
  if(existing){if(existing.case_id!==id || existing.revision!==row.revision)throw ragError('Submission token belongs to another case.',409);return {attempt:existing,cases:await catalog(db,user)};}
  const grade=evaluateWorksheet(row.document,input.responses);
  const attempt=(await db.query(`INSERT INTO ke_case_attempts(student_id,case_id,revision,client_token,responses,review,score,completed)
   VALUES($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7,$8) RETURNING *`,[user.sub,id,row.revision,input.clientToken,JSON.stringify(grade.responses),JSON.stringify(grade.review),grade.score,grade.completed])).rows[0];
  await db.query('DELETE FROM ke_case_drafts WHERE student_id=$1 AND case_id=$2 AND revision=$3',[user.sub,id,row.revision]);
  return {attempt,cases:await catalog(db,user)};
 });
}
export async function syncPublishedKenyaCase(db,content) {
 const program=canonicalProgram(content.program);if(!program)return;
 await courseLock(db,program);
 const found=(await db.query('SELECT id FROM ke_cases WHERE published_content_id=$1',[content.id])).rows[0];if(found)return;
 const item=content.content_json || {},facts=[item.summary,...(Array.isArray(item.sections)?item.sections:[]).filter(Boolean).map(section=>`${section.heading || ''}: ${section.text || ''}`)].filter(Boolean).join('\n\n');
 const doc=normalizeKenyaCase({case_code:`INCIDENT-${content.id}`,level:program,title:content.title,source:content.source_citation || 'Previously reviewed incident report',reported_facts:facts,
  tables:[{table_key:'reflection',title:'Incident learning reflection',rows:[{prompt:(item.question && item.question!==item.title?item.question:null) || 'Identify the reported facts and the information still needed to assess this incident.',hidden_answer:facts || content.title,scoring:'reflection'}]}]});
 const order=(await db.query('SELECT COALESCE(max(order_number),0)+1 AS n FROM ke_cases WHERE program=$1',[program])).rows[0].n;
 await db.query("INSERT INTO ke_cases(case_code,program,order_number,title,document,status,created_by,published_content_id) VALUES($1,$2,$3,$4,$5::jsonb,'published',$6,$7) ON CONFLICT(published_content_id) DO NOTHING",[doc.case_code,program,order,doc.title,JSON.stringify(doc),content.created_by,content.id]);
}
