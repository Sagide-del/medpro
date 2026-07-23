import { ProctoredExam } from '../models/ProctoredExam.js';
import { asyncHandler } from '../utils/helpers.js';

export const listExams = asyncHandler(async (req, res) => {
  if (req.user.role === 'student') {
    const exams = await ProctoredExam.listForStudent(req.user.sub);
    return res.json({ exams });
  }
  const exams = await ProctoredExam.listForTeacher({
    userId: req.user.sub,
    institutionId: req.user.institutionId,
    role: req.user.role,
  });
  return res.json({ exams });
});

export const createExam = asyncHandler(async (req, res) => {
  const { title, examType } = req.body;
  if (!title || !examType) return res.status(400).json({ error: 'title and examType are required.' });
  const exam = await ProctoredExam.create({
    institutionId: req.user.institutionId,
    teacherId: req.user.sub,
    ...req.body,
  });
  res.status(201).json({ exam });
});

export const startExam = asyncHandler(async (req, res) => {
  const attempt = await ProctoredExam.startAttempt({ examId: req.params.examId, studentId: req.user.sub });
  res.status(201).json({ attempt });
});

export const submitExam = asyncHandler(async (req, res) => {
  const attempt = await ProctoredExam.submitAttempt({
    examId: req.params.examId,
    studentId: req.user.sub,
    score: req.body.score,
    autoSubmitted: req.body.autoSubmitted,
  });
  if (!attempt) return res.status(404).json({ error: 'Attempt not found.' });
  res.json({ attempt });
});

export const logExamActivity = asyncHandler(async (req, res) => {
  const activity = await ProctoredExam.logActivity({
    examId: req.params.examId,
    studentId: req.user.role === 'student' ? req.user.sub : req.body.studentId,
    eventType: req.body.eventType,
    details: req.body.details,
  });
  res.status(201).json({ activity });
});

export const releaseResults = asyncHandler(async (req, res) => {
  await ProctoredExam.releaseResults(req.params.examId);
  res.json({ ok: true });
});

export const activeCandidates = asyncHandler(async (req, res) => {
  const candidates = await ProctoredExam.activeCandidates(req.params.examId);
  res.json({ candidates });
});

export const examReports = asyncHandler(async (req, res) => {
  const reports = await ProctoredExam.reports({ institutionId: req.user.institutionId });
  res.json(reports);
});
