import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import express from 'express';
import {pool} from '../src/config/database.js';
import {User} from '../src/models/User.js';
import {signToken} from '../src/config/auth.js';
import {ensureQuestionBankSchema} from '../src/services/questionBankSchema.js';
import {processNextPodcast} from '../src/services/podcastStudio.js';
import {spokenScript,validatePodcast} from '../src/services/podcastSpeech.js';
import router from '../src/routes/podcasts.js';
test('script import removes stage directions without rewriting clinical numbers or qualifications',()=>{
 assert.equal(spokenScript('**[COLD OPEN]**\n**A patient narrative.**\n\n**[SECTION 1: Assessment]**\nDo not omit reassessment; 0.5 mg remains a quotation.'),'A patient narrative.\n\nDo not omit reassessment; 0.5 mg remains a quotation.');
 assert.throws(()=>validatePodcast({title:'Test',topic:'Test',program:'EMT',script:'Short'}));
 assert.throws(()=>validatePodcast({title:'Test',topic:'Test',program:'EMT',script:'An educational script with enough characters to save as a draft.',voice:'unknown'}));
});
test('podcast studio persists drafts, converts in background, protects preview audio and publishes to the correct track',{skip:process.env.RUN_DB_TESTS!=='true'},async()=>{
 assert(['localhost','127.0.0.1'].includes(new URL(process.env.DATABASE_URL).hostname));await ensureQuestionBankSchema();
 let server;const users=[],created=[];
 try{
  for(const [role,program] of [['super_admin','EMT'],['student','EMT'],['student','Nursing']])users.push(await User.create({fullName:'Podcast fixture',email:randomUUID()+'@example.test',password:'TestOnly123!',role,program}));
  const app=express();app.use(express.json());app.use('/api/podcasts',router);app.use((err,req,res,next)=>res.status(err.status||500).json({error:err.publicMessage||err.message}));server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  async function call(path='',index=0,method='GET',body){const response=await fetch(base+'/api/podcasts'+path,{method,headers:{Authorization:`Bearer ${signToken({sub:users[index].user_id,role:users[index].role,program:users[index].program})}`,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});return {status:response.status,data:await response.json()};}
  assert.equal((await call('/studio/episodes',1)).status,403);
  const starter=(await call('',1)).data.content;assert.equal(starter.filter(item=>String(item.id).startsWith('emt-podcast-')).length,8);assert(starter.every(item=>item.program==='EMT'));assert.equal((await call('',2)).data.content.length,0);
  const body={title:'Fixture episode',topic:'Assessment',program:'EMT',script:'A calm educational assessment script supplied by the administrator. Clinical numbers remain unchanged: 100 to 120.',voice:'en-KE-AsiliaNeural',clientToken:randomUUID()};
  const saved=await call('/studio/episodes',0,'POST',body);assert.equal(saved.status,201,JSON.stringify(saved.data));const id=saved.data.episode.id;created.push(id);assert.equal((await call('/studio/episodes',0,'POST',body)).data.episode.id,id,'Saving retry is idempotent');
  assert.equal((await call('/studio/episodes',1,'POST',body)).status,403);
  assert.equal((await call(`/studio/episodes/${id}/convert`,0,'POST',{revision:1})).status,202);
  assert.equal((await call(`/studio/episodes/${id}/convert`,0,'POST',{revision:1})).status,409);
  const audio=await readFile(new URL('../../client/public/podcasts/emt/episode-01.mp3',import.meta.url));
  await processNextPodcast(async(script,voice)=>{assert.equal(script,body.script);assert.equal(voice,body.voice);assert.equal((await call(`/studio/episodes/${id}`,0,'PATCH',{...body,revision:1})).status,409);return {audio,duration:101.2};});
  let episode=(await call('/studio/episodes')).data.episodes.find(item=>item.id===id);assert.equal(episode.status,'ready');assert(episode.audio_url);assert(!(await call('',1)).data.content.some(item=>item.id===id));
  assert.equal((await fetch(base+`/api/podcasts/${id}/audio`)).status,403);
  assert.equal((await fetch(base+episode.audio_url.replace(/signature=[a-f0-9]+/,'signature='+'0'.repeat(64)))).status,403);
  let stream=await fetch(base+episode.audio_url,{headers:{Range:'bytes=0-15'}});assert.equal(stream.status,206);assert.equal(stream.headers.get('content-type'),'audio/mpeg');assert.deepEqual(Buffer.from(await stream.arrayBuffer()),audio.subarray(0,16));
  assert.equal((await fetch(base+episode.audio_url,{headers:{Range:'bytes=999999999-'}})).status,416);
  assert.equal((await call(`/studio/episodes/${id}/publish`,0,'POST',{revision:1})).status,400);
  assert.equal((await call(`/studio/episodes/${id}/publish`,0,'POST',{revision:1,reviewed:true})).status,200);
  const published=(await call('',1)).data.content.find(item=>item.id===id);assert(published);assert(!(await call('',2)).data.content.some(item=>item.id===id));
  stream=await fetch(base+published.content_json.media_url,{headers:{Range:'bytes=-8'}});assert.equal(stream.status,206);assert.deepEqual(Buffer.from(await stream.arrayBuffer()),audio.subarray(-8));
  assert.equal((await call(`/studio/episodes/${id}/unpublish`,0,'POST',{revision:1})).status,200);assert.equal((await fetch(base+published.content_json.media_url)).status,404,'Withdrawing invalidates student playback links');
  const edited=await call(`/studio/episodes/${id}`,0,'PATCH',{...body,script:body.script+' A new ending.',revision:1});assert.equal(edited.status,200);assert.equal(edited.data.episode.status,'draft');assert.equal(edited.data.episode.audio_url,null);
  assert.equal((await call(`/studio/episodes/${id}/publish`,0,'POST',{revision:2,reviewed:true})).status,409,'Cannot publish stale audio for an edited script');
  assert.equal((await call(`/studio/episodes/${id}`,0,'PATCH',{...body,revision:1})).status,409,'An old editor cannot overwrite a newer script');
  await call(`/studio/episodes/${id}/convert`,0,'POST',{revision:2});await processNextPodcast(async()=>{throw new Error('Provider failure');});episode=(await call('/studio/episodes')).data.episodes.find(item=>item.id===id);assert.equal(episode.status,'failed');assert(episode.last_error);
 }finally{if(server)await new Promise(resolve=>server.close(resolve));for(const id of created)await pool.query('DELETE FROM podcast_episodes WHERE id=$1',[id]);for(const user of users)await pool.query('DELETE FROM users WHERE user_id=$1',[user.user_id]);await pool.end();}
});
