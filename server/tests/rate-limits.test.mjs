import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import {createRateLimits} from '../src/middleware/rateLimits.js';
import {signToken} from '../src/config/auth.js';
test('verified accounts have independent quotas on a shared IP; forged tokens cannot reset anonymous limits',async()=>{
 const {apiLimiter}=createRateLimits({accountLimit:2,anonymousLimit:2});const app=express();app.use(apiLimiter);app.get('/',(_req,res)=>res.json({ok:true}));
 const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
 const request=token=>fetch(`http://127.0.0.1:${server.address().port}/`,{headers:token?{Authorization:'Bearer '+token}:{}});
 try{
  const admin=signToken({sub:'admin',role:'super_admin'}),student=signToken({sub:'emt-student',role:'student',program:'EMT'});
  assert.equal((await request(admin)).status,200);assert.equal((await request(admin)).status,200);const limited=await request(admin);assert.equal(limited.status,429);assert.equal((await limited.json()).code,'RATE_LIMITED');assert(Number(limited.headers.get('Retry-After'))>0);
  assert.equal((await request(student)).status,200,'An admin hitting their limit must not block EMT access on the same IP');
  assert.equal((await request()).status,200);assert.equal((await request('forged-one')).status,200);assert.equal((await request('forged-two')).status,429);
  assert.equal((await request(student)).status,200,'Anonymous activity must not consume the student quota');
 }finally{await new Promise(resolve=>server.close(resolve));}
});
test('successful logins do not consume failed-login quota; registration and payment counters stay separate',async()=>{
 const {loginLimiter,registrationLimiter,paymentLimiter}=createRateLimits({loginLimit:2,paymentLimit:2});const app=express();app.use('/login',loginLimiter);app.use('/register',registrationLimiter);app.use('/pay',paymentLimiter);app.get('/login',(req,res)=>res.status(req.query.fail?401:200).json({ok:true}));app.get('/register',(_req,res)=>res.json({ok:true}));app.get('/pay',(_req,res)=>res.json({ok:true}));
 const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));const call=path=>fetch(`http://127.0.0.1:${server.address().port}${path}`);
 try{
  for(let i=0;i<4;i++)assert.equal((await call('/login')).status,200);
  assert.equal((await call('/login?fail=1')).status,401);assert.equal((await call('/login?fail=1')).status,401);assert.equal((await call('/login?fail=1')).status,429);
  assert.equal((await call('/pay')).status,200);assert.equal((await call('/register')).status,200);
 }finally{await new Promise(resolve=>server.close(resolve));}
});
