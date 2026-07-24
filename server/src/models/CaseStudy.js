import { query, withTransaction } from '../config/database.js';

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

function resolveContentJson(row) {
  return row?.content || {};
}

function extractCompetencies(contentJson) {
  if (Array.isArray(contentJson?.learning_objectives?.competencies)) {
    return contentJson.learning_objectives.competencies;
  }
  if (Array.isArray(contentJson?.competencies)) {
    return contentJson.competencies;
  }
  return [];
}

function extractTotalPoints(contentJson) {
  if (Number.isFinite(Number(contentJson?.evaluation?.total_points))) {
    return Number(contentJson.evaluation.total_points);
  }
  const activities = Array.isArray(contentJson?.activities) ? contentJson.activities : [];
  return activities.reduce((sum, activity) => sum + Number(activity.points || 0), 0);
}

function buildContentSections(contentJson = {}) {
  const orderedKeys = [
    ['incident', 'Incident'],
    ['dispatch_information', 'Dispatch Information'],
    ['scene_assessment', 'Scene Assessment'],
    ['patient_information', 'Patient Information'],
    ['ems_response', 'EMS Response'],
    ['challenges', 'Challenges'],
    ['student_tasks', 'Student Tasks'],
    ['evaluation', 'Evaluation'],
    ['learning_objectives', 'Learning Objectives'],
  ];

  return orderedKeys
    .filter(([key]) => contentJson[key] != null)
    .map(([key, label]) => ({
      key,
      label,
      value: contentJson[key],
    }));
}

function phaseSortValue(label) {
  const match = String(label || '').match(/(\d+)/);
  if (match) return Number(match[1]);
  if (String(label || '').toLowerCase().includes('reflection')) return 99;
  if (String(label || '').toLowerCase().includes('analysis')) return 50;
  return 75;
}

function gradeKeywords(answerText, keywords) {
  const normalizedAnswer = normalizeText(answerText);
  const matchedKeywords = keywords.filter((keyword) => normalizedAnswer.includes(normalizeText(keyword)));
  const minimumMatches = requiredKeywordMatches(keywords);
  return {
    isCorrect: keywords.length > 0 && matchedKeywords.length >= minimumMatches,
    matchedKeywords,
  };
}

function gradeTableRows(responseRows, expectedRows) {
  let totalChecks = 0;
  let matchedChecks = 0;

  for (const row of expectedRows || []) {
    for (const [field, expectedValue] of Object.entries(row.expected || {})) {
      totalChecks += 1;
      const actualValue = String(responseRows?.[row.row_id]?.[field] || '').trim().toLowerCase();
      const normalizedExpected = String(expectedValue || '').trim().toLowerCase();
      if (actualValue && actualValue === normalizedExpected) matchedChecks += 1;
    }
  }

  const ratio = totalChecks > 0 ? matchedChecks / totalChecks : 0;
  return {
    isCorrect: totalChecks > 0 && matchedChecks === totalChecks,
    ratio,
    matchedChecks,
    totalChecks,
  };
}

function flattenResponseValue(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(flattenResponseValue).join(' ');
  if (typeof value === 'object') return Object.values(value).map(flattenResponseValue).join(' ');
  return String(value);
}

function groupActivitiesByPhase(activities) {
  const phaseMap = new Map();

  for (const activity of activities) {
    const phase = activity.phase || 'Case Activity';
    if (!phaseMap.has(phase)) {
      phaseMap.set(phase, {
        phase,
        activities: [],
      });
    }
    phaseMap.get(phase).activities.push(activity);
  }

  return [...phaseMap.values()].sort((left, right) => phaseSortValue(left.phase) - phaseSortValue(right.phase));
}

