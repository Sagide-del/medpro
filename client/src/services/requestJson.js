// Bound both connection time and response-body reads; never replay writes automatically.
export async function requestJson(url,options={}, {timeoutMs=15000,signal}={}){
 const controller=new AbortController();let timedOut=false;
 const abort=()=>controller.abort();
 if(signal?.aborted)abort();else signal?.addEventListener('abort',abort,{once:true});
 const timer=setTimeout(()=>{timedOut=true;controller.abort();},timeoutMs);
 try{
  const res=await fetch(url,{...options,signal:controller.signal});
  const data=await res.json().catch(error=>{if(controller.signal.aborted)throw error;return {};});
  if(timedOut)throw new Error('timeout');
  return {res,data};
 }catch(error){
  if(timedOut){const timeout=new Error(options.method&&options.method!=='GET'?'The request timed out. Check whether it completed before trying again.':'The server is taking too long to respond. Please try again.');timeout.code='REQUEST_TIMEOUT';throw timeout;}
  if(error instanceof TypeError){const network=new Error('Unable to reach the server. Check your connection and try again.');network.code='NETWORK_ERROR';throw network;}
  throw error;
 }finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}
}
