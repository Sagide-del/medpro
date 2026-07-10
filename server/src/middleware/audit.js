import { query } from '../config/database.js';

// Fire-and-forget audit log for super admin actions
export function logAdminAction(adminId, actionType, details, req) {
  query(
    `INSERT INTO super_admin_logs (admin_id, action_type, action_details, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5)`,
    [adminId, actionType, JSON.stringify(details || {}), req?.ip || null, req?.headers?.['user-agent'] || null]
  ).catch((err) => console.error('audit log failed:', err.message));
}
