import { query } from '../config/database.js';

export const Group = {
  async create({ institutionId, teacherId, name, description }) {
    const { rows } = await query(
      `INSERT INTO groups (institution_id, teacher_id, name, description) VALUES ($1,$2,$3,$4) RETURNING *`,
      [institutionId || null, teacherId, name, description || null]
    );
    return rows[0];
  },

  async listByTeacher(teacherId) {
    const { rows } = await query(
      `SELECT g.*, COUNT(gm.student_id)::int AS member_count
       FROM groups g LEFT JOIN group_members gm ON gm.group_id = g.group_id
       WHERE g.teacher_id = $1 GROUP BY g.group_id ORDER BY g.created_at DESC`,
      [teacherId]
    );
    return rows;
  },

  async listByStudent(studentId) {
    const { rows } = await query(
      `SELECT g.* FROM groups g
       JOIN group_members gm ON gm.group_id = g.group_id
       WHERE gm.student_id = $1`,
      [studentId]
    );
    return rows;
  },

  async findById(groupId) {
    const { rows } = await query(`SELECT * FROM groups WHERE group_id = $1`, [groupId]);
    return rows[0] || null;
  },

  async addMember(groupId, studentId) {
    const { rows } = await query(
      `INSERT INTO group_members (group_id, student_id) VALUES ($1,$2)
       ON CONFLICT DO NOTHING RETURNING *`,
      [groupId, studentId]
    );
    return rows[0] || null;
  },

  async removeMember(groupId, studentId) {
    await query(`DELETE FROM group_members WHERE group_id = $1 AND student_id = $2`, [groupId, studentId]);
  },

  async members(groupId) {
    const { rows } = await query(
      `SELECT u.user_id, u.full_name, u.email, u.phone, u.reg_number, u.program
       FROM group_members gm JOIN users u ON u.user_id = gm.student_id
       WHERE gm.group_id = $1 ORDER BY u.full_name`,
      [groupId]
    );
    return rows;
  },

  async delete(groupId) {
    await query(`DELETE FROM groups WHERE group_id = $1`, [groupId]);
  },
};
