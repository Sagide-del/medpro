import { query } from '../config/database.js';

export const Institution = {
  async list() {
    const { rows } = await query(
      `SELECT i.*,
              s.plan, s.status AS subscription_status, s.max_students, s.expires_at,
              (SELECT COUNT(*) FROM users u WHERE u.institution_id = i.institution_id AND u.role = 'student')::int AS student_count,
              COALESCE((SELECT SUM(rt.amount) FROM revenue_transactions rt WHERE rt.institution_id = i.institution_id AND rt.status = 'completed'), 0) AS total_revenue
       FROM institutions i
       LEFT JOIN LATERAL (
         SELECT * FROM institution_subscriptions isub
         WHERE isub.institution_id = i.institution_id
         ORDER BY isub.created_at DESC LIMIT 1
       ) s ON true
       ORDER BY i.name`
    );
    return rows;
  },

  async findById(institutionId) {
    const { rows } = await query(`SELECT * FROM institutions WHERE institution_id = $1`, [institutionId]);
    return rows[0] || null;
  },

  // Site-license check: an institution with an active/trial subscription
  // covers assessment access for all of its students, on top of (or instead
  // of) any student paying for a personal subscription directly.
  async hasActiveSubscription(institutionId) {
    if (!institutionId) return false;
    const { rows } = await query(
      `SELECT 1 FROM institution_subscriptions
       WHERE institution_id = $1 AND status IN ('active', 'trial') AND expires_at > now() LIMIT 1`,
      [institutionId]
    );
    return rows.length > 0;
  },

  async create({ name, shortCode, contactEmail, contactPhone, address, logoUrl }) {
    const { rows } = await query(
      `INSERT INTO institutions (name, short_code, contact_email, contact_phone, address, logo_url)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [name, shortCode, contactEmail || null, contactPhone || null, address || null, logoUrl || null]
    );
    return rows[0];
  },

  async update(institutionId, fields) {
    const allowed = ['name', 'contact_email', 'contact_phone', 'address', 'logo_url'];
    const sets = [];
    const params = [];
    let i = 1;
    for (const key of Object.keys(fields)) {
      if (allowed.includes(key)) { sets.push(`${key} = $${i++}`); params.push(fields[key]); }
    }
    if (!sets.length) return this.findById(institutionId);
    params.push(institutionId);
    const { rows } = await query(`UPDATE institutions SET ${sets.join(', ')} WHERE institution_id = $${i} RETURNING *`, params);
    return rows[0];
  },

  async addSubscription(institutionId, { plan, status = 'active', maxStudents, amount, expiresAt }) {
    const { rows } = await query(
      `INSERT INTO institution_subscriptions (institution_id, plan, status, max_students, amount, expires_at)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [institutionId, plan, status, maxStudents, amount, expiresAt]
    );
    return rows[0];
  },

  async expiringWithin(days = 30) {
    const { rows } = await query(
      `SELECT i.institution_id, i.name, s.plan, s.expires_at, s.status
       FROM institution_subscriptions s
       JOIN institutions i ON i.institution_id = s.institution_id
       WHERE s.expires_at <= now() + ($1 || ' days')::interval AND s.status IN ('active','trial','expiring')
       ORDER BY s.expires_at ASC`,
      [days]
    );
    return rows;
  },
};
