import { ClinicalReferenceCard } from '../models/ClinicalReferenceCard.js';
import { resolveStudentSubscriptionAccess } from '../services/subscriptionAccess.js';
import { getSignedPdfUrl } from '../services/storage.js';
import { asyncHandler } from '../utils/helpers.js';

const PDF_URL_EXPIRES_IN = 3600; // 1 hour, per the signed-URL access policy for Clinical Reference Cards.

/**
 * Never hand raw private S3 URLs to the client. Strip file_url from any
 * API response and replace it with a short-lived signed pdf_url instead
 * (or null when the card has no file yet / the caller isn't unlocked).
 */
async function toClientCard(card, { unlocked = true } = {}) {
  if (!card) return card;
  const { file_url, ...rest } = card;
  const pdf_url = unlocked && file_url ? await getSignedPdfUrl(file_url, PDF_URL_EXPIRES_IN) : null;
  return { ...rest, pdf_url };
}

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
  if (user.role === 'institution_admin') return { ok: true };
  if (user.role === 'teacher') {
    return card.is_active ? { ok: true } : { ok: false, status: 403, error: 'You do not have permission to view this card.' };
  }
  if (user.role === 'student') {
    return card.is_active ? { ok: true } : { ok: false, status: 403, error: 'You do not have permission to view this card.' };
  }
  return { ok: false, status: 403, error: 'You do not have permission to view this card.' };
}

function normalizeCategory(category, fallback = '') {
  return String(category || fallback || '').trim();
}

function assertAllowedCategory(category) {
  if (!ALLOWED_CATEGORIES.has(category)) {
    const error = new Error(`Category must be one of: ${[...ALLOWED_CATEGORIES].join(', ')}.`);
    error.status = 400;
    throw error;
  }
}

function uploadedUrl(req, file) {
  if (req.body?.fileUrl) return req.body.fileUrl;
  if (file?.location) return file.location;
  if (file?.key && process.env.AWS_S3_BUCKET && process.env.AWS_REGION) {
    return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${file.key}`;
  }
  return file?.path || null;
}

function resolveInstitutionId(req) {
  if (req.user.role === 'super_admin') {
    return req.body?.institutionId || req.body?.institution_id || req.query?.institutionId || req.query?.institution_id || null;
  }
  return req.user.institutionId || null;
}

export const listClinicalReferenceCards = asyncHandler(async (req, res) => {
  const status = req.user.role === 'student' || req.user.role === 'teacher'
    ? 'published'
    : req.query.status || undefined;

  const institutionId = req.user.role === 'super_admin'
    ? req.query.institutionId || req.query.institution_id || undefined
    : req.user.institutionId || undefined;

  const cards = await ClinicalReferenceCard.list({
    user: req.user,
    status,
    category: req.query.category,
    search: req.query.search,
    institutionId,
  });

  const clientCards = await Promise.all(cards.map((card) => toClientCard(card, { unlocked: true })));
  res.json({ cards: clientCards });
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

  if (req.user.role !== 'super_admin' && req.user.institutionId && card.institution_id && String(card.institution_id) !== String(req.user.institutionId)) {
    return res.status(403).json({ error: 'You do not have permission to view this card.' });
  }

  res.json({
    card: await toClientCard(card, { unlocked }),
    unlocked,
  });
});

export const createClinicalReferenceCard = asyncHandler(async (req, res) => {
  const { title, category, difficulty, fileUrl, fileType, isActive } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required.' });
  const resolvedCategory = normalizeCategory(category);
  if (!resolvedCategory) return res.status(400).json({ error: 'Category is required.' });
  assertAllowedCategory(resolvedCategory);
  if (!fileUrl) return res.status(400).json({ error: 'PDF URL is required.' });
  const institutionId = resolveInstitutionId(req);

  const card = await ClinicalReferenceCard.create({
    title,
    category: resolvedCategory,
    difficulty: difficulty || 'intermediate',
    fileUrl,
    fileType: fileType || 'pdf',
    institutionId,
    isActive: Object.prototype.hasOwnProperty.call(req.body, 'isActive') ? Boolean(isActive) : true,
  });

  res.status(201).json({ card });
});

export const bulkUploadClinicalReferenceCards = asyncHandler(async (req, res) => {
  const files = Array.isArray(req.files) ? req.files : [];
  if (!files.length) {
    return res.status(400).json({ error: 'Select one or more PDF files to upload.' });
  }

  const category = normalizeCategory(req.body.category);
  const difficulty = normalizeCategory(req.body.difficulty, 'intermediate');
  if (!category) return res.status(400).json({ error: 'Category is required.' });
  assertAllowedCategory(category);

  const isActive = Object.prototype.hasOwnProperty.call(req.body, 'is_active')
    ? String(req.body.is_active).toLowerCase() !== 'false'
    : true;

  const cards = [];
  const uploadedFileUrls = Array.isArray(req.body?.uploadedFileUrls) ? req.body.uploadedFileUrls : [];
  for (const [index, file] of files.entries()) {
    if (!file?.mimetype || file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'Only PDF files are supported for Clinical Reference Cards.' });
    }
    const institutionId = resolveInstitutionId(req);
    const fileUrl = uploadedFileUrls[index] || uploadedUrl(req, file);
    if (!fileUrl) {
      return res.status(400).json({ error: 'PDF upload succeeded but no file URL was returned from storage.' });
    }

    const card = await ClinicalReferenceCard.create({
      title: String(file.originalname || 'Clinical Reference Card')
        .replace(/\.[^.]+$/, '')
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b\w/g, (letter) => letter.toUpperCase()) || 'Clinical Reference Card',
      category,
      difficulty,
      fileUrl,
      fileType: 'pdf',
      institutionId,
      isActive,
    });
    cards.push(card);
  }

  res.status(201).json({
    cards,
    fileUrls: cards.map((card) => card.file_url).filter(Boolean),
  });
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
    file_url: req.body.file_url || req.body.fileUrl,
    file_type: req.body.file_type || req.body.fileType,
    institution_id: req.body.institution_id,
    is_active: req.body.is_active,
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
  if (!current.file_url) return res.status(400).json({ error: 'Upload a PDF before publishing this card.' });

  const card = await ClinicalReferenceCard.update(req.params.id, { is_active: true });
  res.json({ card });
});

export const unpublishClinicalReferenceCard = asyncHandler(async (req, res) => {
  const current = await ClinicalReferenceCard.findById(req.params.id);
  const access = canReadCard(req.user, current);
  if (!access.ok) return res.status(access.status).json({ error: access.error });

  const card = await ClinicalReferenceCard.update(req.params.id, { is_active: false });
  res.json({ card });
});

export const deleteClinicalReferenceCard = asyncHandler(async (req, res) => {
  const current = await ClinicalReferenceCard.findById(req.params.id);
  const access = canReadCard(req.user, current);
  if (!access.ok) return res.status(access.status).json({ error: access.error });

  await ClinicalReferenceCard.delete(req.params.id);
  res.status(204).end();
});
