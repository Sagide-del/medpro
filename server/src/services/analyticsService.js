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
};