function gradeActivity(activity, response) {
  const points = Number(activity.points || 0);
  const baseReview = {
    activityId: activity.id,
    title: activity.title,
    phase: activity.phase,
    activityType: activity.type,
    points,
  };

  if (activity.type === 'multiple_choice') {
    const selected = String(response || '').trim().toUpperCase();
    const correct = String(activity.correct_answer?.option || '').trim().toUpperCase();
    const options = Array.isArray(activity.options) ? activity.options : [];
    const optionMap = options.reduce((acc, option) => {
      acc[String(option.key || '').toUpperCase()] = option.label || '';
      return acc;
    }, {});
    const isCorrect = selected && selected === correct;
    return {
      ...baseReview,
      isCorrect,
      earnedPoints: isCorrect ? points : 0,
      selectedAnswerText: optionMap[selected] || 'No answer selected',
      expectedAnswerText: optionMap[correct] || '',
      explanation: activity.evaluation_criteria || activity.explanation || '',
      responseSnapshot: response || null,
    };
  }

  if (activity.type === 'triage_table') {
    const responseRows = response?.rows || {};
    const expectedRows = Array.isArray(activity.correct_answer?.rows) ? activity.correct_answer.rows : [];
    if (expectedRows.length === 0) {
      const keywordReview = gradeKeywords(flattenResponseValue(responseRows), activity.correct_answer?.keywords || []);
      return {
        ...baseReview,
        isCorrect: keywordReview.isCorrect,
        earnedPoints: keywordReview.isCorrect ? points : 0,
        selectedAnswerText: flattenResponseValue(responseRows) || 'No triage response provided',
        expectedAnswerText: (activity.correct_answer?.keywords || []).join(', '),
        explanation: activity.evaluation_criteria || activity.explanation || '',
        matchedKeywords: keywordReview.matchedKeywords,
        responseSnapshot: response || { rows: {} },
      };
    }
    const graded = gradeTableRows(responseRows, expectedRows);
    return {
      ...baseReview,
      isCorrect: graded.isCorrect,
      earnedPoints: graded.isCorrect ? points : 0,
      selectedAnswerText: `${graded.matchedChecks}/${graded.totalChecks} table decisions matched`,
      expectedAnswerText: graded.totalChecks > 0 ? `${graded.totalChecks} scored table decisions expected` : '',
      explanation: activity.evaluation_criteria || activity.explanation || '',
      responseSnapshot: response || { rows: {} },
    };
  }

  const answerText = activity.type === 'response_form' || activity.type === 'reflection'
    ? flattenResponseValue(response || {})
    : String(response || '');
  const keywords = Array.isArray(activity.correct_answer?.keywords) ? activity.correct_answer.keywords : [];
  const graded = gradeKeywords(answerText, keywords);
  return {
    ...baseReview,
    isCorrect: graded.isCorrect,
    earnedPoints: graded.isCorrect ? points : 0,
    selectedAnswerText: answerText || 'No answer provided',
    expectedAnswerText: keywords.join(', '),
    explanation: activity.evaluation_criteria || activity.explanation || '',
    matchedKeywords: graded.matchedKeywords,
    responseSnapshot: response || null,
  };
}

function summarizeCompetencyPerformance(competencies, percentage) {
  return competencies.map((name) => ({
    name,
    score_pct: percentage,
  }));
}

