import { ElibraryResource } from '../models/ElibraryResource.js';
import { Payment } from '../models/Payment.js';
import { asyncHandler } from '../utils/helpers.js';

export const listResources = asyncHandler(async (req, res) => {
  const status = req.user?.role === 'super_admin' ? req.query.status : 'published';
  const rows = await ElibraryResource.list({ status, category: req.query.category });
  res.json({ resources: rows });
});

export const getResource = asyncHandler(async (req, res) => {
  const resource = await ElibraryResource.findById(req.params.id);
  if (!resource) return res.status(404).json({ error: 'Resource not found.' });

  const free = Number(resource.price) <= 0;
  let unlocked = free || req.user?.role !== 'student';
  if (!unlocked && req.user?.role === 'student') {
    unlocked = await Payment.hasActiveAccess(req.user.sub, 'elibrary_resource', resource.resource_id);
  }
  res.json({ resource: unlocked ? resource : { ...resource, file_url: null }, unlocked });
});

export const createResource = asyncHandler(async (req, res) => {
  if (!req.body.title) return res.status(400).json({ error: 'Title is required.' });
  const resource = await ElibraryResource.create({ ...req.body, uploadedBy: req.user.sub });
  res.status(201).json({ resource });
});

export const setResourceFiles = asyncHandler(async (req, res) => {
  const resource = await ElibraryResource.setFiles(req.params.id, req.body);
  res.json({ resource });
});

export const publishResource = asyncHandler(async (req, res) => {
  const resource = await ElibraryResource.setStatus(req.params.id, 'published');
  res.json({ resource });
});

export const deleteResource = asyncHandler(async (req, res) => {
  await ElibraryResource.delete(req.params.id);
  res.status(204).end();
});

/** Free resources can be "downloaded" directly with no purchase step. */
export const downloadFreeResource = asyncHandler(async (req, res) => {
  const resource = await ElibraryResource.findById(req.params.id);
  if (!resource) return res.status(404).json({ error: 'Resource not found.' });
  if (Number(resource.price) > 0) return res.status(403).json({ error: 'This resource requires purchase.' });
  await ElibraryResource.incrementDownloads(resource.resource_id);
  res.json({ resource });
});
