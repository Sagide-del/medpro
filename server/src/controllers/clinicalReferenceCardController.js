import { ClinicalReferenceCard } from '../models/ClinicalReferenceCard.js';
import { resolveStudentSubscriptionAccess } from '../services/subscriptionAccess.js';
import { asyncHandler } from '../utils/helpers.js';

const ALLOWED_CATEGORIES = new Set([
  'Airway',
  'Trauma',
  'Cardiology',
  'Medical Emergencies',
  'Pediatrics',
  'Operations',
]);

function canReadCard(user, card) {
  if (!card) return { ok: false, status: 404, error: 'Clinical reference card not found.' };
  if (user.role === 'super_admin') return { ok: true };

  if (user.role === 'institution_admin') {
    return String(card.institution_id || '') === String(user.institutionId || '') || card.institution_id == null
      ? { ok: true }
      : { ok: false, status: 403, error: 'You do not have permission to view this card.' };
  }

  if (user.role === 'teacher') {
    const sameInstitution = card.institution_id == null || String(card.institution_id) === String(user.institutionId);
    return sameInstitution && card.is_active
      ? { ok: true }
      : { ok: false, status: 403, error: 'You do not have permission to view this card.' };
  }

  if (user.role === 'student') {
    const sameInstitution = card.institution_id == null || String(card.institution_id) === String(user.institutionId);
    return sameInstitution && card.is_active
      ? { ok: true }
      : { ok: false, status: 403, error: 'You do not have permission to view this card.' };
  }

  return { ok: false, status: 403, error: 'You do not have permission to view this card.' };
}

function normalizeCategory(category, fallback = '') {
  const value = String(category || fallback || '').trim();
  return value;
}

function titleFromFilename(filename) {
  return String(filename || 'Clinical Reference Card')
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase()) || 'Clinical Reference Card';
}

function assertAllowedCategory(category) {
  if (!ALLOWED_CATEGORIES.has(category)) {
    const error = new Error(`Category must be one of: ${[...ALLOWED_CATEGORIES].join(', ')}.`);
    error.status = 400;
    throw error;
  }
}

export const listClinicalReferenceCards = asyncHandler(async (req, res) => {
  const status = req.user.role === 'student' || req.user.role === 'teacher'
    ? 'published'
    : req.query.status || undefined;

  const cards = await ClinicalReferenceCard.list({
    user: req.user,
    status,
    category: req.query.category,
    search: req.query.search,
  });

  res.json({ cards });
});

export const getClinicalReferenceCard = asyncHandler(async (req, res) => {
  const card = await ClinicalReferenceCard.findById(req.params.id);
  const access = canReadCard(req.user, card);
  if (!access.ok) return res.status(access.status).json({ error: access.error });

  let unlocked = req.user.role !== 'student';
  if (req.user.role === 'student') {
    const subscription = await resolveStudentSubscriptionAccess(req.user);
    unlocked = subscription.allowed;
  }

  res.json({
    card: unlocked ? card : { ...card, image_url: null, file_url: null },
    unlocked,
  });
});

export const createClinicalReferenceCard = asyncHandler(async (req, res) => {
  const { title, category, difficulty, imageUrl, isActive, description } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Title is required.' });
  }
  const resolvedCategory = normalizeCategory(category, 'Operations');
  assertAllowedCategory(resolvedCategory);

  const card = await ClinicalReferenceCard.create({
    title,
    category: resolvedCategory,
    difficulty: difficulty || 'intermediate',
    imageUrl: imageUrl || null,
    isActive: Object.prototype.hasOwnProperty.call(req.body, 'isActive') ? Boolean(isActive) : true,
    institutionId: req.user.role === 'institution_admin' ? req.user.institutionId : req.body.institutionId,
    createdBy: req.user.sub,
    description: description || null,
  });

  res.status(201).json({ card });
});

export const bulkUploadClinicalReferenceCards = asyncHandler(async (req, res) => {
  const files = Array.isArray(req.files) ? req.files : [];
  if (!files.length) {
    return res.status(400).json({ error: 'Select one or more PNG files to upload.' });
  }

  const category = normalizeCategory(req.body.category);
  const difficulty = normalizeCategory(req.body.difficulty, 'intermediate');
  if (!category) return res.status(400).json({ error: 'Category is required.' });
  assertAllowedCategory(category);

  const isActive = Object.prototype.hasOwnProperty.call(req.body, 'is_active')
    ? String(req.body.is_active).toLowerCase() !== 'false'
    : true;

  const cards = [];
  for (const file of files) {
    if (!file?.mimetype || file.mimetype !== 'image/png') {
      return res.status(400).json({ error: 'Only PNG files are supported for Clinical Reference Cards.' });
    }

    const card = await ClinicalReferenceCard.create({
      title: titleFromFilename(file.originalname),
      category,
      difficulty,
      imageUrl: req.uploadedFileUrls?.[file.fieldname] || req.uploadedFileUrl || (file.key ? `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${file.key}` : null) || file.location || file.path || null,
      isActive,
      institutionId: req.user.role === 'institution_admin' ? req.user.institutionId : null,
      createdBy: req.user.sub,
    });
    cards.push(card);
  }

  res.status(201).json({ cards });
});

export const updateClinicalReferenceCard = asyncHandler(async (req, res) => {
  const current = await ClinicalReferenceCard.findById(req.params.id);
  const access = canReadCard(req.user, current);
  if (!access.ok) return res.status(access.status).json({ error: access.error });

  const category = req.body.category ? normalizeCategory(req.body.category) : undefined;
  if (category) assertAllowedCategory(category);

  const card = await ClinicalReferenceCard.update(req.params.id, {
    title: req.body.title,
    category,
    difficulty: req.body.difficulty,
    description: req.body.description,
    image_url: req.body.image_url,
    file_url: req.body.file_url,
    is_active: req.body.is_active,
    institution_id: req.user.role === 'institution_admin' ? req.user.institutionId : req.body.institutionId,
  });

  res.json({ card });
});

export const setClinicalReferenceCardFile = asyncHandler(async (req, res) => {
  const current = await ClinicalReferenceCard.findById(req.params.id);
  const access = canReadCard(req.user, current);
  if (!access.ok) return res.status(access.status).json({ error: access.error });

  const card = await ClinicalReferenceCard.setFile(req.params.id, req.body);
  res.json({ card });
});

export const publishClinicalReferenceCard = asyncHandler(async (req, res) => {
  const current = await ClinicalReferenceCard.findById(req.params.id);
  const access = canReadCard(req.user, current);
  if (!access.ok) return res.status(access.status).json({ error: access.error });
  if (!current.image_url && !current.file_url) {
    return res.status(400).json({ error: 'Upload a PNG image before publishing this card.' });
  }

  const card = await ClinicalReferenceCard.update(req.params.id, { status: 'published', is_active: true });
  res.json({ card });
});

export const unpublishClinicalReferenceCard = asyncHandler(async (req, res) => {
  const current = await ClinicalReferenceCard.findById(req.params.id);
  const access = canReadCard(req.user, current);
  if (!access.ok) return res.status(access.status).json({ error: access.error });

  const card = await ClinicalReferenceCard.update(req.params.id, { status: 'draft', is_active: false });
  res.json({ card });
});

export const deleteClinicalReferenceCard = asyncHandler(async (req, res) => {
  const current = await ClinicalReferenceCard.findById(req.params.id);
  const access = canReadCard(req.user, current);
  if (!access.ok) return res.status(access.status).json({ error: access.error });

  await ClinicalReferenceCard.delete(req.params.id);
  res.status(204).end();
});

