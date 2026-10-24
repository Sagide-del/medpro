import 'dotenv/config';
import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { randomUUID } from 'node:crypto';
import { pool } from '../src/config/database.js';
import { ensureQuestionBankSchema } from '../src/services/questionBankSchema.js';
import { User } from '../src/models/User.js';
import ragRouter from '../src/routes/ragSources.js';

test('failed PDF transfers retain actionable state and retry same registration; concurrent upload and withdrawal cannot revive a source',{skip:process.env.RUN_DB_TESTS!=='true'},async()=>{
  assert(['localhost','127.0.0.1'].includes(new URL(process.env.DATABASE_URL).hostname));
  await ensureQuestionBankSchema();
  const user=await User.create({fullName:'Upload recovery test',email:`upload-${randomUUID()}@example.test`,password:'TestOnly123!',role:'super_admin',program:'Paramedic'});
  const saved=Object.fromEntries(['RAG_ENABLED','RAG_SERVICE_URL','RAG_SERVICE_KEY'].map(key=>[key,process.env[key]]));
  let code=401,hold=null,arrived=null;
  const storage=express();storage.put('/files/:id',express.raw({type:'application/pdf'}),async(req,res)=>{
    const row=(await pool.query('SELECT status FROM rag_sources WHERE id=$1',[req.params.id])).rows[0];assert.equal(row.status,'uploading');
    assert(req.body.subarray(0,5).toString()==='%PDF-');
    if(arrived)arrived();if(hold)await hold;
    res.status(code).json({stored:code===200});
  });
  const remote=storage.listen(0,'127.0.0.1');await new Promise(resolve=>remote.once('listening',resolve));
  const app=express();app.use(express.json());app.use((req,_res,next)=>{req.user={sub:user.user_id,role:'super_admin'};next();});app.use('/rag',ragRouter);app.use((error,_req,res,_next)=>res.status(error.status || 500).json({error:error.publicMessage || error.message}));
  const api=app.listen(0,'127.0.0.1');await new Promise(resolve=>api.once('listening',resolve));
  const base=`http://127.0.0.1:${api.address().port}/rag`;
  const upload=async(version='test')=>{const data=new FormData();data.set('file',new Blob(['%PDF-1.4\nUpload recovery fixture'],{type:'application/pdf'}),'book.pdf');for(const [key,value]of Object.entries({program:'Paramedic',subject:`Upload ${user.user_id}`,sourceType:'textbook',version}))data.set(key,value);const response=await fetch(`${base}/sources`,{method:'POST',body:data});return {status:response.status,data:await response.json()};};
  try{
    process.env.RAG_ENABLED='true';process.env.RAG_SERVICE_KEY='x'.repeat(32);process.env.RAG_SERVICE_URL=`http://127.0.0.1:${remote.address().port}`;
    let result=await upload();assert.equal(result.status,503);assert.match(result.data.error,/service key/);
    let sources=(await(await fetch(`${base}/sources`)).json()).sources.filter(source=>source.subject.includes(user.user_id));assert.equal(sources.length,1);const id=sources[0].id;assert.equal(sources[0].status,'failed');assert.match(sources[0].error,/service key/);
    code=200;result=await upload();assert.equal(result.status,201);assert.equal(result.data.id,id);
    assert.equal((await upload()).status,409,'Successful uploads cannot be overwritten');
    await pool.query("UPDATE rag_sources SET status='uploading',updated_at=now()-interval '4 minutes' WHERE id=$1",[id]);
    sources=(await(await fetch(`${base}/sources`)).json()).sources;assert.equal(sources.find(source=>source.id===id).status,'failed');
    result=await upload();assert.equal(result.status,201);assert.equal(result.data.id,id,'Interrupted registration is reusable');
    let release;hold=new Promise(resolve=>{release=resolve;});const received=new Promise(resolve=>{arrived=resolve;});
    const pending=upload('concurrent');await received;
    const duplicate=await upload('concurrent');assert.equal(duplicate.status,409);assert.match(duplicate.data.error,/already being transferred/);
    const active=(await pool.query("SELECT id FROM rag_sources WHERE created_by=$1 AND version='concurrent'",[user.user_id])).rows[0].id;
    const withdrawn=await fetch(`${base}/sources/${active}/withdraw`,{method:'POST'});assert.equal(withdrawn.status,200);
    release();result=await pending;assert.equal(result.status,409);
    assert.equal((await pool.query('SELECT status FROM rag_sources WHERE id=$1',[active])).rows[0].status,'withdrawn');
    hold=null;arrived=null;
    code=409;result=await upload('database-mismatch');assert.match(result.data.error,/same database/);
  }finally{
    for(const [key,value]of Object.entries(saved)){if(value===undefined)delete process.env[key];else process.env[key]=value;}
    await new Promise(resolve=>api.close(resolve));await new Promise(resolve=>remote.close(resolve));
    await pool.query('DELETE FROM rag_source_events WHERE source_id IN (SELECT id FROM rag_sources WHERE created_by=$1)',[user.user_id]);
    await pool.query('DELETE FROM rag_sources WHERE created_by=$1',[user.user_id]);await pool.query('DELETE FROM users WHERE user_id=$1',[user.user_id]);
  }
});
test.after(async()=>{await pool.end();});
