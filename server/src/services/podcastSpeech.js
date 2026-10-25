import {execFile} from 'node:child_process';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {parseBuffer} from 'music-metadata';
import {createHash} from 'node:crypto';
import {Worker} from 'node:worker_threads';
export const PODCAST_VOICES=[{id:'en-KE-AsiliaNeural',label:'Asilia · Kenyan English',gender:'Female'},{id:'en-NG-EzinneNeural',label:'Ezinne · Nigerian English',gender:'Female'},{id:'en-ZA-LeahNeural',label:'Leah · South African English',gender:'Female'}];
export const scriptHash=(script,voice)=>createHash('sha256').update(`${voice}\n-8%\n-2Hz\n${script}`).digest('hex');
export function spokenScript(value){
 // Production directions and Markdown are not spoken; clinical wording stays intact.
 return String(value||'').replace(/\r\n?/g,'\n').split('\n').filter(line=>!/^\s*\*{0,2}\[(?:COLD OPEN|INTRO|OUTRO|SECTION[^\]]*|PAUSE|MUSIC[^\]]*)\]\*{0,2}\s*$/i.test(line)).map(line=>line.replace(/^#{1,6}\s+/,'').replace(/\*\*/g,'').replace(/^\*|\*$/g,'')).join('\n').trim();
}
export function validatePodcast(input){
 const title=String(input.title||'').trim(),topic=String(input.topic||'').trim(),script=spokenScript(input.script),voice=input.voice||PODCAST_VOICES[0].id,program=input.program||'EMT';
 if(!title||title.length>200||!topic||topic.length>160||script.length<40||script.length>25000||!PODCAST_VOICES.some(item=>item.id===voice)||!['EMT','Paramedic','Nursing'].includes(program))throw Object.assign(new Error('Enter a title, topic and script (40–25,000 characters), and select a valid track and voice.'),{status:400,publicMessage:'Enter a title, topic and script (40–25,000 characters), and select a valid track and voice.'});
 return {title,topic,script,voice,program};
}
export function speechProvider(){return process.env.PODCAST_TTS_PROVIDER||(process.env.AZURE_SPEECH_KEY?'azure':'edge');}
export async function synthesizePodcast(script,voice){
 if(speechProvider()==='edge'){
  const binary=process.env.PODCAST_PYTHON_BIN||(existsSync('/opt/podcast-tts/bin/python')?'/opt/podcast-tts/bin/python':'python3');
  const audio=await new Promise((resolve,reject)=>{
   const child=execFile(binary,[fileURLToPath(new URL('./podcastEdge.py',import.meta.url))],{encoding:'buffer',timeout:145000,maxBuffer:12*1024*1024},(error,stdout)=>error?reject(new Error(error.killed?'Audio generation timed out. Retry this episode.':'The speech service is unavailable. Check its deployment and retry.')):resolve(stdout));
   child.stdin?.on('error',()=>{});child.stdin?.end(JSON.stringify({script,voice}));
  });
  if(audio.length<1000||audio.length>12*1024*1024)throw new Error('Invalid audio file');
  const metadata=await parseBuffer(audio,{mimeType:'audio/mpeg'},{duration:true});
  if(!metadata.format.duration||metadata.format.duration<1)throw new Error('Invalid audio duration');
  return {audio,duration:metadata.format.duration};
 }
 return new Promise((resolve,reject)=>{
  const worker=new Worker(new URL('./podcastSpeechWorker.js',import.meta.url),{execArgv:process.execArgv.filter(arg=>!arg.startsWith('--input-type')),workerData:{script,voice,provider:speechProvider()}});
  let settled=false;
  const finish=(err,value)=>{if(settled)return;settled=true;clearTimeout(timer);void worker.terminate();err?reject(err):resolve(value);};
  const timer=setTimeout(()=>finish(new Error('Audio generation timed out. Retry this episode.')),150000);
  worker.once('message',result=>result.error?finish(new Error(result.error)):finish(null,{audio:Buffer.from(result.audio),duration:result.duration}));
  worker.once('error',()=>finish(new Error('The voice service could not complete this episode. Retry generation.')));
  worker.once('exit',()=>{if(!settled)finish(new Error('Audio conversion stopped. Retry this episode.'));});
 });
}
