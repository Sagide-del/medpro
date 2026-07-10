import { query } from '../config/database.js';

export const Notification = {
  async create({ userId, type = 'system', title, message, link }) {
    const { rows } = await query(
      `INSERT INTO notifications (user_id, type, title, message, link) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [userId, type, title, message || null, link || null]
    );
    return rows[0];
  },

  async listForUser(userId, { unreadOnly = false, limit = 30 } = {}) {
    const { rows } = await query(
      `SELECT * FROM notifications WHERE user_id = $1 ${unreadOnly ? 'AND is_read = false' : ''}
       ORDER BY created_at DESC LIMIT $2`,
      [userId, limit]
    );
    return rows;
  },

  async markRead(notificationId, userId) {
    const { rows } = await query(
      `UPDATE notifications SET is_read = true WHERE notification_id = $1 AND user_id = $2 RETURNING *`,
      [notificationId, userId]
    );
    return rows[0];
  },

  async markAllRead(userId) {
    await query(`UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false`, [userId]);
  },

  async unreadCount(userId) {
    const { rows } = await query(`SELECT COUNT(*)::int AS count FROM notifications WHERE user_id = $1 AND is_read = false`, [userId]);
    return rows[0].count;
  },
};
