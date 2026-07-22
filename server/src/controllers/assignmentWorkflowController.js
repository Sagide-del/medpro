import { AssignmentWorkflow } from '../models/AssignmentWorkflow.js';
import { generateAssignmentQuestions, suggestShortAnswerGrade } from '../services/assignmentAiService.js';
import { asyncHandler } from '../utils/helpers.js';
import { query } from '../config/database.js';

function normalizeType(type) {
  const map = {
    'Multiple Choice': 'Multiple Choice',
    'Scenario Based': 'Scenario Based',
    'Short Answer': 'Short Answer',
    'Practical Knowledge': 'Practical Knowledge',
  };
  return map[type] || 'Multiple Choice';
}

function scoreMcq(question, response) {
  const correct = String(question.correct_answer || '').trim().toLowerCase();
  const answer = String(response || '').trim().toLowerCase();
  const isCorrect = !!correct && correct === answer;
  return { isCorrect, pointsAwarded: isCorrect ? Number(question.points || 0) : 0 };
}

export const listTeacherGroups = asyncHandler(async (req, res) => {
  const groups = await AssignmentWorkflow.teacherGroups(req.user.sub, req.user.institutionId);
  res.json({ groups });
});

export const listQuestionBank = asyncHandler(async (req, res) => {
  const questions = await AssignmentWorkflow.listQuestionBank({
    institutionId: req.user.institutionId,
    program: req.query.program,
    module: req.query.module,
    topic: req.query.topic,
    skill: req.query.skill,
  });
  res.json({ questions });
});

export const createQuestionBankQuestion = asyncHandler(async (req, res) => {
  const question = await AssignmentWorkflow.addQuestionBankQuestion({
    institutionId: req.user.institutionId,
    createdBy: req.user.sub,
    program: req.body.program,
    module: req.body.module,
    topic: req.body.topic,
    skill: req.body.skill,
    difficulty: req.body.difficulty,
    questionType: req.body.questionType,
    prompt: req.body.prompt,
    options: req.body.options,
    correctAnswer: req.body.correctAnswer,
    explanation: req.body.explanation,
    learningObjective: req.body.learningObjective,
    markingGuide: req.body.markingGuide,
  });
  res.status(201).json({ question });
});

export const updateQuestionBankQuestion = asyncHandler(async (req, res) => {
  const question = await AssignmentWorkflow.updateQuestionBankQuestion(req.params.id, req.user.institutionId, {
    program: req.body.program,
    module: req.body.module,
    topic: req.body.topic,
    skill: req.body.skill,
    difficulty: req.body.difficulty,
    question_type: req.body.questionType,
    prompt: req.body.prompt,
    options: req.body.options,
    correct_answer: req.body.correctAnswer,
    explanation: req.body.explanation,
    learning_objective: req.body.learningObjective,
    marking_guide: req.body.markingGuide,
  });
  if (!question) return res.status(404).json({ error: 'Question not found.' });
  res.json({ question });
});

export const generateAiAssignment = asyncHandler(async (req, res) => {
  const questionType = normalizeType(req.body.questionType);
  const questions = generateAssignmentQuestions({
    program: req.body.program,
    module: req.body.module,
    topic: req.body.topic,
    skill: req.body.skill,
    difficulty: req.body.difficulty,
    questionType,
    numberOfQuestions: req.body.numberOfQuestions,
  });

  await AssignmentWorkflow.logAiGeneration({
    teacherId: req.user.sub,
    institutionId: req.user.institutionId,
    program: req.body.program,
    module: req.body.module,
    topic: req.body.topic,
    skill: req.body.skill,
    difficulty: req.body.difficulty,
    questionType,
    numberOfQuestions: req.body.numberOfQuestions,
    promptPayload: req.body,
    generatedPayload: questions,
  });

  res.json({ questions });
});

export const createAssignment = asyncHandler(async (req, res) => {
  const group = await AssignmentWorkflow.validateTeacherGroup(req.user.sub, req.user.institutionId, req.body.groupId);
  if (!group) return res.status(403).json({ error: 'You can only assign work to your own class groups.' });

  const assignment = await AssignmentWorkflow.createAssignment({
    teacherId: req.user.sub,
    institutionId: req.user.institutionId,
    groupId: req.body.groupId,
    title: req.body.title,
    program: req.body.program,
    module: req.body.module,
    topic: req.body.topic,
    skill: req.body.skill,
    difficulty: req.body.difficulty,
    assignmentType: normalizeType(req.body.assignmentType),
    numberOfQuestions: req.body.numberOfQuestions,
    timeLimitMinutes: req.body.timeLimitMinutes,
    dueDate: req.body.dueDate,
    instructions: req.body.instructions,
    aiGenerated: !!req.body.aiGenerated,
  }, req.body.questions || []);

  res.status(201).json({ assignment });
});

