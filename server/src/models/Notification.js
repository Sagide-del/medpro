import { query } from '../config/database.js';
const changed='(n.title,n.message,n.link,n.action_label,n.action_required) IS DISTINCT FROM (EXCLUDED.title,EXCLUDED.message,EXCLUDED.link,EXCLUDED.action_label,EXCLUDED.action_required)';
export const Notification = {
 async create({userId,type='system',title,message,link,eventKey=null,actionLabel=null,actionRequired=false,occurredAt=null},executor={query}){
  const {rows}=await executor.query(`INSERT INTO notifications AS n(user_id,type,title,message,link,event_key,action_label,action_required,created_at,updated_at)
   VALUES($1,$2,$3,$4,$5,$6,$7,$8,COALESCE($9::timestamptz,now()),COALESCE($9::timestamptz,now()))
   ON CONFLICT(user_id,event_key) WHERE event_key IS NOT NULL DO UPDATE SET title=EXCLUDED.title,message=EXCLUDED.message,link=EXCLUDED.link,type=EXCLUDED.type,
   action_label=EXCLUDED.action_label,action_required=EXCLUDED.action_required,is_read=CASE WHEN ${changed} THEN false ELSE n.is_read END,
   updated_at=CASE WHEN ${changed} THEN now() ELSE n.updated_at END RETURNING *`,[userId,type,title,message || null,link || null,eventKey,actionLabel,actionRequired,occurredAt]);return rows[0];
 },
 async listForUser(userId,{unreadOnly=false,actionOnly=false,limit=50}={}){
  const {rows}=await query(`SELECT * FROM notifications WHERE user_id=$1 ${unreadOnly?'AND is_read=false':''} ${actionOnly?'AND action_required=true':''}
   ORDER BY action_required DESC,updated_at DESC,created_at DESC LIMIT $2`,[userId,Math.min(100,Math.max(1,Number(limit)||50))]);return rows;
 },
 async markRead(notificationId,userId){return (await query('UPDATE notifications SET is_read=true WHERE notification_id=$1 AND user_id=$2 RETURNING *',[notificationId,userId])).rows[0];},
 async markAllRead(userId){await query('UPDATE notifications SET is_read=true WHERE user_id=$1 AND is_read=false',[userId]);},
 async summary(userId){return (await query('SELECT count(*) FILTER(WHERE NOT is_read)::int AS unread,count(*) FILTER(WHERE action_required)::int AS action_needed FROM notifications WHERE user_id=$1',[userId])).rows[0];},
 async unreadCount(userId){return (await this.summary(userId)).unread;},
};
