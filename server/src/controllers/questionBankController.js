import { QuestionBank } from '../models/QuestionBank.js';
import { MockPreTest } from '../models/MockPreTest.js';
import { Assessment } from '../models/Assessment.js';
import { asyncHandler } from '../utils/helpers.js';

export const listQuestions = asyncHandler(async (req, res) => {
  res.json(await QuestionBank.listQuestions({
    studentId: req.user.sub,
    topic: req.query.topic,
    difficulty: req.query.difficulty,
    questionId: req.query.questionId,
    page: req.query.page,
    limit: req.query.limit,
    includeAnswer: req.query.includeAnswer === 'true',
  }));
});

export const submitQuestions = asyncHandler(async (req, res) => {
  const { module_id: moduleId, question_ids: questionIds, selected_answers: selectedAnswers } = req.body || {};
  if (!moduleId || !Array.isArray(questionIds) || !Array.isArray(selectedAnswers)) {
    return res.status(400).json({ error: 'module_id, question_ids, and selected_answers are required.' });
  }
  res.json(await Assessment.submitMcqAttempt({ studentId: req.user.sub, moduleId, questionIds, selectedAnswers }));
});

export const bookmarkQuestion = asyncHandler(async (req, res) => {
  const { questionId, bookmarked = true } = req.body || {};
  if (!questionId) return res.status(400).json({ error: 'questionId is required.' });
  res.json({ bookmark: await QuestionBank.setBookmark({ studentId: req.user.sub, questionId, bookmarked }) });
});

export const getProgress = asyncHandler(async (req, res) => {
  res.json({ progress: await QuestionBank.progress(req.user.sub) });
});

export const listMockExams = asyncHandler(async (req, res) => {
  res.json({ mockExams: await QuestionBank.mockExams(req.user.sub) });
});

export const submitMockExam = asyncHandler(async (req, res) => {
  const { answers } = req.body || {};
  const module = req.body?.module || req.params.id;
  if (!module || !Array.isArray(answers)) return res.status(400).json({ error: 'module and answers are required.' });
  res.json(await MockPreTest.submitTest({ module, answers }));
});
