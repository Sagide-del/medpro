import { Assessment } from '../models/Assessment.js';
import { Notification } from '../models/Notification.js';
import { StudentSubscription } from '../models/StudentSubscription.js';
import { Institution } from '../models/Institution.js';
import { gradeAnswers } from '../services/assessmentService.js';
import { asyncHandler } from '../utils/helpers.js';

// Staff (teachers/admins) always see full content. A student needs either
// their own Ksh 500/month subscription or an active institution site-license.
// Anonymous visitors never get access — they only see the list as a teaser.
async function hasAssessmentAccess(user) {
  if (!user) return false;
  if (user.role !== 'student') return true;
  const personal = await StudentSubscription.findActive(user.sub);
  if (personal) return true;
  return Institution.hasActiveSubscription(user.institutionId);
}

export const listAssessments = asyncHandler(async (req, res) => {
  const { type, status, groupId } = req.query;
  const filters = { type, groupId };
  if (req.user.role === 'student' || req.user.role === 'teacher') filters.status = 'published';
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
  // Hide correct answers from students taking the assessment
  const safeQuestions = req.user?.role === 'student'
    ? questions.map(({ correct_answer, ...q }) => q)
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
    return res.status(402).json({ error: 'An active assessment subscription is required to start this assessment.', code: 'SUBSCRIPTION_REQUIRED' });
  }
  const attempt = await Assessment.startAttempt(req.params.id, req.user.sub);
  res.status(201).json({ attempt });
});

export const submitAttempt = asyncHandler(async (req, res) => {
  const { attemptId } = req.params;
  const { answers = [] } = req.body;
  const attempt = await Assessment.findAttempt(attemptId);
  if (!attempt || attempt.student_id !== req.user.sub) return res.status(404).json({ error: 'Attempt not found.' });

  const questions = await Assessment.questions(attempt.assessment_id);
  const result = gradeAnswers(questions, answers);

  for (const a of result.graded) {
    await Assessment.recordAnswer(attemptId, a);
  }
  await Assessment.submitAttempt(attemptId);
  const graded = await Assessment.gradeAttempt(attemptId, { scorePct: result.scorePct, pointsAwarded: result.pointsAwarded });

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
