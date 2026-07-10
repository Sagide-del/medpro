import { Logbook } from '../models/Logbook.js';
import { LogbookEntry } from '../models/LogbookEntry.js';
import { Notification } from '../models/Notification.js';
import { logAdminAction } from '../middleware/audit.js';
import { asyncHandler } from '../utils/helpers.js';

export const myLogbook = asyncHandler(async (req, res) => {
  const logbook = await Logbook.findOrCreateForStudent(req.user.sub);
  const entries = await LogbookEntry.listForStudent(req.user.sub);
  const progress = await Logbook.progress(logbook.logbook_id);
  res.json({ logbook, entries, progress });
});

export const createEntry = asyncHandler(async (req, res) => {
  const { patientScenario, skillsPerformed, reflection, fileUrl } = req.body;
  if (!patientScenario) return res.status(400).json({ error: 'A patient scenario summary is required.' });
  const logbook = await Logbook.findOrCreateForStudent(req.user.sub);
  const entry = await LogbookEntry.create({
    logbookId: logbook.logbook_id, studentId: req.user.sub, patientScenario, skillsPerformed, reflection, fileUrl,
  });
  res.status(201).json({ entry });
});

export const pendingReview = asyncHandler(async (req, res) => {
  const institutionId = req.user.role === 'institution_admin' ? req.user.institutionId : undefined;
  const rows = await LogbookEntry.listPendingReview({ institutionId });
  res.json({ entries: rows });
});

export const reviewEntry = asyncHandler(async (req, res) => {
  const { status, reviewNotes } = req.body;
  if (!['approved', 'rejected', 'revision_requested'].includes(status)) {
    return res.status(400).json({ error: 'status must be approved, rejected, or revision_requested.' });
  }
  const entry = await LogbookEntry.review(req.params.entryId, req.user.sub, { status, reviewNotes });
  if (!entry) return res.status(404).json({ error: 'Entry not found.' });

  await Notification.create({
    userId: entry.student_id,
    type: 'approval',
    title: `Logbook entry ${status.replace('_', ' ')}`,
    message: reviewNotes || `Your logbook entry has been ${status.replace('_', ' ')}.`,
  });
  logAdminAction(req.user.sub, 'approve', { entryId: entry.entry_id, status }, req);
  res.json({ entry });
});
