import {withTransaction} from '../config/database.js';
import {Notification} from '../models/Notification.js';
const date=value=>new Intl.DateTimeFormat('en-KE',{timeZone:'Africa/Nairobi',day:'numeric',month:'short',year:'numeric'}).format(new Date(value));
export function paymentEvent(row,role='student'){
 const link=role==='super_admin'?'/superadmin/revenue':role==='institution_admin'?'/admin/revenue':role==='teacher'?'/teacher/dashboard':'/student/payments';
 const amount=new Intl.NumberFormat('en-KE',{maximumFractionDigits:2}).format(Number(row.amount));
 const status={pending:['Payment pending',`KSh ${amount}: confirm the payment prompt or check its status.`,'Check payment',true],completed:['Payment confirmed',`Your payment of KSh ${amount} was successful.`,'View payments',false],failed:['Payment failed',row.resolved?'A later payment completed. View your payment history.':`Your payment of KSh ${amount} could not be completed. Check the payment details.`,'View payments',!row.resolved],refunded:['Payment refunded',`Your payment of KSh ${amount} was refunded.`,'View payments',false]}[row.status];
 if(!status)return null;
 return {userId:row.student_id,type:'payment',eventKey:`payment:${row.transaction_id}`,title:status[0],message:status[1],link,actionLabel:status[2],actionRequired:status[3],occurredAt:row.transaction_date || row.created_at};
}
// Reconcile actual persisted events when the authenticated inbox refreshes.
// No payment calls, emails, fabricated exam dates or repeated alerts on every poll.
export async function syncNotificationEvents(user){
 return withTransaction(async db=>{
  await db.query('SELECT pg_advisory_xact_lock(hashtext($1))',[`notification-sync:${user.sub}`]);
  const create=event=>Notification.create({userId:user.sub,...event},db);
  const {rows:payments}=await db.query(`SELECT t.*,EXISTS(SELECT 1 FROM revenue_transactions later WHERE later.student_id=t.student_id AND later.status='completed' AND later.transaction_type=t.transaction_type AND later.item_id IS NOT DISTINCT FROM t.item_id AND later.created_at>t.created_at) AS resolved
   FROM revenue_transactions t WHERE t.student_id=$1 AND (t.created_at>now()-interval '30 days' OR EXISTS(SELECT 1 FROM notifications n WHERE n.user_id=$1 AND n.event_key='payment:'||t.transaction_id::text AND n.action_required)) ORDER BY t.created_at DESC LIMIT 100`,[user.sub]);
  for(const row of payments){const event=paymentEvent(row,user.role);if(event)await create(event);}
  if(user.role==='student'){
   const {rows:attempts}=await db.query(`SELECT a.*,m.title FROM student_mcq_attempts a JOIN mcq_modules m ON m.id=a.module_id WHERE a.student_id=$1 AND m.program=$2 AND a.completed_at>now()-interval '30 days' ORDER BY a.completed_at DESC LIMIT 40`,[user.sub,user.program]);
   for(const row of attempts)await create({type:'grade',eventKey:`mcq:${row.id}`,title:'Revision module submitted',message:`You scored ${row.percentage}% in ${row.title}.`,link:'/student/progress-analytics',actionLabel:'View progress',occurredAt:row.completed_at});
   const {rows:assessments}=await db.query(`SELECT aa.*,a.title FROM assessment_attempts aa JOIN assessments a ON a.assessment_id=aa.assessment_id WHERE aa.student_id=$1 AND aa.status::text IN ('submitted','graded') AND aa.submitted_at>now()-interval '30 days' ORDER BY aa.submitted_at DESC LIMIT 40`,[user.sub]);
   for(const row of assessments)await create({type:'grade',eventKey:`assessment:${row.attempt_id}`,title:row.status==='graded'?'Assessment graded':'Assessment submitted',message:`${row.title}${row.score_pct!=null?` · ${row.score_pct}%`:': awaiting review.'}`,link:'/student/assessments',actionLabel:'Open assessments',occurredAt:row.graded_at || row.submitted_at});
   const {rows:practice}=await db.query(`SELECT r.id,r.submitted_at,r.grading_status,r.score,p.destination_key,p.title FROM published_content_responses r JOIN ai_published_content p ON p.id=r.content_id WHERE r.student_id=$1 AND r.program=$2 AND r.submitted_at>now()-interval '30 days' ORDER BY r.submitted_at DESC LIMIT 40`,[user.sub,user.program]);
   for(const row of practice)await create({type:'grade',eventKey:`practice:${row.id}`,title:row.grading_status==='graded'?'Practice result ready':'Practice submitted',message:`${row.title}${row.score!=null?` · ${row.grading_status==='provisional'?'Provisional rubric score: ':''}${row.score}%`:': saved for review.'}`,link:`/student/mock-prep-tests?area=${encodeURIComponent(row.destination_key)}`,actionLabel:'Continue practice',occurredAt:row.submitted_at});
   const {rows:cases}=await db.query(`SELECT a.id,a.case_id,a.submitted_at,a.completed,c.title FROM ke_case_attempts a JOIN ke_cases c ON c.id=a.case_id AND c.revision=a.revision WHERE a.student_id=$1 AND c.program=$2 AND a.submitted_at>now()-interval '30 days' ORDER BY a.submitted_at DESC LIMIT 30`,[user.sub,user.program]);
   for(const row of cases)await create({type:'grade',eventKey:`case:${row.id}`,title:row.completed?'Case completed':'Case submitted',message:row.title,link:'/student/learn/kenya-ems',actionLabel:'View case',occurredAt:row.submitted_at});
   const {rows:plans}=await db.query(`SELECT *,exam_date BETWEEN (now() AT TIME ZONE 'Africa/Nairobi')::date AND (now() AT TIME ZONE 'Africa/Nairobi')::date+7 AS exam_due FROM study_plans WHERE user_id=$1 AND program=$2 AND status='active' AND (plan_date=(now() AT TIME ZONE 'Africa/Nairobi')::date OR exam_date BETWEEN (now() AT TIME ZONE 'Africa/Nairobi')::date AND (now() AT TIME ZONE 'Africa/Nairobi')::date+7) ORDER BY plan_date DESC LIMIT 1`,[user.sub,user.program]);
   for(const row of plans){
    const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Nairobi',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
    const planDay=typeof row.plan_date==='string'?row.plan_date.slice(0,10):new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Nairobi'}).format(row.plan_date);
    const remaining=Array.isArray(row.blocks)?row.blocks.filter(block=>block && block.completed!==true).length:0;
    if(planDay===today && row.blocks?.length)await create({eventKey:`study:${row.id}`,title:remaining?'Study reminder':'Study plan completed',message:remaining?`${remaining} study block${remaining===1?'':'s'} remaining today.`:'All blocks in today’s plan are completed.',link:'/student/study-planner',actionLabel:'Open study plan',actionRequired:remaining>0});
    if(row.exam_due)await create({eventKey:`exam-reminder:${row.id}`,title:'Upcoming exam reminder',message:`Your saved exam date is ${date(row.exam_date)}. Review your study plan.`,link:'/student/study-planner',actionLabel:'Review plan',actionRequired:true});
   }
   await db.query(`UPDATE notifications n SET action_required=false WHERE n.user_id=$1 AND ((n.event_key LIKE 'study:%' AND NOT EXISTS(SELECT 1 FROM study_plans p WHERE n.event_key='study:'||p.id::text AND p.status='active' AND p.plan_date=(now() AT TIME ZONE 'Africa/Nairobi')::date)) OR (n.event_key LIKE 'exam-reminder:%' AND NOT EXISTS(SELECT 1 FROM study_plans p WHERE n.event_key='exam-reminder:'||p.id::text AND p.status='active' AND p.exam_date BETWEEN (now() AT TIME ZONE 'Africa/Nairobi')::date AND (now() AT TIME ZONE 'Africa/Nairobi')::date+7)))`,[user.sub]);
  }
  if(['student','institution_admin'].includes(user.role)){
   const {rows:licenses}=await db.query(`SELECT expires_at,status::text AS status FROM student_subscriptions WHERE student_id=$1 AND status::text IN ('active','trial','expiring','expired') UNION ALL SELECT s.expires_at,s.status::text FROM institution_subscriptions s JOIN users u ON u.institution_id=s.institution_id WHERE u.user_id=$1 AND s.status::text IN ('active','trial','expiring','expired') ORDER BY expires_at DESC LIMIT 1`,[user.sub]);
   const license=licenses[0],days=license?Math.ceil((new Date(license.expires_at).getTime()-Date.now())/86400000):null;
   const active=license && ['active','trial','expiring'].includes(license.status) && days>0;
   if(license && (!active || days<=7))await create({type:'subscription',eventKey:'access:expiry',title:active?'Subscription expiring soon':'Subscription expired',message:`${active?'Your access expires':'Your access expired'} on ${date(license.expires_at)}.`,link:user.role==='student'?'/student/subscription':'/admin/institution',actionLabel:active?'Manage subscription':'Renew access',actionRequired:true});
   else await db.query("UPDATE notifications SET action_required=false,is_read=true WHERE user_id=$1 AND event_key='access:expiry' AND action_required",[user.sub]);
  }
 });
}
