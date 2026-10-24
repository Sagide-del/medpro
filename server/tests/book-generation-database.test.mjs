import { Assessment } from '../src/models/Assessment.js';
import { MockPreTest } from '../src/models/MockPreTest.js';
import { generateIncident, processNextIncidentTask } from '../src/services/incidentGenerationService.js';
import { BOOK_DESTINATIONS } from '../src/services/bookGenerationPlan.js';
import 'dotenv/config';
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { pool } from '../src/config/database.js';
import { User } from '../src/models/User.js';
import { ensureQuestionBankSchema } from '../src/services/questionBankSchema.js';
import { createBookRun, getBookRun, listBookRuns, controlBookRun, processNextBookTask, bookCoverage } from '../src/services/bookGenerationService.js';
import { validateGroundedQuestions, validateGroundedArtifacts } from '../src/services/ragService.js';
import express from 'express';
import ragRouter from '../src/routes/ragSources.js';
import { authenticate } from '../src/middleware/auth.js';
import publishedRouter from '../src/routes/publishedContent.js';
import { signToken } from '../src/config/auth.js';
import { QuestionBank } from '../src/models/QuestionBank.js';
import { publishApproved } from '../src/services/aiGeneratorV2Service.js';

test('book queue creates scoped drafts, pauses, resumes, deduplicates, and publishes reviewed questions and cases', { skip: process.env.RUN_DB_TESTS !== 'true' }, async () => {
  assert(['localhost','127.0.0.1'].includes(new URL(process.env.DATABASE_URL).hostname));
  await ensureQuestionBankSchema();
  const user = await User.create({ fullName:'Book pipeline test',email:`book-${randomUUID()}@example.test`,password:'TestOnly123!',role:'super_admin',program:'Nursing' });
  const actor = { sub:user.user_id,role:'super_admin' };
  const sourceId = randomUUID(); const subject = `Test anatomy ${sourceId.slice(0,8)}`;
  const settings = { sourceId, targets:[{program:'Nursing'},{program:'EMT'}], questionsPerBatch:5, clientToken:randomUUID() };
  const oldRag=process.env.RAG_ENABLED,oldKey=process.env.DEEPSEEK_API_KEY;
  process.env.RAG_ENABLED='true';process.env.DEEPSEEK_API_KEY='test-provider-not-a-real-key';
  const quote = 'Cells are the structural and functional units of living organisms.';
  const generate = async ({chunks,program,destination,count,difficulty,types}) => {
    if(destination==='question_bank') return {preview_questions:validateGroundedQuestions(Array.from({length:count},(_,index)=>({question:`${program} cell knowledge check ${difficulty} ${types[0]} ${index+1}?`,options:types[0]==='true_false'?['True','False']:['Cell','Tissue','Organ','System'],answer:types[0]==='true_false'?'True':'Cell',feedback:quote,type:types[0],difficulty,chunk_id:chunks[0].chunk_id,evidence_quote:quote})),chunks,count,types,difficulty)};
    return {preview_questions:validateGroundedArtifacts([{title:`${program} ${destination} cell assessment`,question:'Explain how the cell concept informs your assessment.',summary:'A source-based learning scenario.',sections:[{heading:'Evidence',text:quote,chunk_id:chunks[0].chunk_id,evidence_quote:quote}],rubric:[{criterion:'Cell concept',expected:quote,points:1}],cards:[{front:'What is a cell?',back:quote,visual:{kind:'sequence',steps:['Structure','Function']}}]}],chunks,destination)};
  };
  try {
    await pool.query(`INSERT INTO rag_sources(id,scope_key,filename,file_hash,source_type,program,subject,version,status,created_by,approved_by,page_count,chunk_count)
      VALUES($1,'global','anatomy-test.pdf',$2,'textbook','all',$3,'test-edition','ready',$4,$4,2,2)`,[sourceId,sourceId.replaceAll('-','').repeat(2),subject,user.user_id]);
    await ensureQuestionBankSchema(); // A restart must retain already-classified shared sources.
    for(let page=1;page<=2;page++) await pool.query(`INSERT INTO rag_source_passages(document_id,chunk_id,page_number,ordinal,chapter_title,passage_text) VALUES($1,$2,$3,0,'Cells',$4)`,[sourceId,`chunk-${page}`,page,quote]);
    const coverage=await bookCoverage(actor,sourceId);assert.equal(coverage.chapters[0].passages,2);
    const first=await createBookRun(actor,settings);const duplicate=await createBookRun(actor,settings);assert.equal(first.id,duplicate.id);assert.equal(first.taskCount,4);
    await controlBookRun(actor,first.id,'pause');assert.equal(await processNextBookTask({generate,runId:first.id}),false);
    await controlBookRun(actor,first.id,'resume');
    await Promise.all([processNextBookTask({generate,runId:first.id}),processNextBookTask({generate,runId:first.id})]);
    while(await processNextBookTask({generate,runId:first.id})){}
    const detail=await getBookRun(actor,first.id);assert(detail.tasks.every(task=>task.status==='review'));
    assert.equal((await pool.query('SELECT count(*)::int AS n FROM ai_published_content WHERE created_by=$1',[user.user_id])).rows[0].n,0,'Drafts must not auto-publish');
    for(const task of detail.tasks){
      const job=(await pool.query('SELECT * FROM ai_generation_jobs WHERE id=$1',[task.job_id])).rows[0];
      const items=job.result_json.previewQuestions;assert(items.every(item=>item.source_reference.document_id===sourceId));
      await publishApproved({job,adminId:user.user_id,items,decisions:new Map(items.map(item=>[item.id,{decision:'approved'}]))});
    }
    const published=await pool.query('SELECT program,destination_key,count(*)::int AS n FROM ai_published_content WHERE created_by=$1 GROUP BY program,destination_key',[user.user_id]);
    assert.equal(published.rows.length,4);assert(published.rows.every(row=>row.n===(row.destination_key==='questions'?5:1)));
    const summary=(await listBookRuns(actor)).find(run=>run.id===first.id);assert.equal(summary.review,0);assert.equal(summary.published,4);
    const student=await User.create({fullName:'Book consumer test',email:`consumer-${randomUUID()}@example.test`,password:'TestOnly123!',program:'Nursing'});
    const app=express();app.use('/published',publishedRouter);const server=app.listen(0,'127.0.0.1');
    await new Promise(resolve=>server.once('listening',resolve));
    try {
      const token=signToken({sub:student.user_id,role:'student',program:'Nursing'});
      const response=await fetch(`http://127.0.0.1:${server.address().port}/published?program=Nursing&destination=psychometric_clinical`,{headers:{Authorization:`Bearer ${token}`}});
      assert.equal(response.status,200);const feed=await response.json();const cases=feed.content.filter(item=>item.source_citation.includes('anatomy-test.pdf'));
      assert.equal(cases.length,1);assert.equal(cases[0].program,'Nursing');assert(!('rubric' in cases[0].content_json));
      const bank=await QuestionBank.listQuestions({studentId:student.user_id,program:'Nursing',limit:50});
      assert.equal(bank.questions.filter(item=>item.question_text.startsWith('Nursing cell knowledge')).length,5);
      assert(bank.questions.every(item=>!('correct_option' in item)));
      const otherModule=(await pool.query("SELECT id FROM mcq_modules WHERE title=$1 AND program='EMT'",[subject])).rows[0].id;
      assert.equal(await Assessment.randomizedMcqQuestions(student.user_id,otherModule,{program:'Nursing'}),null);
      await assert.rejects(()=>Assessment.submitMcqAttempt({studentId:student.user_id,moduleId:otherModule}),/Module not found/);
      assert(!(await MockPreTest.listModules('Nursing')).some(module=>module.id===otherModule));
      await assert.rejects(()=>MockPreTest.startTest({module:otherModule,questionCount:20,program:'Nursing'}),/Unknown topic/);
      assert.equal((await fetch(`http://127.0.0.1:${server.address().port}/published?program=EMT&destination=psychometric_clinical`,{headers:{Authorization:`Bearer ${token}`}})).status,403);
      const otherQuestion=(await pool.query('SELECT id FROM mcq_questions WHERE module_id=$1 LIMIT 1',[otherModule])).rows[0].id;
      await assert.rejects(()=>QuestionBank.setBookmark({studentId:student.user_id,questionId:otherQuestion}),/not found in your study track/);
      const ownQuestion=bank.questions.find(question=>question.question_text.startsWith('Nursing cell knowledge'));
      const ownMock=await MockPreTest.startTest({module:ownQuestion.module_id,questionCount:20,program:'Nursing'});assert.equal(ownMock.actualCount,5);
      const mockResult=await MockPreTest.submitTest({module:ownQuestion.module_id,program:'Nursing',answers:ownMock.questions.map(question=>({id:question.id,selectedAnswer:question.options[0]}))});assert.equal(mockResult.totalCount,5);
      await QuestionBank.setBookmark({studentId:student.user_id,questionId:ownQuestion.id});assert.equal((await QuestionBank.progress(student.user_id,'Nursing')).bookmarked,1);
      await QuestionBank.setBookmark({studentId:student.user_id,questionId:ownQuestion.id,bookmarked:false});assert.equal((await QuestionBank.progress(student.user_id,'Nursing')).bookmarked,0);


      for (const [difficulty,type] of [['beginner','true_false'],['advanced','multiple_choice']]) {
        const run=await createBookRun(actor,{...settings,targets:[{program:'Nursing'}],destinations:['question_bank'],difficulty,questionTypes:[type],clientToken:randomUUID()});
        while(await processNextBookTask({generate,runId:run.id})){}
        for(const task of (await getBookRun(actor,run.id)).tasks){const job=(await pool.query('SELECT * FROM ai_generation_jobs WHERE id=$1',[task.job_id])).rows[0];const items=job.result_json.previewQuestions;assert.equal(items.length,5);await publishApproved({job,adminId:user.user_id,items,decisions:new Map(items.map(item=>[item.id,{decision:'approved'}]))});}
        const filtered=await QuestionBank.listQuestions({studentId:student.user_id,program:'Nursing',difficulty:difficulty==='beginner'?'basic':'hard',questionType:type,limit:50});
        assert.equal(filtered.questions.filter(item=>item.question_text.startsWith('Nursing cell knowledge')).length,5);
        assert(filtered.questions.every(item=>item.difficulty===difficulty && item.question_type===type));
        const counts=await QuestionBank.moduleCounts({program:'Nursing',difficulty,questionType:type});
        assert.equal(filtered.questions.reduce((sum,item)=>sum+(item.question_text.startsWith('Nursing cell knowledge')?1:0),0),5);
        assert(filtered.questions.every(item=>counts[item.module_id]>0));
      }
      const resources=BOOK_DESTINATIONS.filter(destination=>!['question_bank','psychometric_clinical'].includes(destination));
      const run=await createBookRun(actor,{...settings,targets:[{program:'Nursing'}],destinations:resources,clientToken:randomUUID()});
      while(await processNextBookTask({generate,runId:run.id})){}
      for(const task of (await getBookRun(actor,run.id)).tasks){assert.equal(task.status,'review');const job=(await pool.query('SELECT * FROM ai_generation_jobs WHERE id=$1',[task.job_id])).rows[0];const items=job.result_json.previewQuestions;await publishApproved({job,adminId:user.user_id,items,decisions:new Map(items.map(item=>[item.id,{decision:'approved'}]))});
        const feed=await (await fetch(`http://127.0.0.1:${server.address().port}/published?program=Nursing&destination=${task.destination}`,{headers:{Authorization:`Bearer ${token}`}})).json();
        const item=feed.content.find(item=>item.title.includes(`${task.destination} cell assessment`));assert(item,task.destination+' must appear in its student feed');
        if(task.destination==='flashcards') assert.equal(item.content_json.cards[0].visual.steps.length,2);
        if(task.destination.startsWith('psychometric_')) assert(!('rubric' in item.content_json));
      }
      await assert.rejects(()=>generateIncident(actor,{title:'Invalid report',program:'Nursing',text:'Too short'}),/200 characters/);
      const incident=await generateIncident(actor,{title:'Test incident',program:'Nursing',text:quote.repeat(5),url:'https://example.com/report'});
      assert.equal((await pool.query('SELECT status FROM ai_generation_jobs WHERE id=$1',[incident.id])).rows[0].status,'queued');
      await processNextIncidentTask({generate});
      const job=(await pool.query('SELECT * FROM ai_generation_jobs WHERE id=$1',[incident.id])).rows[0];assert.equal(job.status,'completed');
      const items=job.result_json.previewQuestions;assert.equal(items[0].source_citation,'https://example.com/report');
      await publishApproved({job,adminId:user.user_id,items,decisions:new Map(items.map(item=>[item.id,{decision:'approved'}]))});
      const incidents=await (await fetch(`http://127.0.0.1:${server.address().port}/published?program=Nursing&destination=kenya_cases`,{headers:{Authorization:`Bearer ${token}`}})).json();assert(incidents.content.some(item=>item.source_citation==='https://example.com/report'));

    } finally {await new Promise(resolve=>server.close(resolve));await pool.query('DELETE FROM users WHERE user_id=$1',[student.user_id]);}
    const second=await createBookRun(actor,{...settings,clientToken:randomUUID()});
    while(await processNextBookTask({generate,runId:second.id})){}
    assert((await getBookRun(actor,second.id)).tasks.every(task=>task.generated_count===0 && task.duplicate_count>0));
    const unavailable=await createBookRun(actor,{...settings,clientToken:randomUUID()});
    await processNextBookTask({generate:async()=>{throw Object.assign(new Error('Fixture provider unavailable'),{providerStatus:429})},runId:unavailable.id});
    const paused=await getBookRun(actor,unavailable.id);assert.equal(paused.run.paused,true);assert(paused.tasks.some(task=>task.status==='failed'));
    assert.equal(await processNextBookTask({generate,runId:unavailable.id}),false,'Provider failures must not continuously consume the queued plan');
    const withdrawn=await createBookRun(actor,{...settings,clientToken:randomUUID()});
    await pool.query("UPDATE rag_sources SET status='withdrawn' WHERE id=$1",[sourceId]);
    await processNextBookTask({generate:async()=>assert.fail('Withdrawn sources must never reach provider'),runId:withdrawn.id});
    assert((await getBookRun(actor,withdrawn.id)).tasks.some(task=>task.status==='failed'));
    const management=express();management.use(express.json());management.use('/rag',authenticate,ragRouter);
    const managementServer=management.listen(0,'127.0.0.1');await new Promise(resolve=>managementServer.once('listening',resolve));
    try {
      const token=signToken({sub:user.user_id,role:'super_admin',program:'Nursing'});
      const response=await fetch(`http://127.0.0.1:${managementServer.address().port}/rag/sources/${sourceId}/withdraw`,{method:'POST',headers:{Authorization:`Bearer ${token}`}});
      assert.equal(response.status,200);
      assert.equal((await pool.query("SELECT count(*)::int AS n FROM ai_published_content WHERE created_by=$1 AND status='published' AND job_id IN (SELECT job_id FROM book_generation_tasks)",[user.user_id])).rows[0].n,0);
      assert((await pool.query('SELECT total_questions FROM mcq_modules WHERE title=$1',[subject])).rows.every(row=>row.total_questions===0));
      assert.equal((await pool.query("SELECT count(*)::int AS n FROM book_generation_tasks t JOIN book_generation_runs r ON r.id=t.run_id WHERE r.source_id=$1 AND t.status='queued'",[sourceId])).rows[0].n,0);
    } finally {await new Promise(resolve=>managementServer.close(resolve));}
    await assert.rejects(()=>getBookRun({sub:randomUUID(),role:'teacher'},first.id),/not found/);
  } finally {
    process.env.RAG_ENABLED=oldRag || '';process.env.DEEPSEEK_API_KEY=oldKey || '';
    const jobs=await pool.query('SELECT id FROM ai_generation_jobs WHERE admin_id=$1',[user.user_id]);const ids=jobs.rows.map(row=>row.id);
    await pool.query('DELETE FROM content_audit_log WHERE job_id=ANY($1::uuid[])',[ids]);
    await pool.query('DELETE FROM content_registry WHERE source_job_id=ANY($1::uuid[])',[ids]);
    await pool.query('DELETE FROM mcq_questions WHERE published_content_id IN (SELECT id FROM ai_published_content WHERE created_by=$1)',[user.user_id]);
    await pool.query('DELETE FROM ai_published_content WHERE created_by=$1',[user.user_id]);
    await pool.query('DELETE FROM book_generation_runs WHERE created_by=$1',[user.user_id]);
    await pool.query('DELETE FROM ai_generation_jobs WHERE admin_id=$1',[user.user_id]);
    await pool.query('DELETE FROM rag_source_events WHERE source_id=$1',[sourceId]);
    await pool.query('DELETE FROM rag_sources WHERE id=$1',[sourceId]);
    await pool.query('DELETE FROM mcq_modules WHERE title=$1',[subject]);
    await pool.query('DELETE FROM users WHERE user_id=$1',[user.user_id]);
  }
});
test.after(async()=>{await pool.end()});
