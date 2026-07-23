import { query } from '../config/database.js';

export const analyticsService = {
  async overview({ institutionId } = {}) {
    const scope = institutionId ? `WHERE institution_id = $1` : '';
    const params = institutionId ? [institutionId] : [];

    const [{ rows: users }, { rows: revenue }, { rows: recent }] = await Promise.all([
      query(
        `SELECT role, COUNT(*)::int AS count FROM users ${institutionId ? 'WHERE institution_id = $1' : ''} GROUP BY role`,
        params
      ),
      query(
        `SELECT COALESCE(SUM(amount),0) AS total, COUNT(*)::int AS count
         FROM revenue_transactions ${scope}${scope ? ' AND' : 'WHERE'} status = 'completed'`,
        params
      ),
      query(
        `SELECT log_id, action_type, action_details, created_at FROM super_admin_logs ORDER BY created_at DESC LIMIT 10`
      ),
    ]);

    return {
      usersByRole: users,
      revenue: revenue[0],
      recentActivity: recent,
    };
  },

  async revenueByStream({ months = 12, institutionId } = {}) {
    const params = [months];
    let scope = '';
    if (institutionId) { params.push(institutionId); scope = `AND institution_id = $${params.length}`; }
    const { rows } = await query(
      `SELECT date_trunc('month', transaction_date) AS month, transaction_type, SUM(amount) AS total
       FROM revenue_transactions
       WHERE status = 'completed' AND transaction_date >= now() - ($1 || ' months')::interval ${scope}
       GROUP BY 1, 2 ORDER BY 1`,
      params
    );
    return rows;
  },

  async revenueByInstitution({ institutionId } = {}) {
    const params = [];
    let scope = '';
    if (institutionId) { params.push(institutionId); scope = `WHERE i.institution_id = $1`; }
    const { rows } = await query(
      `SELECT i.institution_id, i.name, COALESCE(SUM(rt.amount), 0) AS total
       FROM institutions i LEFT JOIN revenue_transactions rt ON rt.institution_id = i.institution_id AND rt.status = 'completed'
       ${scope}
       GROUP BY i.institution_id, i.name ORDER BY total DESC`,
      params
    );
    return rows;
  },

  async topContent({ limit = 10 } = {}) {
    const { rows } = await query(
      `(SELECT 'worksheet' AS type, worksheet_id AS id, title, purchase_count FROM worksheets ORDER BY purchase_count DESC LIMIT $1)
       UNION ALL
       (SELECT 'flashcard_deck' AS type, deck_id AS id, title, purchase_count FROM flashcard_decks ORDER BY purchase_count DESC LIMIT $1)
       UNION ALL
       (SELECT 'graphic' AS type, graphic_id AS id, title, purchase_count FROM medical_graphics ORDER BY purchase_count DESC LIMIT $1)
       ORDER BY purchase_count DESC LIMIT $1`,
      [limit]
    );
    return rows;
  },

  async studentProgress(studentId) {
    const { rows } = await query(
      `SELECT domain, AVG(score_pct)::numeric(5,2) AS avg_score, COUNT(*)::int AS attempts
       FROM student_performance WHERE student_id = $1 GROUP BY domain`,
      [studentId]
    );
    return rows;
  },

  async classPerformance(groupId) {
    const { rows } = await query(
      `SELECT u.user_id, u.full_name,
              AVG(aa.score_pct)::numeric(5,2) AS avg_score,
              COUNT(aa.attempt_id)::int AS attempts
       FROM group_members gm
       JOIN users u ON u.user_id = gm.student_id
       LEFT JOIN assessment_attempts aa ON aa.student_id = u.user_id AND aa.status = 'graded'
       WHERE gm.group_id = $1
       GROUP BY u.user_id, u.full_name ORDER BY u.full_name`,
      [groupId]
    );
    return rows;
  },

  async expiringSubscriptions(days = 30) {
    const { rows } = await query(
      `SELECT i.institution_id, i.name, s.plan, s.expires_at
       FROM institution_subscriptions s JOIN institutions i ON i.institution_id = s.institution_id
       WHERE s.expires_at <= now() + ($1 || ' days')::interval AND s.status IN ('active','trial','expiring')
       ORDER BY s.expires_at`,
      [days]
    );
    return rows;
  },

  async studentReadiness(studentId) {
    const [{ rows: progress }, { rows: simulations }, { rows: assignments }, { rows: clinical }] = await Promise.all([
      query(
        `SELECT COALESCE(AVG(score_pct),0)::numeric(5,2) AS exam_readiness
         FROM student_performance
         WHERE student_id = $1`,
        [studentId]
      ),
      query(
        `SELECT COALESCE(AVG(score),0)::numeric(5,2) AS simulation_score
         FROM simulation_attempts
         WHERE student_id = $1`,
        [studentId]
      ).catch(() => ({ rows: [{ simulation_score: 0 }] })),
      query(
        `SELECT COUNT(*) FILTER (WHERE status = 'graded')::int AS graded_assignments,
                COALESCE(AVG(score_pct),0)::numeric(5,2) AS assignment_score
         FROM assignment_submissions
         WHERE student_id = $1`,
        [studentId]
      ).catch(() => ({ rows: [{ graded_assignments: 0, assignment_score: 0 }] })),
      query(
        `SELECT COUNT(*) FILTER (WHERE status = 'approved')::int AS approved_skills,
                COALESCE(SUM(hours_completed),0)::numeric(6,2) AS completed_hours
         FROM clinical_activity_records
         WHERE student_id = $1`,
        [studentId]
      ).catch(() => ({ rows: [{ approved_skills: 0, completed_hours: 0 }] })),
    ]);

    return {
      examReadiness: progress[0]?.exam_readiness || 0,
      simulationScore: simulations[0]?.simulation_score || 0,
      assignmentPerformance: assignments[0] || { graded_assignments: 0, assignment_score: 0 },
      clinicalCompetency: clinical[0] || { approved_skills: 0, completed_hours: 0 },
    };
  },

  async teacherPerformance(teacherId) {
    const [{ rows: practicalVideos }, { rows: exams }, { rows: analytics }] = await Promise.all([
      query(
        `SELECT COUNT(*)::int AS assignments_created,
                COUNT(*) FILTER (WHERE status = 'published')::int AS published_assignments
         FROM practical_video_assignments
         WHERE teacher_id = $1`,
        [teacherId]
      ),
      query(
        `SELECT COUNT(*)::int AS exams_created,
                COALESCE(AVG(a.score),0)::numeric(5,2) AS average_exam_score
         FROM proctored_exams e
         LEFT JOIN proctored_exam_attempts a ON a.exam_id = e.exam_id
         WHERE e.teacher_id = $1`,
        [teacherId]
      ),
      query(
        `SELECT group_id, AVG(avg_score)::numeric(5,2) AS class_average
         FROM (
           SELECT gm.group_id, aa.student_id, AVG(aa.score_pct) AS avg_score
           FROM group_members gm
           JOIN assessment_attempts aa ON aa.student_id = gm.student_id
           GROUP BY gm.group_id, aa.student_id
         ) grouped
         GROUP BY group_id
         ORDER BY class_average DESC
         LIMIT 10`
      ),
    ]);

    return {
      practicalVideos: practicalVideos[0] || { assignments_created: 0, published_assignments: 0 },
      exams: exams[0] || { exams_created: 0, average_exam_score: 0 },
      classPerformance: analytics,
    };
  },

  async institutionAnalytics(institutionId) {
    const [{ rows: users }, { rows: exams }, { rows: rotations }, { rows: activity }] = await Promise.all([
      query(
        `SELECT role, COUNT(*)::int AS total
         FROM users
         WHERE institution_id = $1
         GROUP BY role`,
        [institutionId]
      ),
      query(
        `SELECT COUNT(*)::int AS exams,
                COALESCE(AVG(a.score),0)::numeric(5,2) AS average_score
         FROM proctored_exams e
         LEFT JOIN proctored_exam_attempts a ON a.exam_id = e.exam_id
         WHERE e.institution_id = $1`,
        [institutionId]
      ),
      query(
        `SELECT COUNT(*)::int AS rotations,
                COUNT(*) FILTER (WHERE status = 'scheduled')::int AS scheduled
         FROM clinical_rotations
         WHERE institution_id = $1`,
        [institutionId]
      ),
      query(
        `SELECT COUNT(*)::int AS clinical_entries,
                COUNT(*) FILTER (WHERE status = 'approved')::int AS approved_entries
         FROM clinical_activity_records car
         JOIN clinical_rotation_assignments cra ON cra.assignment_id = car.rotation_assignment_id
         JOIN clinical_rotations r ON r.rotation_id = cra.rotation_id
         WHERE r.institution_id = $1`,
        [institutionId]
      ),
    ]);

    return {
      users,
      exams: exams[0] || { exams: 0, average_score: 0 },
      rotations: rotations[0] || { rotations: 0, scheduled: 0 },
      activity: activity[0] || { clinical_entries: 0, approved_entries: 0 },
    };
  },

  async platformMetrics() {
    const [{ rows: growth }, { rows: revenue }, { rows: institutions }] = await Promise.all([
      query(
        `SELECT date_trunc('month', created_at) AS month, COUNT(*)::int AS users
         FROM users
         WHERE created_at >= now() - interval '12 months'
         GROUP BY 1
         ORDER BY 1`
      ),
      query(
        `SELECT COALESCE(SUM(amount),0) AS total_revenue, COUNT(*)::int AS transactions
         FROM revenue_transactions
         WHERE status = 'completed'`
      ),
      query(
        `SELECT COUNT(*)::int AS institutions,
                COUNT(*) FILTER (WHERE status = 'active')::int AS active_institutions
         FROM institutions`
      ).catch(() => ({ rows: [{ institutions: 0, active_institutions: 0 }] })),
    ]);

    return {
      growth,
      revenue: revenue[0] || { total_revenue: 0, transactions: 0 },
      institutions: institutions[0] || { institutions: 0, active_institutions: 0 },
    };
  },
};
