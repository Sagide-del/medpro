import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { ragConfiguration } from '../src/services/ragConfiguration.js';
import ragRouter from '../src/routes/ragSources.js';

test('indexing flag accepts whitespace/case while respecting explicit disable and reports missing API settings without secrets',()=>{
  for(const flag of ['true',' true ','TRUE'])assert.equal(ragConfiguration({RAG_ENABLED:flag,RAG_SERVICE_URL:'http://private-service:8010',RAG_SERVICE_KEY:'x'.repeat(32)}).ready,true);
  for(const flag of ['',undefined,'false','true-'])assert.equal(ragConfiguration({RAG_ENABLED:flag}).enabled,false);
  const config=ragConfiguration({RAG_ENABLED:'false',RAG_SERVICE_URL:'file:///tmp/key',RAG_SERVICE_KEY:'short'});
  assert.deepEqual(config.issues.map(issue=>issue.code),['disabled','service_url','service_key']);
  assert(!JSON.stringify(config).includes('file:///tmp/key'));
});
test('authorized connection diagnostic distinguishes disabled, healthy, outdated, mismatched key and unavailable service',async()=>{
  const saved=Object.fromEntries(['RAG_ENABLED','RAG_SERVICE_URL','RAG_SERVICE_KEY'].map(key=>[key,process.env[key]]));
  let healthStatus=200,version=1,role='super_admin';
  const service=express();service.get('/health',(req,res)=>{assert.equal(req.headers.authorization,'Bearer '+'x'.repeat(32));res.status(healthStatus).json({ok:healthStatus===200,book_coverage_version:version});});
  const remote=service.listen(0,'127.0.0.1');await new Promise(resolve=>remote.once('listening',resolve));
  const app=express();app.use((req,_res,next)=>{req.user={role};next();});app.use('/rag',ragRouter);
  const api=app.listen(0,'127.0.0.1');await new Promise(resolve=>api.once('listening',resolve));
  const read=async(path='/connection-check')=>{const response=await fetch(`http://127.0.0.1:${api.address().port}/rag${path}`);return {status:response.status,data:await response.json()};};
  try{
    process.env.RAG_ENABLED='false';process.env.RAG_SERVICE_URL=`http://127.0.0.1:${remote.address().port}`;process.env.RAG_SERVICE_KEY='x'.repeat(32);
    assert.equal((await read()).data.issues[0].code,'disabled');
    assert.equal((await read('/config')).data.ready,false);
    process.env.RAG_ENABLED=' TRUE ';
    assert.equal((await read()).data.ok,true);
    assert(!JSON.stringify((await read('/config')).data).includes('x'.repeat(32)));
    version=0;assert.equal((await read()).data.code,'outdated_service');version=1;
    healthStatus=401;assert.equal((await read()).data.code,'authentication_failed');
    healthStatus=500;assert.equal((await read()).data.code,'service_unhealthy');
    role='teacher';assert.equal((await read()).status,403);role='super_admin';
    await new Promise(resolve=>remote.close(resolve));assert.equal((await read()).data.code,'unreachable');
  }finally{
    for(const [key,value]of Object.entries(saved)){if(value===undefined)delete process.env[key];else process.env[key]=value;}
    if(remote.listening)await new Promise(resolve=>remote.close(resolve));
    await new Promise(resolve=>api.close(resolve));
  }
});
