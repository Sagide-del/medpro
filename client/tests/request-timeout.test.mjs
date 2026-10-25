import test from 'node:test';
import assert from 'node:assert/strict';
import {requestJson} from '../src/services/requestJson.js';
test('requests time out without repeating or changing session state, including stalled response bodies',async()=>{
 const original=globalThis.fetch;let calls=0;
 try{
  globalThis.fetch=async(url,{signal})=>{calls++;return new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError'))));};
  await assert.rejects(requestJson('/access',{}, {timeoutMs:10}),error=>error.code==='REQUEST_TIMEOUT');assert.equal(calls,1);
  await assert.rejects(requestJson('/payment',{method:'POST'}, {timeoutMs:10}),/Check whether it completed/);assert.equal(calls,2,'Never retry a payment automatically');
  globalThis.fetch=async(url,{signal})=>({json:()=>new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError'))))});
  await assert.rejects(requestJson('/access',{}, {timeoutMs:10}),error=>error.code==='REQUEST_TIMEOUT');
 }finally{globalThis.fetch=original;}
});
test('external cancellation, HTTP errors and normal JSON responses remain distinguishable',async()=>{
 const original=globalThis.fetch;
 try{
  globalThis.fetch=async()=>({ok:false,status:401,json:async()=>({error:'Session expired'})});
  assert.equal((await requestJson('/access')).res.status,401);
  const controller=new AbortController();controller.abort();globalThis.fetch=async(url,{signal})=>{if(signal.aborted)throw new DOMException('Aborted','AbortError');};
  await assert.rejects(requestJson('/access',{}, {signal:controller.signal}),error=>error.name==='AbortError');
  globalThis.fetch=async()=>{throw new TypeError('Failed to fetch');};await assert.rejects(requestJson('/access'),error=>error.code==='NETWORK_ERROR');
 }finally{globalThis.fetch=original;}
});