export const listTeacherAssignments = asyncHandler(async (req, res) => {
  const assignments = await AssignmentWorkflow.listTeacherAssignments(req.user.sub, req.user.institutionId);
  res.json({ assignments });
});

export const getTeacherAssignment = asyncHandler(async (req, res) => {
  const assignment = await AssignmentWorkflow.findTeacherAssignment(req.params.id, req.user.sub, req.user.institutionId);
  if (!assignment) return res.status(404).json({ error: 'Assignment not found.' });
  const questions = await AssignmentWorkflow.assignmentQuestions(req.params.id);
  res.json({ assignment, questions });
});

export const listStudentAssignments = asyncHandler(async (req, res) => {
  const assignments = await AssignmentWorkflow.listStudentAssignments(req.user.sub, req.user.institutionId);
  res.json({ assignments });
});

export const getStudentAssignment = asyncHandler(async (req, res) => {
  const assignment = await AssignmentWorkflow.findStudentAssignment(req.params.id, req.user.sub, req.user.institutionId);
  if (!assignment) return res.status(404).json({ error: 'Assignment not found.' });
  const questions = await AssignmentWorkflow.assignmentQuestions(req.params.id);
  const safeQuestions = questions.map(({ correct_answer, explanation, marking_guide, ...rest }) => rest);
  res.json({ assignment, questions: safeQuestions });
});

export const startStudentAssignment = asyncHandler(async (req, res) => {
  const assignment = await AssignmentWorkflow.findStudentAssignment(req.params.id, req.user.sub, req.user.institutionId);
  if (!assignment) return res.status(404).json({ error: 'Assignment not found.' });
  const submission = await AssignmentWorkflow.ensureSubmission(req.params.id, req.user.sub);
  res.status(201).json({ submission });
});

export const submitStudentAssignment = asyncHandler(async (req, res) => {
  const assignment = await AssignmentWorkflow.findStudentAssignment(req.params.id, req.user.sub, req.user.institutionId);
  if (!assignment) return res.status(404).json({ error: 'Assignment not found.' });

  const submission = await AssignmentWorkflow.ensureSubmission(req.params.id, req.user.sub);
  const questions = await AssignmentWorkflow.assignmentQuestions(req.params.id);
  const answersByQuestion = new Map((req.body.answers || []).map((answer) => [answer.assignmentQuestionId, answer.response]));

  await AssignmentWorkflow.clearSubmissionAnswers(submission.submission_id);

  let pointsAwarded = 0;
  let totalPoints = 0;
  for (const question of questions) {
    const response = answersByQuestion.get(question.assignment_question_id) || '';
    totalPoints += Number(question.points || 0);
    if (question.question_type === 'mcq') {
      const result = scoreMcq(question, response);
      pointsAwarded += result.pointsAwarded;
      await AssignmentWorkflow.recordSubmissionAnswer({
        submissionId: submission.submission_id,
        assignmentQuestionId: question.assignment_question_id,
        response,
        isCorrect: result.isCorrect,
        pointsAwarded: result.pointsAwarded,
      });
    } else {
      await AssignmentWorkflow.recordSubmissionAnswer({
        submissionId: submission.submission_id,
        assignmentQuestionId: question.assignment_question_id,
        response,
        isCorrect: null,
        pointsAwarded: 0,
      });
    }
  }

  const scorePct = totalPoints ? Number(((pointsAwarded / totalPoints) * 100).toFixed(2)) : 0;
  const saved = await AssignmentWorkflow.markSubmitted(submission.submission_id, { scorePct, pointsAwarded });
  res.json({ submission: saved });
});

export const listTeacherSubmissions = asyncHandler(async (req, res) => {
  const submissions = await AssignmentWorkflow.listTeacherSubmissions(req.user.sub, req.user.institutionId);
  res.json({ submissions });
});

