import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import express from 'express';
import {pool} from '../src/config/database.js';
import {User} from '../src/models/User.js';
import {signToken} from '../src/config/auth.js';
import {ensureQuestionBankSchema} from '../src/services/questionBankSchema.js';
import {similarPractice} from '../src/services/psychometricPractice.js';
import publishedRouter from '../src/routes/publishedContent.js';

test('similarity catches punctuation, case and close wording without merging unrelated tasks',()=>{
 assert(similarPractice('Assess the airway and identify immediate risks.','Assess the airway and identify immediate risks!'));
 assert(similarPractice('Assess airway breathing circulation disability exposure and identify risks','Assess airway breathing circulation disability exposure and identify immediate risks'));
 assert(!similarPractice('Explain effective team communication at handover','Compare cellular structure and organ function'));
});
test('practice resumes, varies across students, excludes prior and similar prompts, protects answers and stops on exhaustion',{skip:process.env.RUN_DB_TESTS!=='true'},async()=>{
 assert(['localhost','127.0.0.1'].includes(new URL(process.env.DATABASE_URL).hostname));await ensureQuestionBankSchema();
 const users=[];let job;let server;
 try{
  for(let i=0;i<4;i++)users.push(await User.create({fullName:'Practice test',email:randomUUID()+'@example.test',password:'TestOnly123!',role:i?'student':'super_admin',program:'Nursing'}));
  job=(await pool.query("INSERT INTO ai_generation_jobs(admin_id,content_type,title) VALUES($1,'psychometric_clinical','Practice fixture') RETURNING id",[users[0].user_id])).rows[0].id;
  const prompts=['Interpret airway observations and prioritize oxygenation assessment','Describe safe medication checks and identify contraindication evidence','Explain clear team communication during patient transfer'];
  const items=[];
  for(let i=0;i<4;i++)items.push((await pool.query(`INSERT INTO ai_published_content(job_id,source_item_id,content_type,title,program,destination_key,content_json,created_by,status)
   VALUES($1,$2,'psychometric_clinical',$3,'Nursing','psychometric_clinical',$4::jsonb,$5,'published') RETURNING id`,[job,String(i),'Activity '+i,JSON.stringify({question:prompts[i%3]+(i===3?'!':''),type:'multiple_choice',options:['Supported response','Distractor one','Distractor two','Distractor three'],option_rationales:['Supported response','Distractor one','Distractor two','Distractor three'].map(option=>({option,explanation:'SECRET-RATIONALE'})),answer:'Supported response',rubric:[{expected:'SECRET-REFERENCE'}]}),users[0].user_id])).rows[0]);
  const app=express();app.use(express.json());app.use('/published',publishedRouter);app.use((error,_req,res,_next)=>res.status(error.status||500).json({error:error.publicMessage||error.message}));server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
  const call=async(path='',actor=1,body)=>{const res=await fetch(`http://127.0.0.1:${server.address().port}/published${path}`,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+signToken({sub:users[actor].user_id,role:'student',program:'Nursing'}),'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});return {status:res.status,data:await res.json()};};
  const get=()=>call('?destination=psychometric_clinical');
  const [a,b]=await Promise.all([get(),get()]);assert.equal(a.data.content.length,1);assert.equal(a.data.content[0].id,b.data.content[0].id,'Concurrent reloads resume the same item');assert(!JSON.stringify(a.data).includes('SECRET'));assert(!('answer' in a.data.content[0].content_json));assert(!('rubric' in a.data.content[0].content_json));assert(!JSON.stringify(a.data).includes('Supported response\",\"rubric'));
  const other=await call('?destination=psychometric_clinical',2);assert.notEqual(other.data.content[0].id,a.data.content[0].id,'Least-used activities vary across students when fresh alternatives exist');
  assert(!similarPractice(other.data.content[0].content_json.question,a.data.content[0].content_json.question),'Allocation varies equivalent stems between students when distinct alternatives exist');
  assert.equal((await call('/'+other.data.content[0].id+'/responses',1,{response:'Supported response',clientToken:randomUUID()})).status,404,'Unassigned tasks cannot be submitted');
  assert.equal((await call('?program=EMT&destination=psychometric_clinical')).status,403);
  for(const destination of ['clinical_protocols','skills_videos'])assert.equal((await call('?destination='+destination)).status,410);
  const seen=[];let current=a.data.content[0];
  for(let i=0;i<3;i++){
   assert(!seen.some(item=>similarPractice(item.content_json.question,current.content_json.question)));seen.push(current);
   const clientToken=randomUUID();const response=await call('/'+current.id+'/responses',1,{response:'Supported response',clientToken});assert.equal(response.status,201);assert.equal(response.data.status,'graded');assert.equal(response.data.submission.score,100);
   assert.equal((await call('/'+current.id+'/responses',1,{response:'Supported response',clientToken})).status,200,'Retry must be idempotent');
   assert.equal((await call('/'+current.id+'/responses',1,{response:'Supported response',clientToken:randomUUID()})).status,404,'A submitted task cannot be submitted as fresh practice again');
   const next=await get();if(i===2)assert.equal(next.data.content.length,0,'Do not recycle similar activities at exhaustion');else{assert.equal(next.data.content.length,1);current=next.data.content[0];}
  }
  assert.equal(seen.length,3);
  const oldContent=(await pool.query('SELECT content_json FROM ai_published_content WHERE id=$1',[items[0].id])).rows[0].content_json;
  await pool.query("INSERT INTO published_content_responses(student_id,content_id,program,response,content_snapshot) VALUES($1,$2,'Nursing','Historical response',$3::jsonb)",[users[3].user_id,items[0].id,JSON.stringify(oldContent)]);
  const historical=await call('?destination=psychometric_clinical',3);assert(!similarPractice(historical.data.content[0].content_json.question,oldContent.question),'Pre-assignment historical responses prevent repeats');
  assert.equal((await call('?destination=psychometric_clinical',2)).data.content[0].id,other.data.content[0].id,'Another student’s work is independent');
 }finally{
  if(server)await new Promise(resolve=>server.close(resolve));
  const ids=users.map(user=>user.user_id);await pool.query('DELETE FROM published_content_responses WHERE student_id=ANY($1::uuid[])',[ids]);
  if(job){await pool.query('DELETE FROM ai_published_content WHERE job_id=$1',[job]);await pool.query('DELETE FROM ai_generation_jobs WHERE id=$1',[job]);}
  await pool.query('DELETE FROM users WHERE user_id=ANY($1::uuid[])',[ids]);
 }
});
test.after(()=>pool.end());
