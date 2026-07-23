import { PracticalVideoAssignment } from '../models/PracticalVideoAssignment.js';
import { asyncHandler } from '../utils/helpers.js';

export const listAssignments = asyncHandler(async (req, res) => {
  if (req.user.role === 'student') {
    const assignments = await PracticalVideoAssignment.listForStudent(req.user.sub);
    return res.json({ assignments });
  }

  const assignments = await PracticalVideoAssignment.listForTeacher({
    userId: req.user.sub,
    institutionId: req.user.institutionId,
    role: req.user.role,
  });
  return res.json({ assignments });
});

export const createAssignment = asyncHandler(async (req, res) => {
  const { title, instructions, markingChecklist, dueDate, status, studentIds, groupIds } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required.' });
  const assignment = await PracticalVideoAssignment.create({
    institutionId: req.user.institutionId,
    teacherId: req.user.sub,
    title,
    instructions,
    markingChecklist,
    dueDate,
    status,
    studentIds,
    groupIds,
  });
  res.status(201).json({ assignment });
});

export const updateAssignment = asyncHandler(async (req, res) => {
  const assignment = await PracticalVideoAssignment.update(req.params.assignmentId, req.body);
  if (!assignment) return res.status(404).json({ error: 'Assignment not found.' });
  res.json({ assignment });
});

export const deleteAssignment = asyncHandler(async (req, res) => {
  await PracticalVideoAssignment.delete(req.params.assignmentId);
  res.status(204).end();
});

export const submitAssignment = asyncHandler(async (req, res) => {
  const fileUrl = req.body.fileUrl || req.uploadedFileUrl;
  if (!fileUrl) return res.status(400).json({ error: 'Video file is required.' });
  const submission = await PracticalVideoAssignment.submit({
    assignmentId: req.params.assignmentId,
    studentId: req.user.sub,
    fileUrl,
    notes: req.body.notes,
  });
  res.status(201).json({ submission });
});

export const reviewQueue = asyncHandler(async (req, res) => {
  const submissions = await PracticalVideoAssignment.reviewQueue({
    userId: req.user.sub,
    institutionId: req.user.institutionId,
    role: req.user.role,
  });
  res.json({ submissions });
});

export const reviewSubmission = asyncHandler(async (req, res) => {
  const { status, teacherFeedback, checklistResults, releaseResult } = req.body;
  if (!['approved', 'rejected', 'revision_requested', 'released'].includes(status)) {
    return res.status(400).json({ error: 'Invalid submission status.' });
  }
  const submission = await PracticalVideoAssignment.reviewSubmission(req.params.submissionId, req.user.sub, {
    status,
    teacherFeedback,
    checklistResults,
    releaseResult,
  });
  if (!submission) return res.status(404).json({ error: 'Submission not found.' });
  res.json({ submission });
});
