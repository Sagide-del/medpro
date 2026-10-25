import {readFile} from 'node:fs/promises';
import {createHmac,timingSafeEqual} from 'node:crypto';
import {query,withTransaction} from '../config/database.js';
import {scriptHash,synthesizePodcast} from './podcastSpeech.js';
export async function seedPodcasts(db){
 const episodes=JSON.parse(await readFile(new URL('../data/emtPodcasts.json',import.meta.url),'utf8'));
 for(const item of episodes)await db.query(`INSERT INTO podcast_episodes(seed_key,title,topic,program,script,voice,status,media_url,duration_seconds,audio_hash,published_at) VALUES($1,$2,$3,'EMT',$4,$5,'published',$6,$7,$8,now()) ON CONFLICT(seed_key) DO NOTHING`,[item.id,item.title,item.topic,item.transcript,item.voice,item.media_url,item.duration_seconds,scriptHash(item.transcript,item.voice)]);
}
const sign=(id,revision,expires,mode)=>createHmac('sha256',process.env.JWT_SECRET).update(`podcast-media-v1|${id}|${revision}|${expires}|${mode}`).digest('hex');
export function audioUrl(row,preview=false){
 if(row.media_url)return row.media_url;
 if(!row.has_audio)return null;
 const expires=Math.floor(Date.now()/1000)+3600,mode=preview?'preview':'published';
 return `/api/podcasts/${row.id}/audio?revision=${row.revision}&expires=${expires}&mode=${mode}&signature=${sign(row.id,row.revision,expires,mode)}`;
}
export function validAudioSignature(id,params){
 const {revision,expires,mode,signature}=params;
 if(!/^\d+$/.test(String(revision))||!/^\d+$/.test(String(expires))||Number(expires)<Date.now()/1000||Number(expires)>Date.now()/1000+3610||!['preview','published'].includes(mode)||!/^[a-f0-9]{64}$/.test(signature||''))return false;
 return timingSafeEqual(Buffer.from(signature,'hex'),Buffer.from(sign(id,revision,expires,mode),'hex'));
}
export async function processNextPodcast(generate=synthesizePodcast){
 const episode=await withTransaction(async db=>{
  // Recover an interrupted deployment; generated recordings are committed atomically.
  await db.query("UPDATE podcast_episodes SET status='failed',last_error='Conversion was interrupted. Retry this episode.',updated_at=now() WHERE status='generating' AND started_at<now()-interval '5 minutes'");
  const {rows}=await db.query("SELECT id,script,voice,revision FROM podcast_episodes WHERE status='queued' ORDER BY updated_at FOR UPDATE SKIP LOCKED LIMIT 1");
  if(!rows[0])return null;
  await db.query("UPDATE podcast_episodes SET status='generating',started_at=now(),updated_at=now(),last_error=NULL WHERE id=$1",[rows[0].id]);return rows[0];
 });
 if(!episode)return false;
 try{
  const result=await generate(episode.script,episode.voice);
  if(!Buffer.isBuffer(result.audio)||result.audio.length<1000||result.audio.length>12*1024*1024||!Number.isFinite(result.duration)||result.duration<1)throw new Error('Invalid audio result');
  await query("UPDATE podcast_episodes SET audio_bytes=$3,media_url=NULL,duration_seconds=$4,audio_hash=$5,status='ready',updated_at=now(),last_error=NULL WHERE id=$1 AND revision=$2 AND status='generating'",[episode.id,episode.revision,result.audio,result.duration,scriptHash(episode.script,episode.voice)]);
 }catch(error){
  await query("UPDATE podcast_episodes SET status='failed',last_error=$3,updated_at=now() WHERE id=$1 AND revision=$2 AND status='generating'",[episode.id,episode.revision,/configuration|quota|12 MB|timed out/.test(error.message)?error.message:'Audio conversion failed. Retry this episode.',]);
 }
 return true;
}
let timer,running=false;
export function startPodcastWorker(){if(timer)return;const tick=async()=>{if(running)return;running=true;try{await processNextPodcast();}catch(error){console.error('Podcast queue unavailable:',error.name);}finally{running=false;}};timer=setInterval(tick,5000);timer.unref();void tick();}
export function stopPodcastWorker(){clearInterval(timer);timer=null;}
