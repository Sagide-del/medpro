import {Router} from 'express';
import {query,withTransaction} from '../config/database.js';
import {authenticate} from '../middleware/auth.js';
import {requireRole} from '../middleware/roleCheck.js';
import {asyncHandler} from '../utils/helpers.js';
import {audioUrl,validAudioSignature} from '../services/podcastStudio.js';
import {PODCAST_VOICES,scriptHash,validatePodcast,speechProvider} from '../services/podcastSpeech.js';
const router=Router(),uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const fields='id,seed_key,title,topic,program,script,voice,status,revision,duration_seconds,media_url,audio_hash,last_error,updated_at,published_at,(audio_bytes IS NOT NULL) AS has_audio';
const view=row=>({...row,audio_url:audioUrl(row,true)});
router.get('/:id/audio',asyncHandler(async(req,res)=>{
 if(!uuid.test(req.params.id)||!validAudioSignature(req.params.id,req.query))return res.status(403).json({error:'This audio link expired. Refresh the library.'});
 const {rows}=await query('SELECT audio_bytes,status,revision FROM podcast_episodes WHERE id=$1 AND revision=$2',[req.params.id,req.query.revision]);const row=rows[0];
 if(!row?.audio_bytes||(req.query.mode==='published'?row.status!=='published':!['ready','published'].includes(row.status)))return res.status(404).json({error:'Audio is not available.'});
 const data=row.audio_bytes;res.set({'Content-Type':'audio/mpeg','Accept-Ranges':'bytes','Cache-Control':'private, max-age=300'});
 if(req.headers.range){const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);let start,end;if(match&&(match[1]||match[2])){start=match[1]?Number(match[1]):Math.max(0,data.length-Number(match[2]));end=match[1]&&match[2]?Math.min(Number(match[2]),data.length-1):data.length-1;}
  if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>end||start>=data.length){res.set('Content-Range',`bytes */${data.length}`);return res.sendStatus(416);}res.status(206).set({'Content-Range':`bytes ${start}-${end}/${data.length}`,'Content-Length':end-start+1});return res.end(data.subarray(start,end+1));}
 res.set('Content-Length',data.length);res.end(data);
}));
router.use(authenticate);
router.get('/',asyncHandler(async(req,res)=>{
 const program=req.user.role==='student'?req.user.program:req.query.program||'EMT';
 if(!['EMT','Paramedic','Nursing'].includes(program))return res.status(400).json({error:'Select a valid track.'});
 const {rows}=await query(`SELECT ${fields} FROM podcast_episodes WHERE status='published' AND program=$1 ORDER BY published_at DESC,seed_key,id`,[program]);
 res.json({content:rows.map(row=>({id:row.seed_key||row.id,title:row.title,topic:row.topic,program:row.program,source_citation:row.seed_key?'User-supplied EMT podcast script collection':null,content_json:{transcript:row.script,media_url:audioUrl(row),media_type:'audio/mpeg',duration_seconds:Number(row.duration_seconds),voice:row.voice}}))});
}));
router.use('/studio',requireRole('super_admin'));
router.get('/studio/episodes',asyncHandler(async(req,res)=>{const {rows}=await query(`SELECT ${fields} FROM podcast_episodes ORDER BY created_at DESC,id`);res.json({episodes:rows.map(view),voices:PODCAST_VOICES,provider:speechProvider()});}));
router.post('/studio/episodes',asyncHandler(async(req,res)=>{
 const item=validatePodcast(req.body);if(!uuid.test(req.body.clientToken||''))return res.status(400).json({error:'A valid draft request identifier is required.'});
 const {rows}=await query(`INSERT INTO podcast_episodes(title,topic,program,script,voice,created_by,client_token) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(client_token) DO NOTHING RETURNING ${fields}`,[item.title,item.topic,item.program,item.script,item.voice,req.user.sub,req.body.clientToken]);
 const row=rows[0]||(await query(`SELECT ${fields} FROM podcast_episodes WHERE client_token=$1 AND created_by=$2`,[req.body.clientToken,req.user.sub])).rows[0];
 if(!row)return res.status(409).json({error:'Draft request identifier already used.'});res.status(rows.length?201:200).json({episode:view(row)});
}));
router.patch('/studio/episodes/:id',asyncHandler(async(req,res)=>{
 if(!uuid.test(req.params.id))return res.status(400).json({error:'Invalid episode identifier.'});const item=validatePodcast(req.body);
 const {rows}=await query(`UPDATE podcast_episodes SET title=$3,topic=$4,program=$5,script=$6,voice=$7,revision=revision+1,status='draft',audio_bytes=NULL,media_url=NULL,audio_hash=NULL,duration_seconds=NULL,published_at=NULL,last_error=NULL,updated_at=now() WHERE id=$1 AND revision=$2 AND status NOT IN ('queued','generating') RETURNING ${fields}`,[req.params.id,req.body.revision,item.title,item.topic,item.program,item.script,item.voice]);
 if(!rows[0])return res.status(409).json({error:'This episode changed or is being converted. Refresh before editing.'});res.json({episode:view(rows[0])});
}));
router.post('/studio/episodes/:id/convert',asyncHandler(async(req,res)=>{
 if(!uuid.test(req.params.id))return res.status(400).json({error:'Invalid episode identifier.'});
 const {rows}=await query(`UPDATE podcast_episodes SET status='queued',last_error=NULL,updated_at=now() WHERE id=$1 AND revision=$2 AND status IN ('draft','failed') RETURNING ${fields}`,[req.params.id,req.body.revision]);
 if(!rows[0])return res.status(409).json({error:'Refresh the episode. Only saved drafts or failed conversions can be queued.'});res.status(202).json({episode:view(rows[0])});
}));
router.post('/studio/episodes/:id/publish',asyncHandler(async(req,res)=>{
 if(!uuid.test(req.params.id))return res.status(400).json({error:'Invalid episode identifier.'});
 if(req.body.reviewed!==true)return res.status(400).json({error:'Review the script and recording before publishing.'});
 const row=await withTransaction(async db=>{const {rows}=await db.query(`SELECT ${fields} FROM podcast_episodes WHERE id=$1 FOR UPDATE`,[req.params.id]);const item=rows[0];if(!item||item.revision!==req.body.revision||item.status!=='ready'||(!item.has_audio&&!item.media_url)||item.audio_hash!==scriptHash(item.script,item.voice))return null;
  return (await db.query(`UPDATE podcast_episodes SET status='published',published_at=now(),updated_at=now() WHERE id=$1 RETURNING ${fields}`,[item.id])).rows[0];});
 if(!row)return res.status(409).json({error:'The latest script needs a completed recording before publication.'});res.json({episode:view(row)});
}));
router.post('/studio/episodes/:id/unpublish',asyncHandler(async(req,res)=>{
 if(!uuid.test(req.params.id))return res.status(400).json({error:'Invalid episode identifier.'});const {rows}=await query(`UPDATE podcast_episodes SET status='ready',updated_at=now() WHERE id=$1 AND revision=$2 AND status='published' RETURNING ${fields}`,[req.params.id,req.body.revision]);if(!rows[0])return res.status(409).json({error:'Refresh the episode before changing publication.'});res.json({episode:view(rows[0])});
}));
export default router;
