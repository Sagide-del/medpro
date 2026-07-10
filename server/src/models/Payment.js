import { query } from '../config/database.js';

export const Payment = {
  async createPending({ studentId, institutionId, itemType, itemId, transactionType, amount, phone, mpesaCheckoutId }) {
    const { rows } = await query(
      `INSERT INTO revenue_transactions (student_id, institution_id, item_type, item_id, transaction_type, amount, payment_method, phone, mpesa_checkout_id, status)
       VALUES ($1,$2,$3,$4,$5,$6,'mpesa',$7,$8,'pending') RETURNING *`,
      [studentId, institutionId || null, itemType, itemId, transactionType, amount, phone, mpesaCheckoutId]
    );
    return rows[0];
  },

  async findByCheckoutId(checkoutId) {
    const { rows } = await query(`SELECT * FROM revenue_transactions WHERE mpesa_checkout_id = $1`, [checkoutId]);
    return rows[0] || null;
  },

  async findById(transactionId) {
    const { rows } = await query(`SELECT * FROM revenue_transactions WHERE transaction_id = $1`, [transactionId]);
    return rows[0] || null;
  },

  async markCompleted(checkoutId, { mpesaCode }) {
    const { rows } = await query(
      `UPDATE revenue_transactions SET status = 'completed', mpesa_code = $1, transaction_date = now()
       WHERE mpesa_checkout_id = $2 RETURNING *`,
      [mpesaCode, checkoutId]
    );
    return rows[0];
  },

  async markFailed(checkoutId) {
    const { rows } = await query(
      `UPDATE revenue_transactions SET status = 'failed' WHERE mpesa_checkout_id = $1 RETURNING *`,
      [checkoutId]
    );
    return rows[0];
  },

  async grantAccess(studentId, contentType, contentId, hours = 48) {
    const { rows } = await query(
      `INSERT INTO content_access (student_id, content_type, content_id, expires_at)
       VALUES ($1,$2,$3, now() + ($4 || ' hours')::interval) RETURNING *`,
      [studentId, contentType, contentId, hours]
    );
    return rows[0];
  },

  async hasActiveAccess(studentId, contentType, contentId) {
    const { rows } = await query(
      `SELECT 1 FROM content_access WHERE student_id = $1 AND content_type = $2 AND content_id = $3 AND expires_at > now() LIMIT 1`,
      [studentId, contentType, contentId]
    );
    return rows.length > 0;
  },

  async historyForStudent(studentId, { limit = 30 } = {}) {
    const { rows } = await query(
      `SELECT * FROM revenue_transactions WHERE student_id = $1 ORDER BY transaction_date DESC LIMIT $2`,
      [studentId, limit]
    );
    return rows;
  },
};
