import { Video } from '../models/Video.js';
import { Notification } from '../models/Notification.js';
import { logAdminAction } from '../middleware/audit.js';
import { asyncHandler } from '../utils/helpers.js';

export const myVideos = asyncHandler(async (req, res) => {
  const rows = await Video.listForStudent(req.user.sub);
  res.json({ videos: rows });
});

export const uploadVideo = asyncHandler(async (req, res) => {
  const { title, description, skillCategory, fileUrl, thumbnailUrl } = req.body;
  if (!title || !fileUrl) return res.status(400).json({ error: 'Title and fileUrl are required.' });
  const video = await Video.create({ studentId: req.user.sub, title, description, skillCategory, fileUrl, thumbnailUrl });
  res.status(201).json({ video });
});

export const pendingReview = asyncHandler(async (req, res) => {
  const institutionId = req.user.role === 'institution_admin' ? req.user.institutionId : undefined;
  const rows = await Video.listPendingReview({ institutionId });
  res.json({ videos: rows });
});

export const reviewVideo = asyncHandler(async (req, res) => {
  const { status, reviewNotes } = req.body;
  if (!['approved', 'rejected', 'revision_requested'].includes(status)) {
    return res.status(400).json({ error: 'status must be approved, rejected, or revision_requested.' });
  }
  const video = await Video.review(req.params.id, req.user.sub, { status, reviewNotes });
  if (!video) return res.status(404).json({ error: 'Video not found.' });

  await Notification.create({
    userId: video.student_id,
    type: 'approval',
    title: `Video ${status.replace('_', ' ')}`,
    message: reviewNotes || `Your video submission has been ${status.replace('_', ' ')}.`,
  });
  logAdminAction(req.user.sub, 'approve', { videoId: video.video_id, status }, req);
  res.json({ video });
});

export const deleteVideo = asyncHandler(async (req, res) => {
  await Video.delete(req.params.id);
  res.status(204).end();
});
