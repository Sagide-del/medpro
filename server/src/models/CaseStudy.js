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

function phaseSortValue(label) {
  const match = String(label || '').match(/(\d+)/);
  if (match) return Number(match[1]);
  if (String(label || '').toLowerCase().includes('reflection')) return 99;
  if (String(label || '').toLowerCase().includes('analysis')) return 50;
  return 75;
}

function sortedActivities(contentJson) {
  const activities = Array.isArray(contentJson?.activities) ? [...contentJson.activities] : [];
  return activities.sort((left, right) => {
    const leftPhase = phaseSortValue(left.phase);
    const rightPhase = phaseSortValue(right.phase);
    if (leftPhase !== rightPhase) return leftPhase - rightPhase;
    return String(left.id).localeCompare(String(right.id));
  });
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

function splitPrompt(prompt) {
  const promptText = String(prompt || '');
  const marker = 'Your Response:';
  const markerIndex = promptText.indexOf(marker);
  if (markerIndex < 0) {
    return {
      question: promptText.trim(),
      responseTemplate: '',
    };
  }

  return {
    question: promptText.slice(0, markerIndex).trim(),
    responseTemplate: promptText.slice(markerIndex + marker.length).trim(),
  };
}

function normalizeFieldId(value, fallback) {
  const normalized = String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || fallback;
}

function extractFieldsFromTemplate(templateText) {
  const lines = String(templateText || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => line.toLowerCase() !== 'text');

  const fields = [];

  lines.forEach((line, index) => {
    if (/^_+$/.test(line)) return;
    const labeledBlank = line.match(/^(.+?):\s*_+$/);
    if (labeledBlank) {
      const label = labeledBlank[1].trim();
      fields.push({
        id: normalizeFieldId(label, `field-${index + 1}`),
        label,
        type: 'textarea',
      });
      return;
    }

    if (/^\d+\.\s/.test(line)) {
      fields.push({
        id: `reflection-${index + 1}`,
        label: line,
        type: 'textarea',
      });
      return;
    }

    if (line.endsWith('?')) {
      fields.push({
        id: `answer-${index + 1}`,
        label: line,
        type: 'textarea',
      });
    }
  });

  return fields;
}

function normalizeActivityFields(activity) {
  if (Array.isArray(activity?.fields) && activity.fields.length > 0) {
    return activity.fields.map((field, index) => ({
      id: field.id || `field-${index + 1}`,
      label: field.label || `Response ${index + 1}`,
      type: field.type || 'textarea',
      placeholder: field.placeholder || 'Enter your response',
    }));
  }

  const { responseTemplate } = splitPrompt(activity?.prompt || '');
  return extractFieldsFromTemplate(responseTemplate).map((field) => ({
    ...field,
    placeholder: 'Enter your response',
  }));
}

function responseBlockType(activity) {
  if (activity?.type === 'reflection') return 'reflection_block';
  return 'response_table';
}

function extractSourceText(contentJson) {
  if (typeof contentJson?.source_text === 'string' && contentJson.source_text.trim()) {
    return contentJson.source_text;
  }
  return '';
}

function isCaseTitle(line) {
  return /^CASE STUDY\s+\d+/i.test(line);
}

function isSectionHeading(line) {
  return /^(Incident Background|Incident Statistics:?|Patients observed:?|Patient observations:?|Evaluation Scoring|School Fire Context \(Kenya\)|FINAL REFLECTION|FINAL CERTIFICATION CHECK)$/i.test(line);
}

function isPartHeading(line) {
  return /^Part\s+\d+:/i.test(line);
}

function isActionHeading(line) {
  return line.includes('STUDENT ACTION REQUIRED');
}

function isTableLine(line) {
  return line.includes('\t');
}

function isQuestionLine(line) {
  return /^\d+\.\s/.test(line);
}

function isBoundaryLine(line) {
  return isCaseTitle(line)
    || isSectionHeading(line)
    || isPartHeading(line)
    || isActionHeading(line)
    || /^Passing Score:/i.test(line)
    || /^TOTAL\b/i.test(line)
    || /^📊/u.test(line)
    || /^📋/u.test(line);
}

function parseStatisticRows(lines) {
  return lines.map((line) => {
    const parts = String(line).split(/:\s+/);
    if (parts.length > 1) {
      return [parts.shift(), parts.join(': ')];
    }
    return [String(line)];
  });
}

function buildWorksheetBlocks(contentJson = {}) {
  const sourceText = extractSourceText(contentJson);
  const activities = sortedActivities(contentJson).filter((activity) => Number(activity.points || 0) > 0);
  const blocks = [];
  const lines = String(sourceText || '').split(/\r?\n/);

  let index = 0;
  let interactiveIndex = 0;
  let titleSeen = false;

  while (index < lines.length) {
    const rawLine = lines[index] || '';
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    if (isCaseTitle(trimmed)) {
      blocks.push({
        id: `block-title-${index}`,
        type: 'heading',
        level: 1,
        text: trimmed,
      });
      titleSeen = true;
      index += 1;
      continue;
    }

    if (titleSeen && !isBoundaryLine(trimmed) && !isTableLine(trimmed)) {
      blocks.push({
        id: `block-subtitle-${index}`,
        type: 'paragraph',
        variant: 'subtitle',
        text: trimmed,
      });
      titleSeen = false;
      index += 1;
      continue;
    }

    if (isActionHeading(trimmed)) {
      blocks.push({
        id: `block-instruction-${index}`,
        type: 'instruction_block',
        text: trimmed.replace(/^ð[^A-Z]*/i, '').trim(),
      });
      index += 1;
      continue;
    }

    if (isPartHeading(trimmed) || isSectionHeading(trimmed)) {
      const level = isPartHeading(trimmed) ? 2 : 3;
      blocks.push({
        id: `block-heading-${index}`,
        type: 'heading',
        level,
        text: trimmed,
      });
      index += 1;

      if (/^Incident Statistics:?$/i.test(trimmed)) {
        const statisticLines = [];
        while (index < lines.length) {
          const statisticLine = String(lines[index] || '').trim();
          if (!statisticLine) {
            index += 1;
            break;
          }
          if (isBoundaryLine(statisticLine) || isTableLine(statisticLine)) break;
          statisticLines.push(statisticLine);
          index += 1;
        }

        if (statisticLines.length > 0) {
          blocks.push({
            id: `block-statistics-${index}`,
            type: 'statistics_table',
            headers: ['Metric', 'Detail'],
            rows: parseStatisticRows(statisticLines),
          });
        }
      }
      continue;
    }

    if (/dispatch message/i.test(trimmed)) {
      blocks.push({
        id: `block-paragraph-${index}`,
        type: 'paragraph',
        text: trimmed,
      });
      index += 1;

      const infoLines = [];
      while (index < lines.length) {
        const nextLine = String(lines[index] || '').trim();
        if (!nextLine) {
          index += 1;
          if (infoLines.length > 0) break;
          continue;
        }
        if (isBoundaryLine(nextLine) || isTableLine(nextLine) || isQuestionLine(nextLine)) break;
        infoLines.push(nextLine);
        index += 1;
      }

      if (infoLines.length > 0) {
        blocks.push({
          id: `block-info-${index}`,
          type: 'information_box',
          text: infoLines.join('\n\n'),
        });
      }
      continue;
    }

    if (isTableLine(trimmed)) {
      const tableLines = [];
      while (index < lines.length && isTableLine(String(lines[index] || '').trim())) {
        tableLines.push(String(lines[index] || '').trim());
        index += 1;
      }
      const rows = tableLines.map((entry) => entry.split('\t').map((cell) => cell.trim()));
      const [headers, ...body] = rows;
      const type = headers[0] === 'Patient' ? 'patient_table' : 'statistics_table';
      blocks.push({
        id: `block-table-${index}`,
        type,
        headers,
        rows: body,
      });
      continue;
    }

    if (/^Your Response:/i.test(trimmed)) {
      const activity = activities[interactiveIndex] || null;
      if (activity) interactiveIndex += 1;

      const fields = normalizeActivityFields(activity);
      const { responseTemplate } = splitPrompt(activity?.prompt || '');
      blocks.push({
        id: `block-response-${activity?.id || index}`,
        type: responseBlockType(activity),
        activityId: activity?.id || `activity-${index}`,
        title: activity?.title || '',
        fields,
        options: Array.isArray(activity?.options) ? activity.options : [],
        input_type: activity?.type === 'multiple_choice' ? 'multiple_choice' : 'text',
        template: responseTemplate,
        grading: {
          points: Number(activity?.points || 0),
          criteria: activity?.evaluation_criteria || activity?.criteria || activity?.explanation || '',
        },
      });

      index += 1;
      if (String(lines[index] || '').trim().toLowerCase() === 'text') index += 1;
      while (index < lines.length) {
        const nextTrimmed = String(lines[index] || '').trim();
        if (!nextTrimmed) {
          index += 1;
          continue;
        }
        if (isBoundaryLine(nextTrimmed) || isTableLine(nextTrimmed) || isQuestionLine(nextTrimmed)) break;
        index += 1;
      }
      continue;
    }

    if (isQuestionLine(trimmed)) {
      const questionLines = [trimmed];
      index += 1;
      while (index < lines.length) {
        const nextTrimmed = String(lines[index] || '').trim();
        if (!nextTrimmed) {
          index += 1;
          break;
        }
        if (isBoundaryLine(nextTrimmed) || isTableLine(nextTrimmed) || /^Your Response:/i.test(nextTrimmed)) break;
        questionLines.push(nextTrimmed);
        index += 1;
      }

      blocks.push({
        id: `block-question-${index}`,
        type: 'question_block',
        text: questionLines.join('\n\n'),
      });
      continue;
    }

    blocks.push({
      id: `block-paragraph-${index}`,
      type: 'paragraph',
      text: trimmed,
    });
    index += 1;
  }

  return blocks;
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

    return {
      caseStudy: studyCase,
      blocks: buildWorksheetBlocks(studyCase.content),
      responses: studyCase.responses || {},
    };
  },

  async saveProgress({ studentId, caseId, responses = {} }) {
    return withTransaction(async (db) => {
      const { rows: caseRows } = await db.query(
        `SELECT id, order_number, is_active
         FROM case_studies
         WHERE id = $1
         LIMIT 1`,
        [caseId]
      );
      const studyCase = caseRows[0];
      if (!studyCase || !studyCase.is_active) return null;

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

      const now = new Date().toISOString();
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
      const activities = sortedActivities(contentJson).filter((activity) => Number(activity.points || 0) > 0);

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
            `INSERT INTO student_case_progress (student_id, case_id, status, responses)
             VALUES ($1, $2, 'available', '{}'::jsonb)
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
