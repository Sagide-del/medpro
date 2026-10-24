import { canonicalProgram } from '../utils/programs.js';
import { ragError } from './ragService.js';
const safeKey=value=>/^[A-Za-z0-9_-]{1,100}$/.test(value) && !['__proto__','constructor','prototype'].includes(value);
const clean=(value,max=20000)=>String(value ?? '').trim().slice(0,max);
export function normalizeKenyaCase(input) {
 if(!input || typeof input!=='object' || Array.isArray(input))throw ragError('Each case must be a JSON object.');
 const program=canonicalProgram(input.program || input.level);
 const case_code=clean(input.case_code,120),title=clean(input.title || input.incident_name,250);
 if(!program || !case_code || !title)throw ragError('Every case needs case_code, level (EMT, Paramedic or Nursing), and title or incident_name.');
 if(!Array.isArray(input.tables) || !input.tables.length || input.tables.length>20)throw ragError(`${case_code}: provide 1–20 worksheet tables.`);
 const used=new Set();
 const tables=input.tables.map((table,index)=>{
  if(!table || typeof table!=='object' || Array.isArray(table))throw ragError(`${case_code}: every table must be an object.`);
  if(table.columns!==undefined && !Array.isArray(table.columns))throw ragError(`${case_code}: columns must be an array of labels.`);
  const table_key=clean(table.table_key || `table-${index+1}`,100);
  if(!safeKey(table_key) || used.has(table_key))throw ragError(`${case_code}: table keys must be unique.`);used.add(table_key);
  const columns=(table.columns || ['Your answer']).map((value,index)=>({key:`column-${index+1}`,label:clean(value && typeof value==='object'?value.label:value,120)}));
  if(!columns.length || columns.length>4 || columns.some(column=>!column.label))throw ragError(`${case_code}: tables need 1–4 answer column labels.`);
  if(!Array.isArray(table.rows) || !table.rows.length || table.rows.length>30)throw ragError(`${case_code}: each table needs 1–30 rows.`);
  const rowKeys=new Set();
  const rows=table.rows.map((row,index)=>{
   if(!row || typeof row!=='object' || Array.isArray(row))throw ragError(`${case_code}: every row must be an object.`);
   const row_key=clean(row.row_key || `row-${index+1}`,100),prompt=clean(row.prompt,2000);
   if(!prompt || !safeKey(row_key) || rowKeys.has(row_key))throw ragError(`${case_code}: each row needs a prompt and unique row key.`);rowKeys.add(row_key);
   const scoring=['exact_match','keyword_match'].includes(row.scoring)?row.scoring:'reflection';
   return {row_key,prompt,required:row.required!==false,hidden_answer:clean(row.hidden_answer),scoring,
    keywords:Array.isArray(row.keywords)?row.keywords.map(value=>clean(value,120)).filter(Boolean):[],
    accepted_answers:Array.isArray(row.accepted_answers)?row.accepted_answers.map(value=>clean(value,2000)).filter(Boolean):[]};
  });
  return {table_key,title:clean(table.title || table_key.replaceAll('_',' '),250),columns,rows,reference_answer:clean(table.reference_answer || table.hidden_answer)};
 });
 const completion_rule=input.completion_rule || 'submission';
 if(!['submission','pass'].includes(completion_rule))throw ragError('completion_rule must be submission or pass.');
 const passing_score=Number(input.passing_score ?? 80);
 if(!Number.isInteger(passing_score) || passing_score<1 || passing_score>100)throw ragError('passing_score must be 1–100.');
 const order=input.order_number == null ? null : Number(input.order_number);
 if(order!==null && (!Number.isInteger(order) || order<1))throw ragError('order_number must be a positive integer.');
 return {case_code,program,order_number:order,title,source:clean(input.source,4000),incident_year:clean(input.incident_year,20),
  reported_facts:clean(input.reported_facts || input.verified_facts),scene_context:clean(input.scene_context),
  patient: Object.fromEntries(['age','sex','findings','history','chief_complaint','observations'].filter(key=>input.patient?.[key]!==undefined).map(key=>[key,clean(typeof input.patient[key]==='object'?JSON.stringify(input.patient[key]):input.patient[key],6000)])),
  tables,completion_rule,passing_score};
}
export function validatePublication(doc) {
 if(!doc.tables.some(table=>table.rows.some(row=>row.required)))throw ragError('At least one worksheet row must be required before publication.');
 if(!doc.source)throw ragError(`${doc.case_code}: add source attribution before publishing.`);
 for(const table of doc.tables)for(const row of table.rows){
  if(!row.hidden_answer && !table.reference_answer)throw ragError(`${doc.case_code}: supply a reference answer for every row or table.`);
  if(doc.completion_rule==='pass' && (row.scoring==='reflection' || (row.scoring==='keyword_match' && !row.keywords.length) || (row.scoring==='exact_match' && !row.hidden_answer && !row.accepted_answers.length)))throw ragError('Pass-based progression requires explicit automatic scoring for every row. Use submission-based completion for reflective worksheets.');
 }
}
export function publicKenyaCase(doc) {
 return {...doc,tables:doc.tables.map(table=>({table_key:table.table_key,title:table.title,columns:table.columns,rows:table.rows.map(({row_key,prompt,required})=>({row_key,prompt,required}))}))};
}
const normalized=value=>String(value || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
export function evaluateWorksheet(doc,responses,{partial=false}={}) {
 if(!responses || typeof responses!=='object' || Array.isArray(responses))throw ragError('Provide worksheet responses.');
 const stored={},review=[];let answered=0,total=0,graded=0,correct=0;
 for(const table of doc.tables){
  stored[table.table_key]={};
  for(const row of table.rows){
   const cells={};
   for(const column of table.columns){
    const value=responses[table.table_key]?.[row.row_key]?.[column.key] ?? '';
    if(typeof value!=='string' || value.length>4000)throw ragError('Each worksheet cell must contain up to 4,000 characters.');
    cells[column.key]=value.trim();if(row.required){total++;if(value.trim())answered++;}
   }
   stored[table.table_key][row.row_key]=cells;
   const text=Object.values(cells).join(' ');let isCorrect=null;
   if((row.required || text.trim()) && row.scoring==='exact_match'){const accepted=row.accepted_answers.length?row.accepted_answers:[row.hidden_answer];isCorrect=accepted.filter(Boolean).some(value=>normalized(value)===normalized(text));}
   if((row.required || text.trim()) && row.scoring==='keyword_match' && row.keywords.length)isCorrect=row.keywords.every(word=>normalized(text).includes(normalized(word)));
   if(isCorrect!==null){graded++;if(isCorrect)correct++;}
   review.push({table_key:table.table_key,row_key:row.row_key,prompt:row.prompt,hidden_answer:row.hidden_answer || table.reference_answer,is_correct:isCorrect});
  }
 }
 if(!partial && answered!==total)throw ragError(`Complete all required cells before submitting (${answered}/${total} filled).`);
 const score=graded?Math.round(100*correct/graded):null;
 return {responses:stored,review,answered,total,score,completed:answered===total && (doc.completion_rule==='submission' || (score!==null && score>=doc.passing_score))};
}
