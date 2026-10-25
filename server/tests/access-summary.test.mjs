import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {pool} from '../src/config/database.js';
import {User} from '../src/models/User.js';
import {resolveStudentAccessOnly,resolveStudentSubscriptionAccess} from '../src/services/subscriptionAccess.js';
test('lightweight access decision matches full subscription checks without including payment history',{skip:process.env.RUN_DB_TESTS!=='true'},async()=>{
 assert(['localhost','127.0.0.1'].includes(new URL(process.env.DATABASE_URL).hostname));let user,institution;const bypass=process.env.MEDPRO_SUBSCRIPTION_BYPASS;
 try{
  delete process.env.MEDPRO_SUBSCRIPTION_BYPASS;
  user=await User.create({fullName:'Access fixture',email:randomUUID()+'@example.test',password:'TestOnly123!',role:'student',program:'EMT'});const claims={sub:user.user_id};
  for(const status of ['none','active','expired','cancelled']){
   await pool.query('DELETE FROM student_subscriptions WHERE student_id=$1',[user.user_id]);
   if(status!=='none')await pool.query("INSERT INTO student_subscriptions(student_id,status,expires_at) VALUES($1,$2,now()+interval '30 days')",[user.user_id,status]);
   const fast=await resolveStudentAccessOnly(claims),full=await resolveStudentSubscriptionAccess(claims);assert.equal(fast.allowed,full.allowed,status);assert.deepEqual(Object.keys(fast),['allowed']);
  }
  await pool.query('DELETE FROM student_subscriptions WHERE student_id=$1',[user.user_id]);
  institution=(await pool.query("INSERT INTO institutions(name,short_code) VALUES('Access fixture',$1) RETURNING institution_id",[randomUUID().slice(0,16)])).rows[0].institution_id;
  claims.institutionId=institution;
  for(const status of ['trial','active','expiring','cancelled','expired']){
   await pool.query('DELETE FROM institution_subscriptions WHERE institution_id=$1',[institution]);
   await pool.query("INSERT INTO institution_subscriptions(institution_id,status,expires_at) VALUES($1,$2,now()+interval '30 days')",[institution,status]);
   assert.equal((await resolveStudentAccessOnly(claims)).allowed,(await resolveStudentSubscriptionAccess(claims)).allowed,'Institution '+status);
  }
  process.env.MEDPRO_SUBSCRIPTION_BYPASS='true';assert.equal((await resolveStudentAccessOnly(claims)).allowed,true);
 }finally{if(institution)await pool.query('DELETE FROM institutions WHERE institution_id=$1',[institution]);if(user)await pool.query('DELETE FROM users WHERE user_id=$1',[user.user_id]);if(bypass===undefined)delete process.env.MEDPRO_SUBSCRIPTION_BYPASS;else process.env.MEDPRO_SUBSCRIPTION_BYPASS=bypass;await pool.end();}
});
