import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import express from 'express';
import {pool} from '../src/config/database.js';
import {User} from '../src/models/User.js';
import {signToken} from '../src/config/auth.js';
import {ensureQuestionBankSchema} from '../src/services/questionBankSchema.js';
import {Notification} from '../src/models/Notification.js';
import {paymentEvent} from '../src/services/notificationEvents.js';
import router from '../src/routes/notifications.js';

test('payment actions reflect pending, failed, completed and refunded states',()=>{
 for(const [status,action] of [['pending',true],['failed',true],['completed',false],['refunded',false]])assert.equal(paymentEvent({transaction_id:'id',amount:500,status}).actionRequired,action);
 assert.equal(paymentEvent({transaction_id:'id',amount:500,status:'failed',resolved:true}).actionRequired,false);
});
test('inbox reconciles payments, saved reminders and exams without duplicates; reads preserve actions and ownership',{skip:process.env.RUN_DB_TESTS!=='true'},async()=>{
 assert(['localhost','127.0.0.1'].includes(new URL(process.env.DATABASE_URL).hostname));await ensureQuestionBankSchema();
 let server,moduleId;const users=[];
 try{
  for(let i=0;i<2;i++)users.push(await User.create({fullName:'Notification fixture',email:randomUUID()+'@example.test',password:'TestOnly123!',role:'student',program:'EMT'}));
  const uid=users[0].user_id;
  const payment=(await pool.query("INSERT INTO revenue_transactions(student_id,transaction_type,amount,payment_method,status) VALUES($1,'student_subscription',500,'mpesa','pending') RETURNING *",[uid])).rows[0];
  const plan=(await pool.query("INSERT INTO study_plans(user_id,program,plan_date,exam_date,blocks) VALUES($1,'EMT',(now() AT TIME ZONE 'Africa/Nairobi')::date,(now() AT TIME ZONE 'Africa/Nairobi')::date+3,'[{\"id\":\"one\",\"completed\":false}]') RETURNING id",[uid])).rows[0];
  const app=express();app.use(express.json());app.use('/notifications',router);app.use((err,req,res,next)=>res.status(500).json({error:err.message}));server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
  async function call(path='',index=0,method='GET'){const response=await fetch(`http://127.0.0.1:${server.address().port}/notifications${path}`,{method,headers:{Authorization:`Bearer ${signToken({sub:users[index].user_id,role:'student',program:'EMT'})}`}});return {status:response.status,data:await response.json()};}
  let inbox=await call();assert.equal(inbox.status,200,JSON.stringify(inbox.data));assert.equal(inbox.data.counts.action_needed,3);const pending=inbox.data.notifications.find(n=>n.event_key===`payment:${payment.transaction_id}`);assert(pending.action_required);
  assert.equal((await call(`/${pending.notification_id}/read`,1,'PATCH')).status,404);
  await call(`/${pending.notification_id}/read`,0,'PATCH');inbox=await call();assert.equal(inbox.data.notifications.find(n=>n.notification_id===pending.notification_id).is_read,true,'Polling must not resurrect a read notification');assert.equal(inbox.data.notifications.length,3);
  await call('/read-all',0,'PATCH');inbox=await call('?filter=unread');assert.equal(inbox.data.notifications.length,0);assert.equal(inbox.data.counts.action_needed,3,'Reading does not settle a payment or complete study');
  assert.equal((await call('',1)).data.notifications.length,0);
  await pool.query("UPDATE revenue_transactions SET status='completed' WHERE transaction_id=$1",[payment.transaction_id]);
  inbox=await call();const confirmed=inbox.data.notifications.find(n=>n.notification_id===pending.notification_id);assert.equal(confirmed.title,'Payment confirmed');assert.equal(confirmed.action_required,false);assert.equal(confirmed.is_read,false);assert.equal(inbox.data.notifications.length,3);
  await pool.query("UPDATE study_plans SET blocks='[{\"completed\":true}]',exam_date=(now() AT TIME ZONE 'Africa/Nairobi')::date+20 WHERE id=$1",[plan.id]);inbox=await call('?filter=action');assert.equal(inbox.data.notifications.length,0,JSON.stringify(inbox.data));
  const subscription=(await pool.query("INSERT INTO student_subscriptions(student_id,expires_at) VALUES($1,now()+interval '3 days') RETURNING subscription_id",[uid])).rows[0];
  inbox=await call('?filter=action');assert.equal(inbox.data.notifications[0].title,'Subscription expiring soon');
  await pool.query("UPDATE student_subscriptions SET expires_at=now()+interval '30 days' WHERE subscription_id=$1",[subscription.subscription_id]);assert.equal((await call('?filter=action')).data.notifications.length,0,'Renewed access clears the expiry action');
  moduleId=(await pool.query("INSERT INTO mcq_modules(title,program,order_number) VALUES('Notification exam fixture','EMT',999999) RETURNING id")).rows[0].id;
  await pool.query("INSERT INTO student_mcq_attempts(student_id,module_id,percentage) VALUES($1,$2,80)",[uid,moduleId]);
  inbox=await call();assert(inbox.data.notifications.some(n=>n.title==='Revision module submitted'&&n.message.includes('80%')&&n.link==='/student/progress-analytics'));
  assert.equal((await call()).data.notifications.filter(n=>n.event_key?.startsWith('mcq:')).length,1,'Completed exam creates exactly one notification');
  const grade=await Notification.create({userId:uid,type:'grade',title:'Assessment graded',message:'80%',link:'/student/assessments',eventKey:'fixture:grade',actionLabel:'View result'});assert.equal((await call()).data.notifications.some(n=>n.notification_id===grade.notification_id),true);
 }finally{
  if(server)await new Promise(resolve=>server.close(resolve));
  if(moduleId)await pool.query('DELETE FROM mcq_modules WHERE id=$1',[moduleId]);
  for(const user of users){await pool.query('DELETE FROM revenue_transactions WHERE student_id=$1',[user.user_id]);await pool.query('DELETE FROM users WHERE user_id=$1',[user.user_id]);}
  await pool.end();
 }
});
