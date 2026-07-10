import { query } from '../config/database.js';

// Personal Ksh 500/month "unlock all assessments" subscription. Separate
// from institution_subscriptions — a student can get assessment access
// either by paying for this directly, or for free if their institution has
// an active site-license subscription (see Institution.hasActiveSubscription).
export const StudentSubscription = {
  async findActive(studentId) {
    const { rows } = await query(
      `SELECT * FROM student_subscriptions
       WHERE student_id = $1 AND status = 'active' AND expires_at > now()
       ORDER BY expires_at DESC LIMIT 1`,
      [studentId]
    );
    return rows[0] || null;
  },

  // Stacks onto an existing active subscription's expiry (so paying early
  // doesn't waste remaining days), otherwise starts a fresh period from now.
  async create({ studentId, amount, months = 1 }) {
    const current = await this.findActive(studentId);
    const base = current ? new Date(current.expires_at) : new Date();
    const expiresAt = new Date(base.getTime() + months * 30 * 24 * 60 * 60 * 1000);
    const { rows } = await query(
      `INSERT INTO student_subscriptions (student_id, status, amount, starts_at, expires_at)
       VALUES ($1, 'active', $2, now(), $3) RETURNING *`,
      [studentId, amount, expiresAt]
    );
    return rows[0];
  },

  async historyForStudent(studentId) {
    const { rows } = await query(
      `SELECT * FROM student_subscriptions WHERE student_id = $1 ORDER BY starts_at DESC`,
      [studentId]
    );
    return rows;
  },

  async cancel(subscriptionId, studentId) {
    const { rows } = await query(
      `UPDATE student_subscriptions SET status = 'cancelled' WHERE subscription_id = $1 AND student_id = $2 RETURNING *`,
      [subscriptionId, studentId]
    );
    return rows[0] || null;
  },
};
