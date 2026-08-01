import { asyncHandler } from '../utils/helpers.js';
import { MedProhubEmsService } from '../services/medprohubEmsService.js';

function pickArray(body, ...keys) {
  for (const key of keys) {
    const value = body?.[key];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string' && value.trim()) {
      return value.split(',').map((item) => item.trim()).filter(Boolean);
    }
  }
  return [];
}

function normalizeGenerateInput(req) {
  const body = req.body || {};
  return {
    eventType: body.eventType || body.event_type,
    location: body.location,
    incidentDate: body.incidentDate || body.incident_date,
    patientCount: body.patientCount || body.patient_count,
    difficulty: body.difficulty,
    level: body.level,
    incidentDescription: body.incidentDescription || body.incident_description || body.description,
    description: body.description,
    sourceFileUrl: req.file?.location || req.file?.url || req.file?.path || null,
    sourceFileName: req.file?.originalname || null,
    createdBy: req.user?.sub || null,
    schoolId: req.user?.institutionId || null,
    publishedTo: pickArray(body, 'publishedTo', 'published_to'),
    publishedToSchools: pickArray(body, 'publishedToSchools', 'published_to_schools'),
  };
}

function normalizePublishTargets(body = {}) {
  return {
    publishTarget: body.publishTarget || body.target || 'selected_schools',
    studentIds: pickArray(body, 'studentIds', 'publishedTo', 'published_to'),
    schoolIds: pickArray(body, 'schoolIds', 'publishedToSchools', 'published_to_schools'),
  };
}

export const generateCase = asyncHandler(async (req, res) => {
  const draft = await MedProhubEmsService.generateDraft(normalizeGenerateInput(req));
  res.status(201).json({ draft });
});

export const listMasterCases = asyncHandler(async (req, res) => {
  const cases = await MedProhubEmsService.listMasterCases({ includeAll: req.user?.role === 'super_admin' });
  res.json({ cases });
});

export const getMasterCase = asyncHandler(async (req, res) => {
  const item = await MedProhubEmsService.getMasterCase(req.params.id);
  if (!item) return res.status(404).json({ error: 'Case not found.' });
  res.json({ caseStudy: item });
});

export const updateMasterCase = asyncHandler(async (req, res) => {
  const item = await MedProhubEmsService.updateMasterCase(req.params.id, req.body || {});
  if (!item) return res.status(404).json({ error: 'Case not found.' });
  res.json({ caseStudy: item });
});

export const approveCase = asyncHandler(async (req, res) => {
  const item = await MedProhubEmsService.setMasterStatus(req.params.id, 'approved');
  if (!item) return res.status(404).json({ error: 'Case not found.' });
  res.json({ caseStudy: item });
});

export const rejectCase = asyncHandler(async (req, res) => {
  const item = await MedProhubEmsService.setMasterStatus(req.params.id, 'rejected');
  if (!item) return res.status(404).json({ error: 'Case not found.' });
  res.json({ caseStudy: item });
});

export const publishCase = asyncHandler(async (req, res) => {
  const item = await MedProhubEmsService.publishMaster(req.params.id, normalizePublishTargets(req.body || {}));
  if (!item) return res.status(404).json({ error: 'Case not found.' });
  res.json({ caseStudy: item });
});

export const uploadCaseImages = asyncHandler(async (req, res) => {
  const item = await MedProhubEmsService.uploadMasterImages(req.params.id, req.files || (req.file ? [req.file] : []));
  if (!item) return res.status(400).json({ error: 'No uploaded images were received.' });
  res.json({ caseStudy: item, imageUrls: item.image_urls || [] });
});

export const listTeacherBank = asyncHandler(async (req, res) => {
  const cases = await MedProhubEmsService.listTeacherBank({
    teacherId: req.user?.sub || null,
    institutionId: req.user?.institutionId || null,
  });
  res.json({ cases });
});

export const getTeacherBankCase = asyncHandler(async (req, res) => {
  const item = await MedProhubEmsService.getTeacherBankItem(req.params.id);
  if (!item) return res.status(404).json({ error: 'Case not found.' });
  res.json({ caseStudy: item });
});

export const customizeTeacherContent = asyncHandler(async (req, res) => {
  const item = await MedProhubEmsService.customizeForTeacher({
    ...req.body,
    masterId: req.body?.masterId || req.body?.master_id || req.params.id,
    teacherId: req.user?.sub || null,
    schoolId: req.user?.institutionId || null,
  });
  if (!item) return res.status(404).json({ error: 'Master case not found.' });
  res.status(201).json({ content: item });
});

export const listTeacherContent = asyncHandler(async (req, res) => {
  const items = await MedProhubEmsService.listTeacherContent({
    teacherId: req.user?.sub || null,
    schoolId: req.user?.institutionId || null,
  });
  res.json({ content: items });
});

export const publishTeacherContent = asyncHandler(async (req, res) => {
  const item = await MedProhubEmsService.publishTeacherContent(req.body?.id || req.params.id, {
    ...normalizePublishTargets(req.body || {}),
    schoolId: req.user?.institutionId || null,
  });
  if (!item) return res.status(404).json({ error: 'Customized content not found.' });
  res.json({ content: item });
});

export const listStudentAssignments = asyncHandler(async (req, res) => {
  const items = await MedProhubEmsService.listStudentAssignments({
    studentId: req.user?.sub || null,
    institutionId: req.user?.institutionId || null,
  });
  res.json({ assignments: items });
});

export const getStudentAssignment = asyncHandler(async (req, res) => {
  const assignment = await MedProhubEmsService.getStudentAssignment({
    studentId: req.user?.sub || null,
    contentId: req.params.id,
  });
  if (!assignment) return res.status(404).json({ error: 'Assignment not found.' });
  res.json({ assignment });
});

export const saveStudentAnswer = asyncHandler(async (req, res) => {
  const progress = await MedProhubEmsService.saveStudentAnswer({
    studentId: req.user?.sub || null,
    contentId: req.params.id,
    contentFrom: req.body?.contentFrom || req.body?.content_from,
    activityId: req.body?.activityId || req.body?.activity_id,
    value: req.body?.value,
    currentStage: req.body?.currentStage || req.body?.current_stage || 1,
    timeSpent: req.body?.timeSpent || req.body?.time_spent || 0,
  });
  if (!progress) return res.status(404).json({ error: 'Assignment not found.' });
  res.json({ progress });
});

export const getStudentProgress = asyncHandler(async (req, res) => {
  const progress = await MedProhubEmsService.getStudentProgress({
    studentId: req.user?.sub || null,
    contentId: req.params.id,
  });
  if (!progress) return res.status(404).json({ error: 'Assignment not found.' });
  res.json({ progress });
});

export const completeStudentCase = asyncHandler(async (req, res) => {
  const result = await MedProhubEmsService.completeStudentCase({
    studentId: req.user?.sub || null,
    contentId: req.params.id,
    answers: req.body?.answers || {},
    timeSpent: req.body?.timeSpent || req.body?.time_spent || 0,
  });
  if (!result) return res.status(404).json({ error: 'Assignment not found.' });
  res.json(result);
});