export const CaseStudy = {
  async listForStudent(studentId) {
    const { rows } = await query(
      `WITH progress AS (
         SELECT
           scp.case_id,
           scp.status,
           scp.score,
           scp.completed_at
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
         cs.title,
         cs.location,
         cs.incident_date,
         cs.category,
         cs.difficulty,
         cs.description,
         cs.content,
         cs.order_number,
         cs.passing_percentage,
         COALESCE(progress.status, CASE WHEN cs.order_number = 1 THEN 'available' ELSE 'locked' END) AS status,
         COALESCE(progress.score, attempts.best_percentage, 0) AS score,
         COALESCE(attempts.attempt_count, 0) AS attempt_count,
         attempts.best_percentage,
         attempts.last_attempt_at
       FROM case_studies cs
       LEFT JOIN progress ON progress.case_id = cs.id
       LEFT JOIN attempts ON attempts.case_id = cs.id
       WHERE cs.is_active = true
       ORDER BY cs.order_number ASC`,
      [studentId]
    );

    return rows.map((row) => {
      const contentJson = resolveContentJson(row);
      return {
        ...row,
        content: contentJson,
        total_points: extractTotalPoints(contentJson),
        competencies: extractCompetencies(contentJson),
      };
    });
  },

  async findForStudent(studentId, caseId) {
    const { rows } = await query(
      `SELECT
         cs.id,
         cs.title,
         cs.location,
         cs.incident_date,
         cs.category,
         cs.difficulty,
         cs.description,
         cs.content,
         cs.order_number,
         cs.passing_percentage,
         COALESCE(progress.status, CASE WHEN cs.order_number = 1 THEN 'available' ELSE 'locked' END) AS status,
         COALESCE(progress.score, 0) AS score
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
    const contentJson = resolveContentJson(rows[0]);
    return {
      ...rows[0],
      content: contentJson,
      total_points: extractTotalPoints(contentJson),
      competencies: extractCompetencies(contentJson),
    };
  },

  async startPayload(studentId, caseId) {
    const studyCase = await this.findForStudent(studentId, caseId);
    if (!studyCase) return null;

    const activities = Array.isArray(studyCase.content?.activities)
      ? [...studyCase.content.activities].sort((left, right) => {
          const leftPhase = phaseSortValue(left.phase);
          const rightPhase = phaseSortValue(right.phase);
          if (leftPhase !== rightPhase) return leftPhase - rightPhase;
          return String(left.id).localeCompare(String(right.id));
        })
      : [];

    return {
      caseStudy: studyCase,
      sections: buildContentSections(studyCase.content),
      activities,
      phases: groupActivitiesByPhase(activities),
    };
  },

  async submitAttempt({ studentId, caseId, answers = {} }) {
    return withTransaction(async (db) => {
      const { rows: caseRows } = await db.query(
        `SELECT id, title, order_number, passing_percentage, content
         FROM case_studies
         WHERE id = $1
           AND is_active = true
         LIMIT 1`,
        [caseId]
      );
      const studyCase = caseRows[0];
      if (!studyCase) return null;

      const { rows: progressRows } = await db.query(
        `SELECT *
         FROM student_case_progress
         WHERE student_id = $1
           AND case_id = $2
         LIMIT 1`,
        [studentId, caseId]
      );
      const progress = progressRows[0];
      const status = progress?.status || (studyCase.order_number === 1 ? 'available' : 'locked');
      if (status === 'locked') {
        const error = new Error('This case is currently locked.');
        error.status = 403;
        throw error;
      }

      const contentJson = resolveContentJson(studyCase);
      const activities = Array.isArray(contentJson.activities)
        ? contentJson.activities.filter((activity) => Number(activity.points || 0) > 0)
        : [];

      const totalPoints = extractTotalPoints(contentJson);
      const gradedReview = activities.map((activity) => gradeActivity(activity, answers[activity.id]));
      const score = gradedReview.reduce((sum, item) => sum + Number(item.earnedPoints || 0), 0);
      const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
      const passed = percentage >= Number(studyCase.passing_percentage || 80);
      const now = new Date().toISOString();

      const { rows: attemptCountRows } = await db.query(
        `SELECT COUNT(*)::int AS total
         FROM student_case_attempts
         WHERE student_id = $1
           AND case_id = $2`,
        [studentId, caseId]
      );
      const attemptNumber = Number(attemptCountRows[0]?.total || 0) + 1;

      const { rows: insertedAttemptRows } = await db.query(
        `INSERT INTO student_case_attempts (
           student_id,
           case_id,
           score,
           percentage,
           passed,
           submitted_at,
           submitted_answers,
           review_payload
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb)
         RETURNING *`,
        [studentId, caseId, score, percentage, passed, now, JSON.stringify(answers || {}), JSON.stringify(gradedReview)]
      );
      const attempt = insertedAttemptRows[0];

      await db.query(
        `INSERT INTO student_case_progress (student_id, case_id, status, score, completed_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (student_id, case_id)
         DO UPDATE SET
           status = EXCLUDED.status,
           score = EXCLUDED.score,
           completed_at = EXCLUDED.completed_at`,
        [studentId, caseId, passed ? 'completed' : 'available', percentage, passed ? now : null]
      );

      const competencies = extractCompetencies(contentJson);
      for (const competency of summarizeCompetencyPerformance(competencies, percentage)) {
        await db.query(
          `INSERT INTO student_performance (student_id, item_type, item_id, domain, score_pct, completed_at)
           VALUES ($1, 'case_study', $2, $3, $4, $5)`,
          [studentId, caseId, competency.name, competency.score_pct, now]
        );
      }

      let nextCaseUnlocked = null;
      if (passed) {
        const { rows: nextCaseRows } = await db.query(
          `SELECT id, title
           FROM case_studies
           WHERE is_active = true
             AND order_number = $1
           LIMIT 1`,
          [Number(studyCase.order_number) + 1]
        );
        const nextCase = nextCaseRows[0];
        if (nextCase) {
          await db.query(
            `INSERT INTO student_case_progress (student_id, case_id, status)
             VALUES ($1, $2, 'available')
             ON CONFLICT (student_id, case_id)
             DO UPDATE SET status = CASE
               WHEN student_case_progress.status = 'completed' THEN student_case_progress.status
               ELSE 'available'
             END`,
            [studentId, nextCase.id]
          );
          nextCaseUnlocked = nextCase;
        }
      }

      const strengths = gradedReview.filter((item) => item.isCorrect).map((item) => item.title);
      const missedCompetencies = competencies.filter(
        (_competency, index) => !passed || index >= strengths.length
      );

      return {
        caseStudy: {
          id: studyCase.id,
          title: studyCase.title,
          order_number: studyCase.order_number,
          passing_percentage: Number(studyCase.passing_percentage || 80),
          competencies,
          sections: buildContentSections(contentJson),
        },
        attempt: {
          ...attempt,
          attempt_number: attemptNumber,
        },
        review: gradedReview,
        nextCaseUnlocked,
        strengths: [...new Set(strengths)],
        missedCompetencies: [...new Set(missedCompetencies)],
      };
    });
  },

  async attemptReview(studentId, attemptId) {
    const { rows } = await query(
      `SELECT
         sca.*,
         cs.title,
         cs.order_number,
         cs.passing_percentage,
         cs.content
       FROM student_case_attempts sca
       INNER JOIN case_studies cs ON cs.id = sca.case_id
       WHERE sca.id = $1
         AND sca.student_id = $2
       LIMIT 1`,
      [attemptId, studentId]
    );
    if (!rows[0]) return null;

    return {
      ...rows[0],
      content: resolveContentJson(rows[0]),
    };
  },
};
