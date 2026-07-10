import { MedicalGraphic } from '../models/MedicalGraphic.js';
import { Payment } from '../models/Payment.js';
import { asyncHandler } from '../utils/helpers.js';

export const listGraphics = asyncHandler(async (req, res) => {
  const status = req.user?.role === 'super_admin' ? req.query.status : 'published';
  const rows = await MedicalGraphic.list({ status, category: req.query.category, graphicType: req.query.graphicType });
  res.json({ graphics: rows });
});

export const getGraphic = asyncHandler(async (req, res) => {
  const graphic = await MedicalGraphic.findById(req.params.id);
  if (!graphic) return res.status(404).json({ error: 'Graphic not found.' });
  await MedicalGraphic.incrementViews(graphic.graphic_id);

  let unlocked = req.user?.role !== 'student';
  if (req.user?.role === 'student') {
    unlocked = await Payment.hasActiveAccess(req.user.sub, 'graphic', graphic.graphic_id);
  }
  res.json({ graphic: unlocked ? graphic : { ...graphic, file_url: null }, unlocked });
});

export const createGraphic = asyncHandler(async (req, res) => {
  if (!req.body.title) return res.status(400).json({ error: 'Title is required.' });
  const graphic = await MedicalGraphic.create({ ...req.body, uploadedBy: req.user.sub });
  res.status(201).json({ graphic });
});

export const setGraphicFiles = asyncHandler(async (req, res) => {
  const graphic = await MedicalGraphic.setFiles(req.params.id, req.body);
  res.json({ graphic });
});

export const publishGraphic = asyncHandler(async (req, res) => {
  const graphic = await MedicalGraphic.setStatus(req.params.id, 'published');
  res.json({ graphic });
});

export const deleteGraphic = asyncHandler(async (req, res) => {
  await MedicalGraphic.delete(req.params.id);
  res.status(204).end();
});
