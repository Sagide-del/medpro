import 'dotenv/config';
import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { authenticate } from '../src/middleware/auth.js';
import { signToken } from '../src/config/auth.js';

test('student enrollment scopes query/body and rejects cross-track requests while administrators retain selection',async()=>{
 const app=express();app.use(express.json());app.use(authenticate);app.all('/content',(req,res)=>res.json({program:req.user.program,query:req.query.program,body:req.body?.program}));
 const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
 const url=`http://127.0.0.1:${server.address().port}/content`;
 const request=async(program,requested,{role='student',body}={})=>{const response=await fetch(url+(requested?'?program='+encodeURIComponent(requested):''),{method:body?'POST':'GET',headers:{Authorization:'Bearer '+signToken({sub:'student',role,program}),'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});return {status:response.status,data:await response.json()};};
 try{
  for(const track of ['EMT','Paramedic','Nursing']){
   const result=await request(track);assert.equal(result.status,200);assert.equal(result.data.query,track);
   const own=await request(track,track,{body:{program:track}});assert.equal(own.data.body,track);
   for(const other of ['EMT','Paramedic','Nursing'].filter(value=>value!==track)){
    assert.equal((await request(track,other)).status,403);
    assert.equal((await request(track,null,{body:{program:other}})).status,403);
   }
  }
  assert.equal((await request('emt-paramedic','Paramedic')).status,200);
  assert.equal((await request('EMT','Nursing',{role:'super_admin'})).status,200);
 }finally{await new Promise(resolve=>server.close(resolve));}
});
