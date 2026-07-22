import { query, withTransaction } from '../config/database.js';

export const AssignmentWorkflow = {
  async teacherGroups(teacherId, institutionId) {
    const { rows } = await query(
      `SELECT g.*, COUNT(gm.student_id)::int AS member_count
       FROM groups g
       LEFT JOIN group_members gm ON gm.group_id = g.group_id
       WHERE g.teacher_id = $1 AND g.institution_id = $2
       GROUP BY g.group_id
       ORDER BY g.created_at DESC`,
      [teacherId, institutionId]
    );
    return rows;
  },

  async validateTeacherGroup(teacherId, institutionId, groupId) {
    const { rows } = await query(
      `SELECT * FROM groups WHERE group_id = $1 AND teacher_id = $2 AND institution_id = $3`,
      [groupId, teacherId, institutionId]
    );
    return rows[0] || null;
  },

  async listQuestionBank({ institutionId, createdBy, program, module, topic, skill }) {
    const conditions = ['institution_id = $1'];
    const params = [institutionId];
    let i = 2;
    if (createdBy) { conditions.push(`created_by = $${i++}`); params.push(createdBy); }
    if (program) { conditions.push(`program = $${i++}`); params.push(program); }
    if (module) { conditions.push(`module = $${i++}`); params.push(module); }
    if (topic) { conditions.push(`topic = $${i++}`); params.push(topic); }
    if (skill) { conditions.push(`skill = $${i++}`); params.push(skill); }
    const { rows } = await query(
      `SELECT * FROM question_bank WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC`,
      params
    );
    return rows;
  },

  async addQuestionBankQuestion({ institutionId, createdBy, program, module, topic, skill, difficulty, questionType, prompt, options, correctAnswer, explanation, learningObjective, markingGuide }) {
    const { rows } = await query(
      `INSERT INTO question_bank
       (institution_id, created_by, program, module, topic, skill, difficulty, question_type, prompt, options, correct_answer, explanation, learning_objective, marking_guide)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING *`,
      [institutionId, createdBy, program, module, topic, skill, difficulty, questionType, prompt, options ? JSON.stringify(options) : null, correctAnswer || null, explanation || null, learningObjective || null, markingGuide || null]
    );
    return rows[0];
  },

  async updateQuestionBankQuestion(bankQuestionId, institutionId, fields) {
    const allowed = ['program', 'module', 'topic', 'skill', 'difficulty', 'question_type', 'prompt', 'options', 'correct_answer', 'explanation', 'learning_objective', 'marking_guide'];
    const sets = [];
    const params = [];
    let i = 1;
    for (const [key, value] of Object.entries(fields)) {
      if (allowed.includes(key) && value !== undefined) {
        sets.push(`${key} = $${i++}`);
        params.push(key === 'options' && value ? JSON.stringify(value) : value);
      }
    }
    if (!sets.length) return null;
    params.push(bankQuestionId, institutionId);
    const { rows } = await query(
      `UPDATE question_bank SET ${sets.join(', ')} WHERE bank_question_id = $${i++} AND institution_id = $${i} RETURNING *`,
      params
    );
    return rows[0] || null;
  },

  async createAssignment({ teacherId, institutionId, groupId, title, program, module, topic, skill, difficulty, assignmentType, numberOfQuestions, timeLimitMinutes, dueDate, instructions, aiGenerated }, questions) {
    return withTransaction(async (tx) => {
      const { rows: assignmentRows } = await tx.query(
        `INSERT INTO assignments
         (teacher_id, institution_id, group_id, title, program, module, topic, skill, difficulty, assignment_type, number_of_questions, time_limit_minutes, due_date, instructions, ai_generated, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'published')
         RETURNING *`,
        [teacherId, institutionId, groupId, title, program, module, topic, skill, difficulty, assignmentType, numberOfQuestions, timeLimitMinutes || null, dueDate || null, instructions || null, !!aiGenerated]
      );
      const assignment = assignmentRows[0];

      for (let index = 0; index < questions.length; index += 1) {
        const question = questions[index];
        await tx.query(
          `INSERT INTO assignment_questions
           (assignment_id, question_type, prompt, options, correct_answer, explanation, learning_objective, marking_guide, difficulty, points, position)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
          [
            assignment.assignment_id,
            question.questionType,
            question.prompt,
            question.options ? JSON.stringify(question.options) : null,
            question.correctAnswer || null,
            question.explanation || null,
            question.learningObjective || null,
            question.markingGuide || null,
            question.difficulty || difficulty || 'intermediate',
            question.points || 5,
            index,
          ]
        );
      }

      return assignment;
    });
  },

  async listTeacherAssignments(teacherId, institutionId) {
    const { rows } = await query(
      `SELECT a.*, g.name AS group_name,
              COUNT(DISTINCT s.submission_id)::int AS submission_count,
              COUNT(DISTINCT CASE WHEN s.status IN ('submitted', 'graded') THEN s.submission_id END)::int AS completed_count
       FROM assignments a
       JOIN groups g ON g.group_id = a.group_id
       LEFT JOIN assignment_submissions s ON s.assignment_id = a.assignment_id
       WHERE a.teacher_id = $1 AND a.institution_id = $2
       GROUP BY a.assignment_id, g.name
       ORDER BY a.created_at DESC`,
      [teacherId, institutionId]
    );
    return rows;
  },

  async findTeacherAssignment(assignmentId, teacherId, institutionId) {
    const { rows } = await query(
      `SELECT a.*, g.name AS group_name
       FROM assignments a
       JOIN groups g ON g.group_id = a.group_id
       WHERE a.assignment_id = $1 AND a.teacher_id = $2 AND a.institution_id = $3`,
      [assignmentId, teacherId, institutionId]
    );
    return rows[0] || null;
  },

  async assignmentQuestions(assignmentId) {
    const { rows } = await query(
      `SELECT * FROM assignment_questions WHERE assignment_id = $1 ORDER BY position`,
      [assignmentId]
    );
    return rows;
  },

  async listStudentAssignments(studentId, institutionId) {
    const { rows } = await query(
      `SELECT a.*, g.name AS group_name, s.submission_id, s.status AS submission_status, s.score_pct, s.released_at
       FROM assignments a
       JOIN groups g ON g.group_id = a.group_id
       JOIN group_members gm ON gm.group_id = a.group_id AND gm.student_id = $1
       LEFT JOIN assignment_submissions s ON s.assignment_id = a.assignment_id AND s.student_id = $1
       WHERE a.institution_id = $2 AND a.status = 'published'
       ORDER BY a.due_date ASC NULLS LAST, a.created_at DESC`,
      [studentId, institutionId]
    );
    return rows;
  },

  async findStudentAssignment(assignmentId, studentId, institutionId) {
    const { rows } = await query(
      `SELECT a.*, g.name AS group_name, s.submission_id, s.status AS submission_status, s.score_pct, s.released_at
       FROM assignments a
       JOIN groups g ON g.group_id = a.group_id
       JOIN group_members gm ON gm.group_id = a.group_id AND gm.student_id = $2
       LEFT JOIN assignment_submissions s ON s.assignment_id = a.assignment_id AND s.student_id = $2
       WHERE a.assignment_id = $1 AND a.institution_id = $3 AND a.status = 'published'`,
      [assignmentId, studentId, institutionId]
    );
    return rows[0] || null;
  },

  async ensureSubmission(assignmentId, studentId) {
    const { rows: existing } = await query(
      `SELECT * FROM assignment_submissions WHERE assignment_id = $1 AND student_id = $2 LIMIT 1`,
      [assignmentId, studentId]
    );
    if (existing[0]) return existing[0];
    const { rows } = await query(
      `INSERT INTO assignment_submissions (assignment_id, student_id) VALUES ($1,$2) RETURNING *`,
      [assignmentId, studentId]
    );
    return rows[0];
  },

  async clearSubmissionAnswers(submissionId) {
    await query(`DELETE FROM assignment_answers WHERE submission_id = $1`, [submissionId]);
  },

  async recordSubmissionAnswer({ submissionId, assignmentQuestionId, response, isCorrect, pointsAwarded, feedback = null }) {
    const { rows } = await query(
      `INSERT INTO assignment_answers (submission_id, assignment_question_id, response, is_correct, points_awarded, feedback)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [submissionId, assignmentQuestionId, response || null, isCorrect, pointsAwarded || 0, feedback]
    );
    return rows[0];
  },

  async markSubmitted(submissionId, { scorePct, pointsAwarded }) {
    const { rows } = await query(
      `UPDATE assignment_submissions
       SET status = 'submitted', score_pct = $1, points_awarded = $2, submitted_at = now()
       WHERE submission_id = $3 RETURNING *`,
      [scorePct, pointsAwarded, submissionId]
    );
    return rows[0];
  },

  async listTeacherSubmissions(teacherId, institutionId) {
    const { rows } = await query(
      `SELECT s.*, a.title, a.program, a.module, a.topic, a.skill, a.assignment_type, g.name AS group_name,
              u.full_name, u.email
       FROM assignment_submissions s
       JOIN assignments a ON a.assignment_id = s.assignment_id
       JOIN groups g ON g.group_id = a.group_id
       JOIN users u ON u.user_id = s.student_id
       WHERE a.teacher_id = $1 AND a.institution_id = $2
       ORDER BY s.submitted_at DESC NULLS LAST, s.started_at DESC`,
      [teacherId, institutionId]
    );
    return rows;
  },

  async findTeacherSubmission(submissionId, teacherId, institutionId) {
    const { rows } = await query(
      `SELECT s.*, a.title, a.program, a.module, a.topic, a.skill, a.assignment_type, a.group_id,
              u.full_name, u.email
       FROM assignment_submissions s
       JOIN assignments a ON a.assignment_id = s.assignment_id
       JOIN users u ON u.user_id = s.student_id
       WHERE s.submission_id = $1 AND a.teacher_id = $2 AND a.institution_id = $3`,
      [submissionId, teacherId, institutionId]
    );
    return rows[0] || null;
  },

  async submissionAnswers(submissionId) {
    const { rows } = await query(
      `SELECT aa.*, q.prompt, q.correct_answer, q.explanation, q.learning_objective, q.marking_guide, q.points AS max_points, q.question_type
       FROM assignment_answers aa
       JOIN assignment_questions q ON q.assignment_question_id = aa.assignment_question_id
       WHERE aa.submission_id = $1
       ORDER BY q.position`,
      [submissionId]
    );
    return rows;
  },

  async finalizeSubmission(submissionId, { scorePct, pointsAwarded, teacherComments, release }) {
    const { rows } = await query(
      `UPDATE assignment_submissions
       SET status = 'graded',
           score_pct = $1,
           points_awarded = $2,
           teacher_comments = $3,
           graded_at = now(),
           released_at = CASE WHEN $4 THEN now() ELSE released_at END
       WHERE submission_id = $5 RETURNING *`,
      [scorePct, pointsAwarded, teacherComments || null, !!release, submissionId]
    );
    return rows[0];
  },

  async updateAnswerGrade(answerId, submissionId, { pointsAwarded, feedback }) {
    const { rows } = await query(
      `UPDATE assignment_answers
       SET points_awarded = $1, feedback = $2
       WHERE assignment_answer_id = $3 AND submission_id = $4 RETURNING *`,
      [pointsAwarded, feedback || null, answerId, submissionId]
    );
    return rows[0] || null;
  },

  async upsertFeedback(submissionId, { aiSuggestedScore, aiReasoning, aiFeedback, weakTopics, recommendedCards, recommendedSimulations, teacherComments, releasedBy, release }) {
    const { rows } = await query(
      `INSERT INTO grading_feedback
       (submission_id, ai_suggested_score, ai_reasoning, ai_feedback, weak_topics, recommended_cards, recommended_simulations, teacher_comments, released_by, released_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,CASE WHEN $10 THEN now() ELSE null END)
       ON CONFLICT (submission_id)
       DO UPDATE SET
         ai_suggested_score = EXCLUDED.ai_suggested_score,
         ai_reasoning = EXCLUDED.ai_reasoning,
         ai_feedback = EXCLUDED.ai_feedback,
         weak_topics = EXCLUDED.weak_topics,
         recommended_cards = EXCLUDED.recommended_cards,
         recommended_simulations = EXCLUDED.recommended_simulations,
         teacher_comments = EXCLUDED.teacher_comments,
         released_by = EXCLUDED.released_by,
         released_at = CASE WHEN $10 THEN now() ELSE grading_feedback.released_at END
       RETURNING *`,
      [submissionId, aiSuggestedScore, aiReasoning, aiFeedback, JSON.stringify(weakTopics || []), JSON.stringify(recommendedCards || []), JSON.stringify(recommendedSimulations || []), teacherComments || null, releasedBy || null, !!release]
    );
    return rows[0];
  },

  async logAiGeneration({ teacherId, institutionId, program, module, topic, skill, difficulty, questionType, numberOfQuestions, promptPayload, generatedPayload }) {
    await query(
      `INSERT INTO ai_generation_logs
       (teacher_id, institution_id, program, module, topic, skill, difficulty, question_type, number_of_questions, prompt_payload, generated_payload)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [teacherId, institutionId, program, module, topic, skill, difficulty, questionType, numberOfQuestions, JSON.stringify(promptPayload || {}), JSON.stringify(generatedPayload || [])]
    );
  },

  async recommendedCards({ program, topic, skill }) {
    const { rows } = await query(
      `SELECT clinical_card_id, title, module, topic, skill
       FROM clinical_reference_cards
       WHERE status = 'published' AND program = $1 AND (topic = $2 OR skill = $3)
       ORDER BY created_at DESC
       LIMIT 3`,
      [program, topic, skill]
    );
    return rows;
  },

  async studentPerformance(teacherId, institutionId) {
    const { rows } = await query(
      `SELECT u.user_id, u.full_name, g.name AS group_name,
              COUNT(s.submission_id)::int AS submissions,
              AVG(s.score_pct)::numeric(5,2) AS average_score
       FROM assignments a
       JOIN groups g ON g.group_id = a.group_id
       JOIN group_members gm ON gm.group_id = g.group_id
       JOIN users u ON u.user_id = gm.student_id
       LEFT JOIN assignment_submissions s ON s.assignment_id = a.assignment_id AND s.student_id = u.user_id AND s.status = 'graded'
       WHERE a.teacher_id = $1 AND a.institution_id = $2
       GROUP BY u.user_id, u.full_name, g.name
       ORDER BY u.full_name`,
      [teacherId, institutionId]
    );
    return rows;
  },
};
