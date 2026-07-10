import { query } from '../config/database.js';

export const GroupAlert = {
  async create({ groupId, senderId, title, message, channel = 'app', recipientCount = 0 }) {
    const { rows } = await query(
      `INSERT INTO group_alerts (group_id, sender_id, title, message, channel, recipient_count)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [groupId, senderId, title, message, channel, recipientCount]
    );
    return rows[0];
  },

  async listForGroup(groupId) {
    const { rows } = await query(
      `SELECT ga.*, u.full_name AS sender_name FROM group_alerts ga
       LEFT JOIN users u ON u.user_id = ga.sender_id
       WHERE ga.group_id = $1 ORDER BY ga.created_at DESC`,
      [groupId]
    );
    return rows;
  },

  async listForTeacher(teacherId) {
    const { rows } = await query(
      `SELECT ga.*, g.name AS group_name FROM group_alerts ga
       JOIN groups g ON g.group_id = ga.group_id
       WHERE ga.sender_id = $1 ORDER BY ga.created_at DESC LIMIT 30`,
      [teacherId]
    );
    return rows;
  },
};
