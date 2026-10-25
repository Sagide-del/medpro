import test from 'node:test';
import assert from 'node:assert/strict';
import { restoreSessionUser } from '../src/utils/sessionUser.js';
test('restoring a session removes the effect of a previously switched track',()=>{
 for(const program of ['EMT','Paramedic','Nursing']){
  const token='header.'+Buffer.from(JSON.stringify({role:'student',program})).toString('base64url')+'.signature';
  const restored=restoreSessionUser(JSON.stringify({role:'student',program:program==='EMT'?'Paramedic':'EMT'}),token);
  assert.equal(restored.program,program);
 }
 assert.equal(restoreSessionUser('invalid',''),null);
});

import {tokenExpired,sessionDestination} from '../src/utils/sessionLifecycle.js';
test('expired sessions are detected without treating an undecodable token as authenticated',()=>{
 const token=exp=>'header.'+Buffer.from(JSON.stringify({exp})).toString('base64url')+'.signature';
 assert.equal(tokenExpired(token(100),100000),true);
 assert.equal(tokenExpired(token(101),100000),false);
 assert.equal(tokenExpired('invalid'),false); // The server rejects invalid signatures with 401.
});
test('return destinations remain within the signed-in role and cannot redirect externally',()=>{
 assert.equal(sessionDestination('/student/mock-prep-tests?area=psychometric_readiness','student'),'/student/mock-prep-tests?area=psychometric_readiness');
 for(const path of ['https://example.com','//example.com/student/','/student/../../admin/dashboard','/superadmin/dashboard','/student/\\evil'])assert.equal(sessionDestination(path,'student'),null);
});

import {expireSession} from '../src/utils/sessionLifecycle.js';
test('late authentication failures cannot clear a newer sign-in',()=>{
 const originalWindow=globalThis.window,originalStorage=globalThis.sessionStorage;
 const values=new Map([['medpro_token','new-token'],['medpro_user','current-user']]);
 const events=[];
 globalThis.sessionStorage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};
 globalThis.window={location:{pathname:'/student/mock-prep-tests',search:'?area=psychometric_readiness',hash:''},dispatchEvent:event=>events.push(event.type)};
 try{
  assert.equal(expireSession('old-token'),false);assert.equal(values.get('medpro_token'),'new-token');assert.equal(events.length,0);
  assert.equal(expireSession('new-token'),true);assert.equal(values.has('medpro_token'),false);assert.equal(values.has('medpro_user'),false);
  assert.equal(values.get('medpro_return_to'),'/student/mock-prep-tests?area=psychometric_readiness');assert.deepEqual(events,['medpro:session-expired']);
 }finally{
  if(originalWindow===undefined)delete globalThis.window;else globalThis.window=originalWindow;
  if(originalStorage===undefined)delete globalThis.sessionStorage;else globalThis.sessionStorage=originalStorage;
 }
});
