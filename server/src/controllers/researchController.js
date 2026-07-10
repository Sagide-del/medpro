import { Research } from '../models/Research.js';
import { asyncHandler } from '../utils/helpers.js';

const URL_RE = /^https?:\/\/[^\s]+$/i;

export const listResearch = asyncHandler(async (req, res) => {
  const status = req.user?.role === 'super_admin' ? req.query.status : 'published';
  const rows = await Research.list({ status, category: req.query.category });
  res.json({ research: rows });
});

// A student's own submissions, regardless of status — so they can see what's
// pending review vs. already published.
export const listMyResearch = asyncHandler(async (req, res) => {
  const rows = await Research.list({ uploadedBy: req.user.sub, status: null });
  res.json({ research: rows });
});

// Draft items submitted by students, for a teacher/admin to review.
export const listPendingResearch = asyncHandler(async (req, res) => {
  const rows = await Research.pending();
  res.json({ research: rows });
});

export const getResearch = asyncHandler(async (req, res) => {
  const item = await Research.findById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Research item not found.' });
  // Only the uploader or staff can view an item that isn't published yet.
  if (item.status !== 'published') {
    const isOwner = req.user && String(req.user.sub) === String(item.uploaded_by);
    const isStaff = req.user && ['teacher', 'institution_admin', 'super_admin'].includes(req.user.role);
    if (!isOwner && !isStaff) return res.status(404).json({ error: 'Research item not found.' });
  } else {
    await Research.incrementViews(item.research_id);
  }
  res.json({ research: item });
});

export const createResearch = asyncHandler(async (req, res) => {
  const { title, externalUrl } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required.' });
  if (externalUrl && !URL_RE.test(externalUrl)) {
    return res.status(400).json({ error: 'Link must be a full https:// URL to a real source.' });
  }
  // Every submission lands as a draft (content_status default) — nothing goes
  // live until a teacher or admin explicitly publishes it. Students always
  // land here regardless of what the client sends.
  const item = await Research.create({ ...req.body, uploadedBy: req.user.sub });
  res.status(201).json({ research: item });
});

export const setResearchFile = asyncHandler(async (req, res) => {
  const item = await Research.findById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Research item not found.' });
  if (req.user.role === 'student' && String(item.uploaded_by) !== String(req.user.sub)) {
    return res.status(403).json({ error: 'You can only attach a file to your own submission.' });
  }
  const updated = await Research.setFile(req.params.id, req.body.fileUrl);
  res.json({ research: updated });
});

export const publishResearch = asyncHandler(async (req, res) => {
  const item = await Research.setStatus(req.params.id, 'published');
  res.json({ research: item });
});

export const rejectResearch = asyncHandler(async (req, res) => {
  const item = await Research.findById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Research item not found.' });
  await Research.delete(req.params.id);
  res.status(204).end();
});

export const deleteResearch = asyncHandler(async (req, res) => {
  await Research.delete(req.params.id);
  res.status(204).end();
});
