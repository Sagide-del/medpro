import {parentPort,workerData} from 'node:worker_threads';
import {parseBuffer} from 'music-metadata';
const escape=value=>value.replace(/[<>&"']/g,char=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[char]));
try{
 const {script,voice,provider}=workerData;let audio;
 if(provider==='azure'){
  const region=process.env.AZURE_SPEECH_REGION;
  if(!process.env.AZURE_SPEECH_KEY||!region||!/^[a-z0-9]+$/.test(region))throw new Error('Azure Speech configuration is incomplete.');
  const response=await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`,{method:'POST',signal:AbortSignal.timeout(130000),headers:{'Ocp-Apim-Subscription-Key':process.env.AZURE_SPEECH_KEY,'Content-Type':'application/ssml+xml','X-Microsoft-OutputFormat':'audio-24khz-48kbitrate-mono-mp3'},body:`<speak version="1.0" xml:lang="${voice.slice(0,5)}"><voice name="${voice}"><prosody rate="-8%" pitch="-2Hz">${escape(script)}</prosody></voice></speak>`});
  if(!response.ok)throw new Error('The configured voice service rejected conversion. Check the Speech service configuration and quota.');
  if(Number(response.headers.get('content-length'))>12*1024*1024)throw new Error('Audio exceeds the 12 MB episode limit. Split this script.');
  audio=Buffer.from(await response.arrayBuffer());
 }else throw new Error('Select a supported speech provider.');
 if(audio.length<1000||audio.length>12*1024*1024)throw new Error('The voice service returned an invalid audio file.');
 const metadata=await parseBuffer(audio,{mimeType:'audio/mpeg'},{duration:true});
 if(!metadata.format.duration||metadata.format.duration<1)throw new Error('The generated audio could not be validated.');
 parentPort.postMessage({audio,duration:metadata.format.duration});
}catch(error){
 const known=/configuration|quota|12 MB|invalid audio|validated|supported speech/;
 parentPort.postMessage({error:known.test(error.message)?error.message:'The speech service is temporarily unavailable. Retry this episode.'});
}
