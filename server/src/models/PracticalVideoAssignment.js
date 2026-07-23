import { query, withTransaction } from '../config/database.js';

async function ensureStudentAssignment(client, assignmentId, studentId) {
  const { rows } = await client.query(
    `SELECT DISTINCT a.assignment_id
     FROM practical_video_assignments a
     JOIN practical_video_assignment_targets t ON t.assignment_id = a.assignment_id
     LEFT JOIN group_members gm ON gm.group_id = t.group_id AND gm.student_id = $2
     WHERE a.assignment_id = $1
       AND (t.student_id = $2 OR gm.student_id = $2)`,
    [assignmentId, studentId]
  );
  return rows[0] || null;
}

export const PracticalVideoAssignment = {
  async listForTeacher({ userId, institutionId, role }) {
    const params = [];
    let where = '';
    if (role === 'teacher') {
      params.push(userId);
      where = `WHERE a.teacher_id = $${params.length}`;
    } else if (institutionId) {
      params.push(institutionId);
      where = `WHERE a.institution_id = $${params.length}`;
    }

    const { rows } = await query(
      `SELECT a.*,
              COUNT(DISTINCT t.target_id)::int AS target_count,
              COUNT(DISTINCT s.submission_id)::int AS submission_count
       FROM practical_video_assignments a
       LEFT JOIN practical_video_assignment_targets t ON t.assignment_id = a.assignment_id
       LEFT JOIN practical_video_submissions s ON s.assignment_id = a.assignment_id
       ${where}
       GROUP BY a.assignment_id
       ORDER BY a.created_at DESC`,
      params
    );
    return rows;
  },

  async create({ institutionId, teacherId, title, instructions, markingChecklist = [], dueDate, status = 'draft', studentIds = [], groupIds = [] }) {
    return withTransaction(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO practical_video_assignments
         (institution_id, teacher_id, title, instructions, marking_checklist, due_date, status, assigned_scope)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         RETURNING *`,
        [
          institutionId || null,
          teacherId,
          title,
          instructions || null,
          JSON.stringify(markingChecklist || []),
          dueDate || null,
          status,
          groupIds.length ? 'group' : 'student',
        ]
      );
      const assignment = rows[0];

      for (const studentId of studentIds) {
        await client.query(
          `INSERT INTO practical_video_assignment_targets (assignment_id, student_id)
           VALUES ($1,$2)`,
          [assignment.assignment_id, studentId]
        );
      }

      for (const groupId of groupIds) {
        await client.query(
          `INSERT INTO practical_video_assignment_targets (assignment_id, group_id)
           VALUES ($1,$2)`,
          [assignment.assignment_id, groupId]
        );
      }

      return assignment;
    });
  },

  async update(assignmentId, { title, instructions, markingChecklist, dueDate, status }) {
    const { rows } = await query(
      `UPDATE practical_video_assignments
       SET title = COALESCE($2, title),
           instructions = COALESCE($3, instructions),
           marking_checklist = COALESCE($4, marking_checklist),
           due_date = COALESCE($5, due_date),
           status = COALESCE($6, status),
           updated_at = now()
       WHERE assignment_id = $1
       RETURNING *`,
      [
        assignmentId,
        title || null,
        instructions || null,
        markingChecklist ? JSON.stringify(markingChecklist) : null,
        dueDate || null,
        status || null,
      ]
    );
    return rows[0] || null;
  },

  async delete(assignmentId) {
    await query(`DELETE FROM practical_video_assignments WHERE assignment_id = $1`, [assignmentId]);
  },

  async listForStudent(studentId) {
    const { rows } = await query(
      `SELECT DISTINCT a.*,
              s.submission_id,
              s.status AS submission_status,
              s.teacher_feedback,
              s.reviewed_at,
              s.released_at,
              s.file_url,
              s.notes
       FROM practical_video_assignments a
       JOIN practical_video_assignment_targets t ON t.assignment_id = a.assignment_id
       LEFT JOIN group_members gm ON gm.group_id = t.group_id AND gm.student_id = $1
       LEFT JOIN practical_video_submissions s ON s.assignment_id = a.assignment_id AND s.student_id = $1
       WHERE t.student_id = $1 OR gm.student_id = $1
       ORDER BY a.created_at DESC`,
      [studentId]
    );
    return rows;
  },

  async submit({ assignmentId, studentId, fileUrl, notes }) {
    return withTransaction(async (client) => {
      const assigned = await ensureStudentAssignment(client, assignmentId, studentId);
      if (!assigned) {
        const error = new Error('This assignment is not assigned to you.');
        error.status = 403;
        throw error;
      }

      const { rows: createdVideo } = await client.query(
        `INSERT INTO videos (student_id, title, description, skill_category, file_url)
         SELECT $2, title, instructions, 'practical_video_assignment', $3
         FROM practical_video_assignments WHERE assignment_id = $1
         RETURNING *`,
        [assignmentId, studentId, fileUrl]
      );

      const { rows } = await client.query(
        `INSERT INTO practical_video_submissions
         (assignment_id, student_id, video_id, file_url, notes, status)
         VALUES ($1,$2,$3,$4,$5,'submitted')
         ON CONFLICT (assignment_id, student_id)
         DO UPDATE SET video_id = EXCLUDED.video_id,
                       file_url = EXCLUDED.file_url,
                       notes = EXCLUDED.notes,
                       status = 'submitted',
                       updated_at = now()
         RETURNING *`,
        [assignmentId, studentId, createdVideo[0]?.video_id || null, fileUrl, notes || null]
      );
      return rows[0];
    });
  },

  async reviewQueue({ userId, institutionId, role }) {
    const params = [];
    let where = '';
    if (role === 'teacher') {
      params.push(userId);
      where = `WHERE a.teacher_id = $${params.length}`;
    } else if (institutionId) {
      params.push(institutionId);
      where = `WHERE a.institution_id = $${params.length}`;
    }

    const { rows } = await query(
      `SELECT s.*, a.title AS assignment_title, a.marking_checklist, a.due_date,
              u.full_name AS student_name, u.email AS student_email
       FROM practical_video_submissions s
       JOIN practical_video_assignments a ON a.assignment_id = s.assignment_id
       JOIN users u ON u.user_id = s.student_id
       ${where}
       ORDER BY s.created_at DESC`,
      params
    );
    return rows;
  },

  async reviewSubmission(submissionId, reviewerId, { status, teacherFeedback, checklistResults, releaseResult }) {
    const { rows } = await query(
      `UPDATE practical_video_submissions
       SET status = $2,
           teacher_feedback = $3,
           checklist_results = COALESCE($4, checklist_results),
           reviewed_by = $5,
           reviewed_at = now(),
           released_at = CASE WHEN $6 THEN now() ELSE released_at END,
           updated_at = now()
       WHERE submission_id = $1
       RETURNING *`,
      [
        submissionId,
        status,
        teacherFeedback || null,
        checklistResults ? JSON.stringify(checklistResults) : null,
        reviewerId,
        Boolean(releaseResult),
      ]
    );
    return rows[0] || null;
  },
};
