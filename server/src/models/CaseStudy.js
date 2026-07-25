import { query, withTransaction } from '../config/database.js';
import { kenyaEmsCaseStudies } from '../data/kenyaEmsCaseStudyData.js';

// Kenya EMS case CONTENT (worksheet text, tables, question prompts, and the
// hidden grading keywords) is hard-coded in ../data/kenyaEmsCaseStudyData.js --
// nothing here reads case content/grading from the database. The database is
// still the system of record for STUDENT PROGRESS: case_studies keeps the
// stable id/order_number/is_active row every student_case_progress and
// student_case_attempts row references (foreign keys), and those two tables
// plus student_performance remain exactly how the rest of the app tracks
// unlocks, scores, and attempt history.

function findHardcodedCase(orderNumber) {
  return kenyaEmsCaseStudies.find((c) => c.id === Number(orderNumber)) || null;
}

function gradableSections(caseData) {
  return (caseData?.sections || []).filter((section) => section.type === 'response' || section.type === 'reflection');
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function requiredKeywordMatches(keywords) {
  const count = keywords?.length || 0;
  if (count <= 2) return count;
  return Math.max(2, Math.ceil(count * 0.4));
}

function flattenResponseValue(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(flattenResponseValue).join(' ');
  if (typeof value === 'object') {
    if (value.rows) return flattenResponseValue(Object.values(value.rows).map((row) => Object.values(row || {})));
    return Object.values(value).map(flattenResponseValue).join(' ');
  }
  return String(value);
}

function gradeKeywords(answerText, keywords) {
  const normalizedAnswer = normalizeText(answerText);
  const matchedKeywords = (keywords || []).filter((keyword) => normalizedAnswer.includes(normalizeText(keyword)));
  const minimumMatches = requiredKeywordMatches(keywords);
  return {
    isCorrect: (keywords?.length || 0) > 0 && matchedKeywords.length >= minimumMatches,
    matchedKeywords,
  };
}

function gradeSection(section, response) {
  const grading = section.grading || {};
  const points = Number(grading.points || 0);
  const answerText = flattenResponseValue(response);
  const keywords = Array.isArray(grading.keywords) ? grading.keywords : [];
  const graded = gradeKeywords(answerText, keywords);

  return {
    activityId: section.id,
    title: section.title || '',
    type: section.type,
    points,
    earnedPoints: graded.isCorrect ? points : 0,
    isCorrect: graded.isCorrect,
    criteria: grading.criteria || '',
    hasAnswer: answerText.trim().length > 0,
  };
}

function withHardcodedMeta(row) {
  const caseData = findHardcodedCase(row.order_number);
  return {
    ...row,
    title: caseData?.title || row.title,
    category: caseData?.category || null,
    difficulty: caseData?.difficulty || null,
    location: caseData?.location || null,
    incident_date: caseData?.incidentDate || null,
    description: caseData?.description || null,
    passing_percentage: caseData?.passingScore ?? row.passing_percentage,
  };
}

export const CaseStudy = {
  async listForStudent(studentId) {
    const { rows } = await query(
      `WITH progress AS (
         SELECT
           scp.case_id,
           scp.status,
           scp.score,
           scp.completed_at,
           scp.responses,
           scp.completed
         FROM student_case_progress scp
         WHERE scp.student_id = $1
       ),
       attempts AS (
         SELECT
           sca.case_id,
           COUNT(*)::int AS attempt_count,
           MAX(sca.percentage)::int AS best_percentage,
           MAX(sca.submitted_at) AS last_attempt_at
         FROM student_case_attempts sca
         WHERE sca.student_id = $1
         GROUP BY sca.case_id
       )
       SELECT
         cs.id,
         cs.order_number,
         cs.passing_percentage,
         COALESCE(progress.status, CASE WHEN cs.order_number = 1 THEN 'available' ELSE 'locked' END) AS status,
         COALESCE(progress.score, attempts.best_percentage, 0) AS score,
         COALESCE(attempts.attempt_count, 0) AS attempt_count,
         attempts.best_percentage,
         attempts.last_attempt_at,
         COALESCE(progress.responses, '{}'::jsonb) AS responses,
         progress.completed,
         progress.completed_at
       FROM case_studies cs
       WHERE cs.is_active = true
       ORDER BY cs.order_number ASC`,
      [studentId]
    );

    return rows.map(withHardcodedMeta);
  },

  async findForStudent(studentId, caseId) {
    const { rows } = await query(
      `SELECT
         cs.id,
         cs.order_number,
         cs.passing_percentage,
         COALESCE(progress.status, CASE WHEN cs.order_number = 1 THEN 'available' ELSE 'locked' END) AS status,
         COALESCE(progress.score, 0) AS score,
         COALESCE(progress.responses, '{}'::jsonb) AS responses,
         progress.completed_at
       FROM case_studies cs
       LEFT JOIN student_case_progress progress
         ON progress.case_id = cs.id
        AND progress.student_id = $1
       WHERE cs.id = $2
         AND cs.is_active = true
       LIMIT 1`,
      [studentId, caseId]
    );

    if (!rows[0]) return null;
    return withHardcodedMeta(rows[0]);
  },

  async startPayload(studentId, caseId) {
    const studyCase = await this.findForStudent(studentId, caseId);
    if (!studyCase) return null;

    return {
      caseStudy: studyCase,
      responses: studyCase.responses || {},
    };
  },

  async saveProgress({ studentId, caseId, responses = {} }) {
    return withTransaction(async (db) => {
      const { rows: caseRows } = await db.query(
        `SELECT id, order_number, is_active FROM case_studies WHERE id = $1 LIMIT 1`,
        [caseId]
      );
      const studyCase = caseRows[0];
      if (!studyCase || !studyCase.is_active) return null;

      const { rows: progressRows } = await db.query(
        `SELECT * FROM student_case_progress WHERE student_id = $1 AND case_id = $2 LIMIT 1`,
        [studentId, caseId]
      );
      const progress = progressRows[0];
      const status = progress?.status || (studyCase.order_number === 1 ? 'available' : 'locked');
      if (status === 'locked') {
        const error = new Error('This case is currently locked.');
        error.status = 403;
        throw error;
      }

      const { rows } = await db.query(
        `INSERT INTO student_case_progress (student_id, case_id, status, score, completed_at, responses)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb)
         ON CONFLICT (student_id, case_id)
         DO UPDATE SET
           status = student_case_progress.status,
           score = student_case_progress.score,
           completed_at = student_case_progress.completed_at,
           responses = EXCLUDED.responses
         RETURNING student_id, case_id, status, score, completed_at, responses`,
        [studentId, caseId, status, progress?.score || null, progress?.completed_at || null, JSON.stringify(responses || {})]
      );
      return rows[0];
    });
  },

  async submitAttempt({ studentId, caseId, answers = {} }) {
    return withTransaction(async (db) => {
      const { rows: caseRows } = await db.query(
        `SELECT id, order_number FROM case_studies WHERE id = $1 AND is_active = true LIMIT 1`,
        [caseId]
      );
      const studyCaseRow = caseRows[0];
      if (!studyCaseRow) return null;

      const caseData = findHardcodedCase(studyCaseRow.order_number);
      if (!caseData) return null;

      const { rows: progressRows } = await db.query(
        `SELECT * FROM student_case_progress WHERE student_id = $1 AND case_id = $2 LIMIT 1`,
        [studentId, caseId]
      );
      const progress = progressRows[0];
      const status = progress?.status || (studyCaseRow.order_number === 1 ? 'available' : 'locked');
      if (status === 'locked') {
        const error = new Error('This case is currently locked.');
        error.status = 403;
        throw error;
      }

      const gradable = gradableSections(caseData);
      const graded = gradable.map((section) => gradeSection(section, answers[section.id]));
      const totalPoints = graded.reduce((sum, item) => sum + item.points, 0);
      const score = graded.reduce((sum, item) => sum + item.earnedPoints, 0);
      // A case with no scored questions (a pure reading/briefing case) has
      // nothing to fail -- treat it as automatically complete.
      const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 100;
      const passed = percentage >= Number(caseData.passingScore || 70);
      const now = new Date().toISOString();

      const { rows: attemptCountRows } = await db.query(
        `SELECT COUNT(*)::int AS total FROM student_case_attempts WHERE student_id = $1 AND case_id = $2`,
        [studentId, caseId]
      );
      const attemptNumber = Number(attemptCountRows[0]?.total || 0) + 1;

      const { rows: insertedAttemptRows } = await db.query(
        `INSERT INTO student_case_attempts (
           student_id, case_id, score, percentage, passed, submitted_at, submitted_answers, review_payload
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb)
         RETURNING *`,
        [studentId, caseId, score, percentage, passed, now, JSON.stringify(answers || {}), JSON.stringify(graded)]
      );
      const attempt = insertedAttemptRows[0];

      await db.query(
        `INSERT INTO student_case_progress (student_id, case_id, status, score, completed_at, responses)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb)
         ON CONFLICT (student_id, case_id)
         DO UPDATE SET
           status = EXCLUDED.status,
           score = EXCLUDED.score,
           completed_at = EXCLUDED.completed_at,
           responses = EXCLUDED.responses`,
        [studentId, caseId, passed ? 'completed' : 'available', percentage, passed ? now : null, JSON.stringify(answers || {})]
      );

      for (const item of graded) {
        if (!item.criteria) continue;
        const itemPct = item.points > 0 ? Math.round((item.earnedPoints / item.points) * 100) : (item.isCorrect ? 100 : 0);
        await db.query(
          `INSERT INTO student_performance (student_id, item_type, item_id, domain, score_pct, completed_at)
           VALUES ($1, 'case_study', $2, $3, $4, $5)`,
          [studentId, caseId, item.criteria, itemPct, now]
        );
      }

      let nextCaseUnlocked = null;
      if (passed) {
        const { rows: nextCaseRows } = await db.query(
          `SELECT id, order_number FROM case_studies WHERE is_active = true AND order_number = $1 LIMIT 1`,
          [Number(studyCaseRow.order_number) + 1]
        );
        const nextRow = nextCaseRows[0];
        if (nextRow) {
          await db.query(
            `INSERT INTO student_case_progress (student_id, case_id, status, responses)
             VALUES ($1, $2, 'available', '{}'::jsonb)
             ON CONFLICT (student_id, case_id)
             DO UPDATE SET status = CASE
               WHEN student_case_progress.status = 'completed' THEN student_case_progress.status
               ELSE 'available'
             END`,
            [studentId, nextRow.id]
          );
          const nextData = findHardcodedCase(nextRow.order_number);
          nextCaseUnlocked = {
            id: nextRow.id,
            order_number: nextRow.order_number,
            title: nextData?.title || `Case ${nextRow.order_number}`,
          };
        }
      }

      const strengths = [...new Set(graded.filter((item) => item.isCorrect && item.criteria).map((item) => item.criteria))];
      const improvements = [...new Set(graded.filter((item) => !item.isCorrect && item.criteria).map((item) => item.criteria))];

      return {
        caseStudy: {
          id: studyCaseRow.id,
          order_number: studyCaseRow.order_number,
          title: caseData.title,
          passing_percentage: caseData.passingScore,
        },
        attempt: {
          ...attempt,
          attempt_number: attemptNumber,
        },
        review: graded,
        totalPoints,
        nextCaseUnlocked,
        strengths,
        improvements,
        missedCompetencies: improvements,
      };
    });
  },

  async attemptReview(studentId, attemptId) {
    const { rows } = await query(
      `SELECT
         sca.*,
         cs.order_number,
         cs.passing_percentage
       FROM student_case_attempts sca
       INNER JOIN case_studies cs ON cs.id = sca.case_id
       WHERE sca.id = $1
         AND sca.student_id = $2
       LIMIT 1`,
      [attemptId, studentId]
    );
    if (!rows[0]) return null;

    return withHardcodedMeta(rows[0]);
  },
};
