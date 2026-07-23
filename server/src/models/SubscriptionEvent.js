import { query } from '../config/database.js';

export const SubscriptionEvent = {
  async create({ planId, studentId, institutionId, transactionId, eventType, status = 'recorded', details = {}, createdBy }) {
    const { rows } = await query(
      `INSERT INTO subscription_events
       (plan_id, student_id, institution_id, transaction_id, event_type, status, details, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [planId || null, studentId || null, institutionId || null, transactionId || null, eventType, status, details, createdBy || null]
    );
    return rows[0];
  },
};
