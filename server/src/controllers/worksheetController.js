import { Worksheet } from '../models/Worksheet.js';
import { Payment } from '../models/Payment.js';
import { asyncHandler } from '../utils/helpers.js';

export const listWorksheets = asyncHandler(async (req, res) => {
  const status = ['super_admin'].includes(req.user?.role) ? req.query.status : 'published';
  const rows = await Worksheet.list({ status, category: req.query.category });
  res.json({ worksheets: rows });
});

export const getWorksheet = asyncHandler(async (req, res) => {
  const worksheet = await Worksheet.findById(req.params.id);
  if (!worksheet) return res.status(404).json({ error: 'Worksheet not found.' });

  let unlocked = req.user?.role !== 'student';
  if (req.user?.role === 'student') {
    unlocked = await Payment.hasActiveAccess(req.user.sub, 'worksheet', worksheet.worksheet_id);
  }

  const questions = unlocked ? await Worksheet.questions(worksheet.worksheet_id) : [];
  res.json({ worksheet, questions, unlocked });
});

export const createWorksheet = asyncHandler(async (req, res) => {
  const { questions = [], ...rest } = req.body;
  if (!rest.title) return res.status(400).json({ error: 'Title is required.' });
  const worksheet = await Worksheet.create({ ...rest, uploadedBy: req.user.sub }, questions);
  res.status(201).json({ worksheet });
});

export const publishWorksheet = asyncHandler(async (req, res) => {
  const worksheet = await Worksheet.setStatus(req.params.id, 'published');
  res.json({ worksheet });
});

export const deleteWorksheet = asyncHandler(async (req, res) => {
  await Worksheet.delete(req.params.id);
  res.status(204).end();
});

export const submitWorksheet = asyncHandler(async (req, res) => {
  const worksheet = await Worksheet.findById(req.params.id);
  if (!worksheet) return res.status(404).json({ error: 'Worksheet not found.' });
  const unlocked = await Payment.hasActiveAccess(req.user.sub, 'worksheet', worksheet.worksheet_id);
  if (!unlocked) return res.status(403).json({ error: 'Purchase this worksheet to submit answers.' });

  const submission = await Worksheet.submit(worksheet.worksheet_id, req.user.sub, req.body.answers || []);
  res.status(201).json({ submission });
});

export const mySubmissions = asyncHandler(async (req, res) => {
  const rows = await Worksheet.submissionsForStudent(req.user.sub);
  res.json({ submissions: rows });
});

export const worksheetSubmissions = asyncHandler(async (req, res) => {
  const rows = await Worksheet.submissionsForWorksheet(req.params.id);
  res.json({ submissions: rows });
});

export const gradeSubmission = asyncHandler(async (req, res) => {
  const submission = await Worksheet.gradeSubmission(req.params.submissionId, req.body.scorePct);
  res.json({ submission });
});
