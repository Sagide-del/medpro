import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mkdtemp,mkdir,rm} from 'node:fs/promises';
import express from 'express';
import {pool} from '../src/config/database.js';
import {User} from '../src/models/User.js';
import {signToken} from '../src/config/auth.js';
import {authenticate} from '../src/middleware/auth.js';
import {ensureQuestionBankSchema} from '../src/services/questionBankSchema.js';
import mediaRouter from '../src/routes/masterContentActions.js';
import publishedRouter from '../src/routes/publishedContent.js';
test('reviewed drug images retain caption and credit, restrict roles and formats, and appear in the enrolled student feed',{skip:process.env.RUN_DB_TESTS!=='true'},async()=>{
 assert(['127.0.0.1','localhost'].includes(new URL(process.env.DATABASE_URL).hostname));assert(!process.env.AWS_S3_BUCKET,'Use local test storage');await ensureQuestionBankSchema();
 const cwd=process.cwd(),dir=await mkdtemp('/tmp/medpro-drug-media-');await mkdir(dir+'/uploads');process.chdir(dir);
 const users=[];let job,server;
 try{
  for(const role of ['super_admin','teacher','student'])users.push(await User.create({fullName:'Drug image test',email:randomUUID()+'@example.test',password:'TestOnly123!',role,program:'EMT'}));
  job=(await pool.query("INSERT INTO ai_generation_jobs(admin_id,content_type,title) VALUES($1,'drug_reference','Test reference') RETURNING id",[users[0].user_id])).rows[0].id;
  const content=(await pool.query("INSERT INTO ai_published_content(job_id,source_item_id,content_type,title,program,destination_key,content_json,created_by) VALUES($1,'drug','drug_reference','Medication reference','EMT','drug_reference','{}',$2) RETURNING id",[job,users[0].user_id])).rows[0].id;
  const app=express();app.use('/media',authenticate,mediaRouter);app.use('/published',publishedRouter);app.use((error,_req,res,_next)=>res.status(error.status||500).json({error:error.publicMessage||error.message}));server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
  const tokens=users.map(user=>signToken({sub:user.user_id,role:user.role,program:'EMT'}));
  const upload=async(actor,type='image/png',name='drug.png')=>{const form=new FormData();form.append('file',new Blob([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=','base64')],{type}),name);form.append('imageCaption','Reviewed example formulation');form.append('imageCredit','Test image credit');return fetch(`http://127.0.0.1:${server.address().port}/media/${content}/media`,{method:'POST',headers:{Authorization:'Bearer '+tokens[actor]},body:form});};
  assert.equal((await upload(2)).status,403);assert.equal((await upload(1)).status,404);
  const accepted=await upload(0);assert.equal(accepted.status,200);const result=await accepted.json();assert.equal(result.media.media_caption,'Reviewed example formulation');assert.equal(result.media.media_credit,'Test image credit');assert.equal(result.media.media_type,'image/png');
  assert.equal((await upload(0,'audio/mpeg','drug.mp3')).status,400,'Drug references accept images only');
  const feed=await (await fetch(`http://127.0.0.1:${server.address().port}/published?destination=drug_reference`,{headers:{Authorization:'Bearer '+tokens[2]}})).json();const item=feed.content.find(item=>item.id===content);assert.equal(item.content_json.media_url,result.media.media_url);assert.equal(item.content_json.media_caption,'Reviewed example formulation');
 }finally{
  if(server)await new Promise(resolve=>server.close(resolve));if(job){await pool.query('DELETE FROM content_audit_log WHERE job_id=$1',[job]);await pool.query('DELETE FROM ai_published_content WHERE job_id=$1',[job]);await pool.query('DELETE FROM ai_generation_jobs WHERE id=$1',[job]);}await pool.query('DELETE FROM users WHERE user_id=ANY($1::uuid[])',[users.map(user=>user.user_id)]);process.chdir(cwd);await rm(dir,{recursive:true,force:true});
 }
});
test.after(()=>pool.end());
