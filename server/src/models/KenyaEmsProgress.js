import { query, withTransaction } from '../config/database.js';
import { kenyaEmsCaseStudies } from '../data/kenyaEmsCaseStudyData.js';

// Kenya EMS architecture: all 15 cases are hard-coded (worksheet text, tables,
// question prompts, and the hidden grading keywords all live in
// ../data/kenyaEmsCaseStudyData.js on the backend, and as React components on
// the frontend). This model has NO dependency on the `case_studies` database
// table at all -- cases are addressed by case NUMBER (1-15), matched directly
// against the hard-coded array's `id` field. The database's only job here is
// to remember, per student: which case number, what score, and whether it's
// locked / available / completed. No case content is ever stored in the DB.

const TOTAL_CASES = kenyaEmsCaseStudies.length;

function findHardcodedCase(caseNumber) {
  return kenyaEmsCaseStudies.find((c) => c.id === Number(caseNumber)) || null;
}

async function findCaseData(caseNumber) {
  const n = Number(caseNumber);
  const { rows } = await query(
    `SELECT
       id,
       title,
       category,
       difficulty,
       location,
       incident_date,
       description,
       passing_percentage,
       content_json
     FROM case_studies
     WHERE order_number = $1
       AND is_active = true
     LIMIT 1`,
    [n]
  );
  const row = rows[0];
  const fallback = findHardcodedCase(n);
  if (!row && !fallback) return null;

  const sections = Array.isArray(row?.content_json?.sections)
    ? row.content_json.sections
    : Array.isArray(row?.content_json?.blocks)
      ? row.content_json.blocks
      : fallback?.sections || [];

  return {
    id: row?.id || fallback?.id || n,
    order_number: n,
    title: row?.title || fallback?.title || `Case ${n}`,
    category: row?.category || fallback?.category || null,
    difficulty: row?.difficulty || fallback?.difficulty || null,
    location: row?.location || fallback?.location || null,
    incidentDate: row?.incident_date || fallback?.incidentDate || null,
    description: row?.description || fallback?.description || null,
    passingScore: Number(row?.passing_percentage || fallback?.passingScore || 70),
    sections,
  };
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

function defaultStatus(caseNumber) {
  return caseNumber === 1 ? 'available' : 'locked';
}

export const KenyaEmsProgress = {
  async listForStudent(studentId) {
    const { rows } = await query(
      `SELECT case_number, status, score, attempt_count, completed_at
       FROM kenya_ems_case_progress
       WHERE student_id = $1`,
      [studentId]
    );
    const byNumber = new Map(rows.map((row) => [row.case_number, row]));

    const result = [];
    for (let caseNumber = 1; caseNumber <= TOTAL_CASES; caseNumber += 1) {
      const row = byNumber.get(caseNumber);
      const caseData = await findCaseData(caseNumber);
      result.push({
        case_number: caseNumber,
        title: caseData?.title || `Case ${caseNumber}`,
        category: caseData?.category || null,
        difficulty: caseData?.difficulty || null,
        location: caseData?.location || null,
        incident_date: caseData?.incidentDate || null,
        sections: caseData?.sections || [],
        passing_percentage: caseData?.passingScore ?? 70,
        status: row?.status || defaultStatus(caseNumber),
        score: row?.score || 0,
        attempt_count: row?.attempt_count || 0,
        completed_at: row?.completed_at || null,
      });
    }
    return result;
  },

  async getForStudent(studentId, caseNumber) {
    const n = Number(caseNumber);
    if (!Number.isInteger(n) || n < 1 || n > TOTAL_CASES) return null;
    const caseData = await findCaseData(n);
    if (!caseData) return null;

    const { rows } = await query(
      `SELECT status, score, attempt_count, completed_at
       FROM kenya_ems_case_progress
       WHERE student_id = $1 AND case_number = $2
       LIMIT 1`,
      [studentId, n]
    );
    const row = rows[0];

    return {
      case_number: n,
      title: caseData.title,
      category: caseData.category,
      difficulty: caseData.difficulty,
      location: caseData.location,
      incident_date: caseData.incidentDate,
      sections: caseData.sections || [],
      passing_percentage: caseData.passingScore,
      status: row?.status || defaultStatus(n),
      score: row?.score || 0,
      attempt_count: row?.attempt_count || 0,
      completed_at: row?.completed_at || null,
    };
  },

  async submitAttempt({ studentId, caseNumber, answers = {} }) {
    return withTransaction(async (db) => {
      const n = Number(caseNumber);
      if (!Number.isInteger(n) || n < 1 || n > TOTAL_CASES) return null;
      const caseData = await findCaseData(n);
      if (!caseData) return null;

      const { rows: existingRows } = await db.query(
        `SELECT * FROM kenya_ems_case_progress WHERE student_id = $1 AND case_number = $2 LIMIT 1`,
        [studentId, n]
      );
      const existing = existingRows[0];
      const currentStatus = existing?.status || defaultStatus(n);
      if (currentStatus === 'locked') {
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
      const attemptNumber = Number(existing?.attempt_count || 0) + 1;
      const alreadyCompleted = existing?.status === 'completed';
      const newStatus = passed || alreadyCompleted ? 'completed' : 'available';
      const bestScore = Math.max(percentage, Number(existing?.score || 0));

      await db.query(
        `INSERT INTO kenya_ems_case_progress (student_id, case_number, status, score, attempt_count, completed_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (student_id, case_number)
         DO UPDATE SET
           status = EXCLUDED.status,
           score = EXCLUDED.score,
           attempt_count = EXCLUDED.attempt_count,
           completed_at = COALESCE(EXCLUDED.completed_at, kenya_ems_case_progress.completed_at),
           updated_at = now()`,
        [studentId, n, newStatus, bestScore, attemptNumber, passed ? now : existing?.completed_at || null]
      );

      let nextCaseUnlocked = null;
      if (passed && n < TOTAL_CASES) {
        const nextNumber = n + 1;
        const { rows: nextRows } = await db.query(
          `SELECT status FROM kenya_ems_case_progress WHERE student_id = $1 AND case_number = $2 LIMIT 1`,
          [studentId, nextNumber]
        );
        const nextExisting = nextRows[0];
        if (!nextExisting) {
          await db.query(
            `INSERT INTO kenya_ems_case_progress (student_id, case_number, status, score, attempt_count)
             VALUES ($1, $2, 'available', 0, 0)
             ON CONFLICT (student_id, case_number) DO NOTHING`,
            [studentId, nextNumber]
          );
        } else if (nextExisting.status === 'locked') {
          await db.query(
            `UPDATE kenya_ems_case_progress SET status = 'available', updated_at = now()
             WHERE student_id = $1 AND case_number = $2`,
            [studentId, nextNumber]
          );
        }
        const nextCaseData = await findCaseData(nextNumber);
        nextCaseUnlocked = { case_number: nextNumber, title: nextCaseData?.title || `Case ${nextNumber}` };
      }

      const strengths = [...new Set(graded.filter((item) => item.isCorrect && item.criteria).map((item) => item.criteria))];
      const improvements = [...new Set(graded.filter((item) => !item.isCorrect && item.criteria).map((item) => item.criteria))];

      return {
        caseNumber: n,
        title: caseData.title,
        passingScore: caseData.passingScore,
        sections: caseData.sections || [],
        attempt: {
          score,
          percentage,
          passed,
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
};
