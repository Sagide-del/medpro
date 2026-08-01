import { query, withTransaction } from '../config/database.js';
import { hashPassword } from '../config/auth.js';

async function tableExists(exec, tableName) {
  const { rows } = await exec(`SELECT to_regclass($1) IS NOT NULL AS exists`, [tableName]);
  return Boolean(rows[0]?.exists);
}

async function execIfTableExists(exec, tableName, sql, params = []) {
  if (await tableExists(exec, tableName)) {
    return exec(sql, params);
  }
  return null;
}

async function columnExists(exec, tableName, columnName) {
  const { rows } = await exec(
    `SELECT 1
     FROM information_schema.columns
     WHERE table_name = $1 AND column_name = $2
     LIMIT 1`,
    [tableName, columnName]
  );
  return rows.length > 0;
}

async function execIfColumnExists(exec, tableName, columnName, sql, params = []) {
  if (await tableExists(exec, tableName) && await columnExists(exec, tableName, columnName)) {
    return exec(sql, params);
  }
  return null;
}

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

  async history(userId) {
    const [userRows, auditRows, communicationRows, scheduleRows] = await Promise.all([
      query(
        `SELECT u.user_id, u.institution_id, u.reg_number, u.full_name, u.email, u.phone, u.role, u.status,
                u.program, u.year_of_study, u.avatar_url, u.last_active_at, u.created_at, u.updated_at
         FROM users u
         WHERE u.user_id = $1`,
        [userId]
      ),
      tableExists(query, 'deleted_users_audit')
        ? query(
            `SELECT audit_id, deleted_user_id, deleted_by, user_snapshot, reason, deleted_at
             FROM deleted_users_audit
             WHERE deleted_user_id = $1
             ORDER BY deleted_at DESC`,
            [userId]
          )
        : Promise.resolve({ rows: [] }),
      tableExists(query, 'communication_history')
        ? query(
            `SELECT history_id, institution_id, user_id, event_type, channel, title, message, created_at
             FROM communication_history
             WHERE user_id = $1
             ORDER BY created_at DESC
             LIMIT 50`,
            [userId]
          )
        : Promise.resolve({ rows: [] }),
      tableExists(query, 'communication_schedules')
        ? query(
            `SELECT schedule_id, institution_id, created_by, channel, title, subject, message, audience, scheduled_at, status, result, sent_at, created_at, updated_at
             FROM communication_schedules
             WHERE created_by = $1
             ORDER BY created_at DESC
             LIMIT 20`,
            [userId]
          )
        : Promise.resolve({ rows: [] }),
    ]);

    const currentUser = userRows.rows[0] || null;
    const latestSnapshot = auditRows.rows[0]?.user_snapshot || null;
    return {
      user: currentUser || latestSnapshot,
      audit: auditRows.rows,
      communications: communicationRows.rows,
      schedules: scheduleRows.rows,
    };
  },

  async permanentDelete(userId, deletedBy, reason = null) {
    return withTransaction(async (client) => {
      const exec = client.query;
      const { rows } = await exec(
        `SELECT u.user_id, u.institution_id, u.reg_number, u.full_name, u.email, u.phone, u.role, u.status,
                u.program, u.year_of_study, u.avatar_url, u.last_active_at, u.created_at, u.updated_at
         FROM users u
         WHERE u.user_id = $1
         FOR UPDATE`,
        [userId]
      );
      const user = rows[0];
      if (!user) return null;

      const cleanupStatements = [
        ['assessments', 'created_by', `UPDATE assessments SET created_by = NULL WHERE created_by = $1`, [userId]],
        ['worksheets', 'uploaded_by', `UPDATE worksheets SET uploaded_by = NULL WHERE uploaded_by = $1`, [userId]],
        ['flashcard_decks', 'uploaded_by', `UPDATE flashcard_decks SET uploaded_by = NULL WHERE uploaded_by = $1`, [userId]],
        ['medical_graphics', 'uploaded_by', `UPDATE medical_graphics SET uploaded_by = NULL WHERE uploaded_by = $1`, [userId]],
        ['logbook_entries', 'reviewed_by', `UPDATE logbook_entries SET reviewed_by = NULL WHERE reviewed_by = $1`, [userId]],
        ['videos', 'reviewed_by', `UPDATE videos SET reviewed_by = NULL WHERE reviewed_by = $1`, [userId]],
        ['elibrary_resources', 'uploaded_by', `UPDATE elibrary_resources SET uploaded_by = NULL WHERE uploaded_by = $1`, [userId]],
        ['research_items', 'uploaded_by', `UPDATE research_items SET uploaded_by = NULL WHERE uploaded_by = $1`, [userId]],
        ['group_alerts', 'sender_id', `UPDATE group_alerts SET sender_id = NULL WHERE sender_id = $1`, [userId]],
        ['super_admin_logs', 'admin_id', `UPDATE super_admin_logs SET admin_id = NULL WHERE admin_id = $1`, [userId]],
        ['case_studies', 'created_by', `UPDATE case_studies SET created_by = NULL WHERE created_by = $1`, [userId]],
        ['communication_templates', 'created_by', `UPDATE communication_templates SET created_by = NULL WHERE created_by = $1`, [userId]],
        ['communication_schedules', 'created_by', `UPDATE communication_schedules SET created_by = NULL WHERE created_by = $1`, [userId]],
        ['communication_reminder_settings', 'created_by', `UPDATE communication_reminder_settings SET created_by = NULL WHERE created_by = $1`, [userId]],
        ['proctored_exams', 'teacher_id', `UPDATE proctored_exams SET teacher_id = NULL WHERE teacher_id = $1`, [userId]],
      ];

      for (const [tableName, columnName, sql, params] of cleanupStatements) {
        await execIfColumnExists(exec, tableName, columnName, sql, params);
      }

      await execIfTableExists(
        exec,
        'deleted_users_audit',
        `INSERT INTO deleted_users_audit
         (deleted_user_id, deleted_by, user_snapshot, reason, deleted_at)
         VALUES ($1, $2, $3, $4, now())`,
        [
          userId,
          deletedBy || null,
          JSON.stringify(user),
          reason || null,
        ]
      );

      const deleted = await exec(`DELETE FROM users WHERE user_id = $1 RETURNING user_id`, [userId]);
      return deleted.rows[0] || null;
    });
  },

  async bulkPermanentDelete(userIds, deletedBy, reason = null) {
    const ids = [...new Set((Array.isArray(userIds) ? userIds : []).map((id) => String(id)).filter(Boolean))];
    const results = [];
    for (const userId of ids) {
      // Reuse the single-delete transaction to keep cleanup and audit rows consistent.
      const deleted = await this.permanentDelete(userId, deletedBy, reason);
      if (deleted) results.push(deleted);
    }
    return results;
  },
};
