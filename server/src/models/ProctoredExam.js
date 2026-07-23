import { query, withTransaction } from '../config/database.js';

export const ProctoredExam = {
  async create({ institutionId, teacherId, title, examType, durationMinutes, questionCount, randomQuestions, randomAnswerOrder, passingScore, resultReleaseMode, startsAt, endsAt, studentIds = [] }) {
    return withTransaction(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO proctored_exams
         (institution_id, teacher_id, title, exam_type, duration_minutes, question_count, random_questions, random_answer_order, passing_score, result_release_mode, starts_at, ends_at, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'scheduled')
         RETURNING *`,
        [
          institutionId,
          teacherId,
          title,
          examType,
          durationMinutes || 60,
          questionCount || 20,
          Boolean(randomQuestions),
          Boolean(randomAnswerOrder),
          passingScore || 50,
          resultReleaseMode || 'manual',
          startsAt || null,
          endsAt || null,
        ]
      );

      for (const studentId of studentIds) {
        await client.query(
          `INSERT INTO proctored_exam_candidates (exam_id, student_id)
           VALUES ($1,$2)
           ON CONFLICT (exam_id, student_id) DO NOTHING`,
          [rows[0].exam_id, studentId]
        );
      }

      return rows[0];
    });
  },

  async listForTeacher({ userId, institutionId, role }) {
    const params = [];
    let where = '';
    if (role === 'teacher') {
      params.push(userId);
      where = `WHERE e.teacher_id = $${params.length}`;
    } else if (institutionId) {
      params.push(institutionId);
      where = `WHERE e.institution_id = $${params.length}`;
    }
    const { rows } = await query(
      `SELECT e.*,
              COUNT(DISTINCT c.candidate_id)::int AS candidate_count,
              COUNT(DISTINCT a.attempt_id)::int AS attempt_count,
              COALESCE(AVG(a.score), 0)::numeric(5,2) AS average_score
       FROM proctored_exams e
       LEFT JOIN proctored_exam_candidates c ON c.exam_id = e.exam_id
       LEFT JOIN proctored_exam_attempts a ON a.exam_id = e.exam_id
       ${where}
       GROUP BY e.exam_id
       ORDER BY e.created_at DESC`,
      params
    );
    return rows;
  },

  async listForStudent(studentId) {
    const { rows } = await query(
      `SELECT e.*, c.status AS candidate_status, a.attempt_id, a.started_at, a.submitted_at, a.score, a.status AS attempt_status,
              a.result_released, a.suspicious_events
       FROM proctored_exams e
       JOIN proctored_exam_candidates c ON c.exam_id = e.exam_id
       LEFT JOIN proctored_exam_attempts a ON a.exam_id = e.exam_id AND a.student_id = $1
       WHERE c.student_id = $1
       ORDER BY e.starts_at NULLS LAST, e.created_at DESC`,
      [studentId]
    );
    return rows;
  },

  async startAttempt({ examId, studentId }) {
    const { rows } = await query(
      `INSERT INTO proctored_exam_attempts (exam_id, student_id, started_at, status)
       VALUES ($1,$2,now(),'in_progress')
       ON CONFLICT (exam_id, student_id)
       DO UPDATE SET started_at = COALESCE(proctored_exam_attempts.started_at, now()),
                     status = CASE WHEN proctored_exam_attempts.status = 'submitted' THEN proctored_exam_attempts.status ELSE 'in_progress' END
       RETURNING *`,
      [examId, studentId]
    );
    return rows[0];
  },

  async submitAttempt({ examId, studentId, score, autoSubmitted = false }) {
    const { rows } = await query(
      `UPDATE proctored_exam_attempts
       SET submitted_at = now(),
           score = COALESCE($3, score, 0),
           status = 'submitted',
           auto_submitted = $4
       WHERE exam_id = $1 AND student_id = $2
       RETURNING *`,
      [examId, studentId, score ?? null, Boolean(autoSubmitted)]
    );
    return rows[0] || null;
  },

  async logActivity({ examId, studentId, eventType, details }) {
    const { rows } = await query(
      `INSERT INTO proctored_exam_activity_logs (exam_id, student_id, event_type, details)
       VALUES ($1,$2,$3,$4)
       RETURNING *`,
      [examId, studentId, eventType, JSON.stringify(details || {})]
    );
    if (eventType === 'suspicious_activity') {
      await query(
        `UPDATE proctored_exam_attempts
         SET suspicious_events = suspicious_events + 1
         WHERE exam_id = $1 AND student_id = $2`,
        [examId, studentId]
      );
    }
    return rows[0];
  },

  async releaseResults(examId) {
    await query(`UPDATE proctored_exam_attempts SET result_released = true WHERE exam_id = $1`, [examId]);
  },

  async activeCandidates(examId) {
    const { rows } = await query(
      `SELECT a.*, u.full_name, u.email
       FROM proctored_exam_attempts a
       JOIN users u ON u.user_id = a.student_id
       WHERE a.exam_id = $1
       ORDER BY a.started_at DESC NULLS LAST`,
      [examId]
    );
    return rows;
  },

  async reports({ institutionId }) {
    const [{ rows: results }, { rows: suspicious }, { rows: analytics }] = await Promise.all([
      query(
        `SELECT e.title, e.exam_type, COUNT(a.attempt_id)::int AS attempts, COALESCE(AVG(a.score),0)::numeric(5,2) AS average_score
         FROM proctored_exams e
         LEFT JOIN proctored_exam_attempts a ON a.exam_id = e.exam_id
         WHERE e.institution_id = $1
         GROUP BY e.exam_id
         ORDER BY e.created_at DESC`,
        [institutionId]
      ),
      query(
        `SELECT e.title, COALESCE(SUM(a.suspicious_events), 0)::int AS suspicious_events
         FROM proctored_exams e
         LEFT JOIN proctored_exam_attempts a ON a.exam_id = e.exam_id
         WHERE e.institution_id = $1
         GROUP BY e.exam_id
         ORDER BY suspicious_events DESC, e.title`,
        [institutionId]
      ),
      query(
        `SELECT COUNT(*)::int AS total_exams,
                COUNT(*) FILTER (WHERE status = 'scheduled')::int AS scheduled_exams
         FROM proctored_exams
         WHERE institution_id = $1`,
        [institutionId]
      ),
    ]);
    return { results, suspicious, analytics: analytics[0] || { total_exams: 0, scheduled_exams: 0 } };
  },
};
