import { ClinicalRotation } from '../models/ClinicalRotation.js';
import { asyncHandler } from '../utils/helpers.js';

function buildSimplePdf(title, lines) {
  const safeLines = [title, '', ...lines].map((line) => String(line || '').replace(/[()\\]/g, ''));
  const content = [
    'BT',
    '/F1 12 Tf',
    '50 780 Td',
    ...safeLines.flatMap((line, index) => (index === 0 ? [`(${line}) Tj`] : ['0 -18 Td', `(${line}) Tj`])),
    'ET',
  ].join('\n');

  const objects = [];
  objects.push('1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj');
  objects.push('2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj');
  objects.push('3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj');
  objects.push(`4 0 obj << /Length ${content.length} >> stream\n${content}\nendstream endobj`);
  objects.push('5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj');

  let body = '%PDF-1.4\n';
  const offsets = [0];
  for (const obj of objects) {
    offsets.push(body.length);
    body += `${obj}\n`;
  }
  const xref = body.length;
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i += 1) {
    body += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  body += `trailer << /Root 1 0 R /Size ${objects.length + 1} >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(body, 'binary');
}

export const institutionDashboard = asyncHandler(async (req, res) => {
  const dashboard = await ClinicalRotation.dashboard(req.user.institutionId);
  res.json(dashboard);
});

export const createHospital = asyncHandler(async (req, res) => {
  if (!req.body.name) return res.status(400).json({ error: 'Hospital name is required.' });
  const hospital = await ClinicalRotation.createHospital({ institutionId: req.user.institutionId, ...req.body });
  res.status(201).json({ hospital });
});

export const createSite = asyncHandler(async (req, res) => {
  if (!req.body.name || !req.body.hospitalId) return res.status(400).json({ error: 'Hospital and site name are required.' });
  const site = await ClinicalRotation.createSite({ institutionId: req.user.institutionId, ...req.body });
  res.status(201).json({ site });
});

export const createRotation = asyncHandler(async (req, res) => {
  if (!req.body.title) return res.status(400).json({ error: 'Rotation title is required.' });
  const rotation = await ClinicalRotation.createRotation({ institutionId: req.user.institutionId, ...req.body });
  res.status(201).json({ rotation });
});

export const assignStudents = asyncHandler(async (req, res) => {
  const assignments = await ClinicalRotation.assignStudents({
    rotationId: req.params.rotationId,
    studentIds: req.body.studentIds,
    supervisorId: req.body.supervisorId,
    activateLogbook: req.body.activateLogbook,
  });
  res.status(201).json({ assignments });
});

export const studentLogbook = asyncHandler(async (req, res) => {
  const data = await ClinicalRotation.studentLogbook(req.user.sub);
  res.json(data);
});

export const createActivity = asyncHandler(async (req, res) => {
  const { rotationAssignmentId, activityDate, hospital, activityPerformed, clinicalSkill } = req.body;
  if (!rotationAssignmentId || !activityDate || !hospital || !activityPerformed || !clinicalSkill) {
    return res.status(400).json({ error: 'rotationAssignmentId, activityDate, hospital, activityPerformed, and clinicalSkill are required.' });
  }
  const entry = await ClinicalRotation.createActivity({ studentId: req.user.sub, ...req.body });
  res.status(201).json({ entry });
});

export const reviewQueue = asyncHandler(async (req, res) => {
  const entries = await ClinicalRotation.reviewQueue({
    userId: req.user.sub,
    institutionId: req.user.institutionId,
    role: req.user.role,
  });
  res.json({ entries });
});

export const reviewActivity = asyncHandler(async (req, res) => {
  const { status, comments } = req.body;
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'status must be approved or rejected.' });
  }
  const entry = await ClinicalRotation.reviewActivity(req.params.activityId, req.user.sub, { status, comments });
  if (!entry) return res.status(404).json({ error: 'Activity record not found.' });
  res.json({ entry });
});

export const exportLogbookPdf = asyncHandler(async (req, res) => {
  const data = await ClinicalRotation.studentLogbook(req.user.sub);
  const lines = [
    `Student ID: ${req.user.sub}`,
    `Approved activities: ${data.summary.approved}`,
    `Pending activities: ${data.summary.pending}`,
    `Total hours: ${data.summary.totalHours}`,
    '',
    ...data.activities.slice(0, 24).map((activity) => `${activity.activity_date} | ${activity.clinical_skill} | ${activity.hours_completed} hrs | ${activity.status}`),
  ];
  const pdf = buildSimplePdf('MedProHub Clinical Logbook', lines);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="medprohub-clinical-logbook.pdf"');
  res.send(pdf);
});
