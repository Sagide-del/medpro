import { query } from '../config/database.js';
import { hashPassword } from '../config/auth.js';

export const User = {
  async findByEmail(email) {
    const { rows } = await query(
      `SELECT u.*, i.name AS institution_name
       FROM users u LEFT JOIN institutions i ON i.institution_id = u.institution_id
       WHERE u.email = $1`,
      [email.toLowerCase().trim()]
    );
    return rows[0] || null;
  },

  async findById(userId) {
    const { rows } = await query(
      `SELECT u.user_id, u.institution_id, u.reg_number, u.full_name, u.email, u.phone,
              u.role, u.status, u.program, u.year_of_study, u.avatar_url, u.last_active_at, u.created_at,
              i.name AS institution_name
       FROM users u LEFT JOIN institutions i ON i.institution_id = u.institution_id
       WHERE u.user_id = $1`,
      [userId]
    );
    return rows[0] || null;
  },

  async create({ institutionId, regNumber, fullName, email, phone, password, role = 'student', program, yearOfStudy }) {
    const passwordHash = await hashPassword(password);
    const { rows } = await query(
      `INSERT INTO users (institution_id, reg_number, full_name, email, phone, password_hash, role, program, year_of_study)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING user_id, institution_id, reg_number, full_name, email, phone, role, status, program, year_of_study, created_at`,
      [institutionId || null, regNumber || null, fullName, email.toLowerCase().trim(), phone || null, passwordHash, role, program || null, yearOfStudy || null]
    );
    return rows[0];
  },

  async list({ role, institutionId, status, search, limit = 20, offset = 0 } = {}) {
    const conditions = [];
    const params = [];
    let i = 1;

    if (role) { conditions.push(`u.role = $${i++}`); params.push(role); }
    if (institutionId) { conditions.push(`u.institution_id = $${i++}`); params.push(institutionId); }
    if (status) { conditions.push(`u.status = $${i++}`); params.push(status); }
    if (search) { conditions.push(`(u.full_name ILIKE $${i} OR u.email ILIKE $${i} OR u.reg_number ILIKE $${i})`); params.push(`%${search}%`); i++; }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await query(
      `SELECT u.user_id, u.institution_id, u.reg_number, u.full_name, u.email, u.phone, u.role, u.status,
              u.program, u.year_of_study, u.last_active_at, u.created_at, i.name AS institution_name
       FROM users u LEFT JOIN institutions i ON i.institution_id = u.institution_id
       ${where}
       ORDER BY u.created_at DESC
       LIMIT $${i++} OFFSET $${i++}`,
      [...params, limit, offset]
    );
    const { rows: countRows } = await query(`SELECT COUNT(*)::int AS count FROM users u ${where}`, params);
    return { rows, total: countRows[0].count };
  },

  async update(userId, fields) {
    const allowed = ['full_name', 'phone', 'program', 'year_of_study', 'avatar_url', 'institution_id'];
    const sets = [];
    const params = [];
    let i = 1;
    for (const key of Object.keys(fields)) {
      if (allowed.includes(key)) { sets.push(`${key} = $${i++}`); params.push(fields[key]); }
    }
    if (!sets.length) return this.findById(userId);
    params.push(userId);
    const { rows } = await query(
      `UPDATE users SET ${sets.join(', ')} WHERE user_id = $${i} RETURNING user_id, full_name, email, phone, role, status`,
      params
    );
    return rows[0];
  },

  async setStatus(userId, status) {
    const { rows } = await query(
      `UPDATE users SET status = $1 WHERE user_id = $2 RETURNING user_id, status`,
      [status, userId]
    );
    return rows[0];
  },

  async setRole(userId, role) {
    const { rows } = await query(`UPDATE users SET role = $1 WHERE user_id = $2 RETURNING user_id, role`, [role, userId]);
    return rows[0];
  },

  async touchLastActive(userId) {
    await query(`UPDATE users SET last_active_at = now() WHERE user_id = $1`, [userId]);
  },

  async setPassword(userId, newPassword) {
    const passwordHash = await hashPassword(newPassword);
    await query(`UPDATE users SET password_hash = $1 WHERE user_id = $2`, [passwordHash, userId]);
  },

  async softDelete(userId) {
    const { rows } = await query(`UPDATE users SET status = 'deleted' WHERE user_id = $1 RETURNING user_id`, [userId]);
    return rows[0];
  },
};
