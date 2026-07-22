import { ClinicalReferenceCard } from '../models/ClinicalReferenceCard.js';
import { Payment } from '../models/Payment.js';
import { asyncHandler } from '../utils/helpers.js';

function canReadCard(user, card) {
  if (!card) return { ok: false, status: 404, error: 'Clinical reference card not found.' };

  if (user.role === 'super_admin') return { ok: true };

  if (user.role === 'institution_admin') {
    return String(card.institution_id) === String(user.institutionId)
      ? { ok: true }
      : { ok: false, status: 403, error: 'You do not have permission to view this card.' };
  }

  if (user.role === 'teacher') {
    const sameInstitution = card.institution_id == null || String(card.institution_id) === String(user.institutionId);
    const sameProgram = !user.program || card.program === user.program;
    return sameInstitution && sameProgram && card.status === 'published'
      ? { ok: true }
      : { ok: false, status: 403, error: 'You do not have permission to view this card.' };
  }

  if (user.role === 'student') {
    const sameInstitution = card.institution_id == null || String(card.institution_id) === String(user.institutionId);
    return sameInstitution && card.status === 'published'
      ? { ok: true }
      : { ok: false, status: 403, error: 'You do not have permission to view this card.' };
  }

  return { ok: false, status: 403, error: 'You do not have permission to view this card.' };
}

export const listClinicalReferenceCards = asyncHandler(async (req, res) => {
  const status = req.user.role === 'super_admin'
    ? req.query.status
    : req.user.role === 'institution_admin'
      ? (req.query.status || undefined)
      : 'published';

  const cards = await ClinicalReferenceCard.list({
    user: req.user,
    status,
    program: req.query.program,
    module: req.query.module,
    topic: req.query.topic,
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
    unlocked = await Payment.hasActiveAccess(req.user.sub, 'graphic', card.graphic_id);
  }

  res.json({
    card: unlocked ? card : { ...card, file_url: null },
    unlocked,
  });
});

export const createClinicalReferenceCard = asyncHandler(async (req, res) => {
  const { title, program, module, topic, skill, description, difficulty } = req.body;
  if (!title || !program || !module || !topic || !skill) {
    return res.status(400).json({ error: 'Title, program, module, topic, and skill are required.' });
  }
  if (!['EMT', 'Paramedic'].includes(program)) {
    return res.status(400).json({ error: 'Program must be EMT or Paramedic.' });
  }

  const card = await ClinicalReferenceCard.create({
    title,
    program,
    module,
    topic,
    skill,
    description,
    difficulty,
    institutionId: req.user.role === 'institution_admin' ? req.user.institutionId : req.body.institutionId,
    createdBy: req.user.sub,
  });

  res.status(201).json({ card });
});

export const updateClinicalReferenceCard = asyncHandler(async (req, res) => {
  const current = await ClinicalReferenceCard.findById(req.params.id);
  const access = canReadCard(req.user, current);
  if (!access.ok) return res.status(access.status).json({ error: access.error });

  const card = await ClinicalReferenceCard.update(req.params.id, {
    title: req.body.title,
    program: req.body.program,
    module: req.body.module,
    topic: req.body.topic,
    skill: req.body.skill,
    description: req.body.description,
    difficulty: req.body.difficulty,
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
  if (!current.file_url) return res.status(400).json({ error: 'Upload a PDF or image before publishing this card.' });

  const card = await ClinicalReferenceCard.update(req.params.id, { status: 'published' });
  res.json({ card });
});

export const unpublishClinicalReferenceCard = asyncHandler(async (req, res) => {
  const current = await ClinicalReferenceCard.findById(req.params.id);
  const access = canReadCard(req.user, current);
  if (!access.ok) return res.status(access.status).json({ error: access.error });

  const card = await ClinicalReferenceCard.update(req.params.id, { status: 'draft' });
  res.json({ card });
});

export const deleteClinicalReferenceCard = asyncHandler(async (req, res) => {
  const current = await ClinicalReferenceCard.findById(req.params.id);
  const access = canReadCard(req.user, current);
  if (!access.ok) return res.status(access.status).json({ error: access.error });

  await ClinicalReferenceCard.delete(req.params.id);
  res.status(204).end();
});
