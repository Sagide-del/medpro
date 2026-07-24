import { Assessment } from '../models/Assessment.js';
import { Notification } from '../models/Notification.js';
import { gradeAnswers } from '../services/assessmentService.js';
import { resolveStudentSubscriptionAccess } from '../services/subscriptionAccess.js';
import { asyncHandler } from '../utils/helpers.js';

async function hasAssessmentAccess(user) {
  if (!user) return false;
  if (user.role !== 'student') return true;
  const subscription = await resolveStudentSubscriptionAccess(user);
  return subscription.allowed;
}

export const listAssessments = asyncHandler(async (req, res) => {
  const { type, status, groupId } = req.query;
  const filters = { type, groupId };
  if (['student', 'teacher'].includes(req.user?.role)) filters.status = 'published';
  else if (status) filters.status = status;
  else filters.status = undefined;
  const rows = await Assessment.list(filters);
  res.json({ assessments: rows });
});

export const getAssessment = asyncHandler(async (req, res) => {
  const assessment = await Assessment.findById(req.params.id);
  if (!assessment) return res.status(404).json({ error: 'Assessment not found.' });
  const unlocked = await hasAssessmentAccess(req.user);
  const questions = unlocked ? await Assessment.questions(assessment.assessment_id) : [];
  const safeQuestions = req.user?.role === 'student'
    ? questions.map(({ correct_answer, ...question }) => question)
    : questions;
  res.json({ assessment, questions: safeQuestions, unlocked });
});

export const createAssessment = asyncHandler(async (req, res) => {
  const { questions = [], ...rest } = req.body;
  if (!rest.title || !rest.type) return res.status(400).json({ error: 'Title and type are required.' });
  const assessment = await Assessment.create({ ...rest, createdBy: req.user.sub }, questions);
  res.status(201).json({ assessment });
});

export const publishAssessment = asyncHandler(async (req, res) => {
  const assessment = await Assessment.setStatus(req.params.id, 'published');
  res.json({ assessment });
});

export const deleteAssessment = asyncHandler(async (req, res) => {
  await Assessment.delete(req.params.id);
  res.status(204).end();
});

export const startAttempt = asyncHandler(async (req, res) => {
  if (!(await hasAssessmentAccess(req.user))) {
    const subscription = await resolveStudentSubscriptionAccess(req.user);
    return res.status(402).json({
      error: 'An active subscription is required to start this assessment.',
      code: 'SUBSCRIPTION_REQUIRED',
      subscription,
    });
  }

  const attempt = await Assessment.startAttempt(req.params.id, req.user.sub);
  res.status(201).json({ attempt });
});

export const submitAttempt = asyncHandler(async (req, res) => {
  const { attemptId } = req.params;
  const { answers = [] } = req.body;
  const attempt = await Assessment.findAttempt(attemptId);
  if (!attempt || attempt.student_id !== req.user.sub) {
    return res.status(404).json({ error: 'Attempt not found.' });
  }

  const questions = await Assessment.questions(attempt.assessment_id);
  const result = gradeAnswers(questions, answers);

  for (const answer of result.graded) {
    await Assessment.recordAnswer(attemptId, answer);
  }

  await Assessment.submitAttempt(attemptId);
  const graded = await Assessment.gradeAttempt(attemptId, {
    scorePct: result.scorePct,
    pointsAwarded: result.pointsAwarded,
  });

  await Notification.create({
    userId: req.user.sub,
    type: 'grade',
    title: 'Assessment submitted',
    message: `You scored ${result.scorePct}% ${result.needsManualReview ? '(scenario steps pending teacher review)' : ''}`,
  });

  res.json({ attempt: graded, needsManualReview: result.needsManualReview });
});

export const myAttempts = asyncHandler(async (req, res) => {
  const rows = await Assessment.attemptsForStudent(req.user.sub);
  res.json({ attempts: rows });
});

export const attemptsForAssessment = asyncHandler(async (req, res) => {
  const rows = await Assessment.attemptsForAssessment(req.params.id);
  res.json({ attempts: rows });
});

export const gradeManual = asyncHandler(async (req, res) => {
  const { attemptId } = req.params;
  const { scorePct, pointsAwarded, feedback } = req.body;
  const attempt = await Assessment.gradeAttempt(attemptId, { scorePct, pointsAwarded });
  const fresh = await Assessment.findAttempt(attemptId);

  await Notification.create({
    userId: fresh.student_id,
    type: 'grade',
    title: 'Assessment graded',
    message: feedback || `Your assessment has been graded: ${scorePct}%`,
  });

  res.json({ attempt });
});

export const listMcqModules = asyncHandler(async (req, res) => {
  const modules = await Assessment.listMcqModules(req.user.sub);
  const subscription = await resolveStudentSubscriptionAccess(req.user);
  res.json({ modules, subscription });
});

export const getMcqModuleQuestions = asyncHandler(async (req, res) => {
  if (!(await hasAssessmentAccess(req.user))) {
    const subscription = await resolveStudentSubscriptionAccess(req.user);
    return res.status(402).json({
      error: 'An active subscription is required to start this assessment.',
      code: 'SUBSCRIPTION_REQUIRED',
      subscription,
    });
  }

  const payload = await Assessment.randomizedMcqQuestions(req.user.sub, req.params.moduleId);
  if (!payload) return res.status(404).json({ error: 'Module not found.' });
  if (payload.module.status === 'locked') return res.status(403).json({ error: 'This module is currently locked.' });

  res.json(payload);
});

export const submitMcqModule = asyncHandler(async (req, res) => {
  if (!(await hasAssessmentAccess(req.user))) {
    const subscription = await resolveStudentSubscriptionAccess(req.user);
    return res.status(402).json({
      error: 'An active subscription is required to submit this assessment.',
      code: 'SUBSCRIPTION_REQUIRED',
      subscription,
    });
  }

  const { question_ids = [], selected_answers = [] } = req.body;
  const result = await Assessment.submitMcqAttempt({
    studentId: req.user.sub,
    moduleId: req.params.moduleId,
    questionIds: question_ids,
    selectedAnswers: selected_answers,
  });

  await Notification.create({
    userId: req.user.sub,
    type: 'grade',
    title: 'EMT-B module submitted',
    message: `You scored ${result.attempt.percentage}% in ${result.progress.title}.`,
  });

  res.json(result);
});

export const getMcqAttemptReview = asyncHandler(async (req, res) => {
  const attempt = await Assessment.findMcqAttemptReview(req.user.sub, req.params.attemptId);
  if (!attempt) return res.status(404).json({ error: 'Attempt not found.' });

  res.json({
    attempt,
    review: attempt.review_payload || [],
  });
});