export const getTeacherSubmission = asyncHandler(async (req, res) => {
  const submission = await AssignmentWorkflow.findTeacherSubmission(req.params.id, req.user.sub, req.user.institutionId);
  if (!submission) return res.status(404).json({ error: 'Submission not found.' });
  const answers = await AssignmentWorkflow.submissionAnswers(req.params.id);
  const suggestions = answers.map((answer) => (
    answer.question_type === 'mcq'
      ? null
      : suggestShortAnswerGrade({
          prompt: answer.prompt,
          correctAnswer: answer.correct_answer,
          studentAnswer: answer.response,
          maxPoints: answer.max_points,
          topic: submission.topic,
          skill: submission.skill,
        })
  ));
  res.json({ submission, answers, suggestions });
});

export const gradeTeacherSubmission = asyncHandler(async (req, res) => {
  const submission = await AssignmentWorkflow.findTeacherSubmission(req.params.id, req.user.sub, req.user.institutionId);
  if (!submission) return res.status(404).json({ error: 'Submission not found.' });

  const answers = await AssignmentWorkflow.submissionAnswers(req.params.id);
  const updates = req.body.answers || [];

  for (const update of updates) {
    await AssignmentWorkflow.updateAnswerGrade(update.assignmentAnswerId, req.params.id, {
      pointsAwarded: Number(update.pointsAwarded || 0),
      feedback: update.feedback,
    });
  }

  const refreshedAnswers = await AssignmentWorkflow.submissionAnswers(req.params.id);
  const totalPoints = refreshedAnswers.reduce((sum, answer) => sum + Number(answer.max_points || 0), 0);
  const pointsAwarded = refreshedAnswers.reduce((sum, answer) => sum + Number(answer.points_awarded || 0), 0);
  const scorePct = totalPoints ? Number(((pointsAwarded / totalPoints) * 100).toFixed(2)) : 0;

  const weakTopics = scorePct < 70 ? [submission.topic] : [];
  const recommendedCards = await AssignmentWorkflow.recommendedCards({
    program: submission.program,
    topic: submission.topic,
    skill: submission.skill,
  });
  const recommendedSimulations = scorePct < 70 ? [`Review a ${submission.skill} skill simulation.`] : [];

  const manualSuggestions = refreshedAnswers
    .filter((answer) => answer.question_type !== 'mcq')
    .map((answer) => suggestShortAnswerGrade({
      prompt: answer.prompt,
      correctAnswer: answer.correct_answer,
      studentAnswer: answer.response,
      maxPoints: answer.max_points,
      topic: submission.topic,
      skill: submission.skill,
    }));
  const aiSuggestedScore = manualSuggestions.length
    ? Number((manualSuggestions.reduce((sum, suggestion) => sum + suggestion.scorePct, 0) / manualSuggestions.length).toFixed(2))
    : scorePct;
  const aiReasoning = manualSuggestions.map((item) => item.reasoning).join('\n\n');
  const aiFeedback = manualSuggestions.map((item) => item.feedback).join('\n');

  const graded = await AssignmentWorkflow.finalizeSubmission(req.params.id, {
    scorePct,
    pointsAwarded,
    teacherComments: req.body.teacherComments,
    release: !!req.body.release,
  });

  await AssignmentWorkflow.upsertFeedback(req.params.id, {
    aiSuggestedScore,
    aiReasoning,
    aiFeedback,
    weakTopics,
    recommendedCards,
    recommendedSimulations,
    teacherComments: req.body.teacherComments,
    releasedBy: req.user.sub,
    release: !!req.body.release,
  });

  res.json({ submission: graded });
});

export const studentAssignmentResults = asyncHandler(async (req, res) => {
  const assignment = await AssignmentWorkflow.findStudentAssignment(req.params.id, req.user.sub, req.user.institutionId);
  if (!assignment) return res.status(404).json({ error: 'Assignment not found.' });
  const submission = await AssignmentWorkflow.ensureSubmission(req.params.id, req.user.sub);
  const answers = await AssignmentWorkflow.submissionAnswers(submission.submission_id);
  const { rows } = await query(`SELECT * FROM grading_feedback WHERE submission_id = $1`, [submission.submission_id]);
  const feedback = rows[0] || null;
  res.json({ assignment, submission, answers, feedback });
});

export const teacherStudentPerformance = asyncHandler(async (req, res) => {
  const performance = await AssignmentWorkflow.studentPerformance(req.user.sub, req.user.institutionId);
  res.json({ performance });
});
