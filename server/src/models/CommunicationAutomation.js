import { query } from '../config/database.js';

export const CommunicationAutomation = {
  async listAll({ institutionId, role }) {
    const params = [];
    let scope = '';
    if (role !== 'super_admin') {
      params.push(institutionId);
      scope = `WHERE institution_id = $1 OR institution_id IS NULL`;
    }

    const [{ rows: templates }, { rows: logs }, { rows: history }] = await Promise.all([
      query(`SELECT * FROM communication_templates ${scope} ORDER BY created_at DESC`, params),
      query(`SELECT * FROM communication_delivery_logs ORDER BY created_at DESC LIMIT 50`),
      query(`SELECT * FROM communication_history ${scope} ORDER BY created_at DESC LIMIT 50`, params),
    ]);

    return { templates, logs, history };
  },

  async createTemplate({ institutionId, createdBy, name, channel, eventType, subject, body }) {
    const { rows } = await query(
      `INSERT INTO communication_templates
       (institution_id, created_by, name, channel, event_type, subject, body)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [institutionId || null, createdBy, name, channel, eventType, subject || null, body]
    );
    return rows[0];
  },

  async triggerEvent({ institutionId, eventType, title, message, channel, recipientUserIds = [] }) {
    const recipients = recipientUserIds.length
      ? recipientUserIds
      : (await query(
          `SELECT user_id, email, phone FROM users ${institutionId ? 'WHERE institution_id = $1' : ''} ORDER BY created_at DESC LIMIT 20`,
          institutionId ? [institutionId] : []
        )).rows;

    const historyRows = [];
    for (const recipient of recipients) {
      const recipientId = recipient.user_id || recipient;
      const recipientAddress = recipient.email || recipient.phone || 'in-app';
      const { rows: history } = await query(
        `INSERT INTO communication_history (institution_id, user_id, event_type, channel, title, message)
         VALUES ($1,$2,$3,$4,$5,$6)
         RETURNING *`,
        [institutionId || null, recipientId, eventType, channel, title, message]
      );
      await query(
        `INSERT INTO communication_delivery_logs
         (user_id, channel, event_type, recipient, status, provider_payload, delivered_at)
         VALUES ($1,$2,$3,$4,$5,$6,now())`,
        [recipientId, channel, eventType, recipientAddress, channel === 'in_app' ? 'delivered' : 'queued', JSON.stringify({ simulated: true })]
      );
      historyRows.push(history[0]);
    }
    return historyRows;
  },
};
