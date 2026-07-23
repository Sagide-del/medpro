import { query } from '../config/database.js';

export const SubscriptionPlan = {
  async list({ includeInactive = false, type } = {}) {
    const clauses = [];
    const params = [];

    if (!includeInactive) {
      params.push(true);
      clauses.push(`is_active = $${params.length}`);
    }

    if (type) {
      params.push(type);
      clauses.push(`type = $${params.length}`);
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const { rows } = await query(
      `SELECT *
       FROM subscription_plans
       ${where}
       ORDER BY type, price, created_at`,
      params
    );
    return rows;
  },

  async findById(planId) {
    const { rows } = await query(`SELECT * FROM subscription_plans WHERE plan_id = $1`, [planId]);
    return rows[0] || null;
  },

  async findByCode(code) {
    const { rows } = await query(`SELECT * FROM subscription_plans WHERE code = $1`, [code]);
    return rows[0] || null;
  },

  async findActiveByCode(code) {
    const { rows } = await query(`SELECT * FROM subscription_plans WHERE code = $1 AND is_active = true`, [code]);
    return rows[0] || null;
  },

  async update(planId, fields) {
    const allowed = ['name', 'type', 'price', 'currency', 'duration_days', 'features', 'is_active'];
    const sets = [];
    const params = [];
    let i = 1;

    for (const key of Object.keys(fields)) {
      if (allowed.includes(key) && fields[key] !== undefined) {
        sets.push(`${key} = $${i++}`);
        params.push(fields[key]);
      }
    }

    if (!sets.length) return this.findById(planId);

    params.push(planId);
    const { rows } = await query(
      `UPDATE subscription_plans
       SET ${sets.join(', ')}
       WHERE plan_id = $${i}
       RETURNING *`,
      params
    );
    return rows[0] || null;
  },
};
