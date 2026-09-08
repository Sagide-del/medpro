import { asyncHandler } from '../utils/helpers.js';
import { AI_GENERATOR_V2_ENABLED, findDuplicates, getPersistentJob, listPersistentJobs, publishApproved, saveReviewDecisions } from '../services/aiGeneratorV2Service.js';

function ensureEnabled(res) {
  if (!AI_GENERATOR_V2_ENABLED) {
    res.status(404).json({ error: 'AI Generator V2 is not enabled.' });
    return false;
  }
  return true;
}

function generatedItems(job) {
  const result = job?.result_json || {};
  return Array.isArray(result.previewQuestions) ? result.previewQuestions : [];
}

export const listJobs = asyncHandler(async (req, res) => {
  if (!ensureEnabled(res)) return;
  res.json({ jobs: await listPersistentJobs(req.user.role === 'super_admin' ? null : req.user.sub) });
});

export const getJob = asyncHandler(async (req, res) => {
  if (!ensureEnabled(res)) return;
  const job = await getPersistentJob(req.params.jobId, req.user.role === 'super_admin' ? null : req.user.sub);
  if (!job) return res.status(404).json({ error: 'Generation job not found or expired.' });
  res.json({ job, duplicates: await findDuplicates(generatedItems(job)) });
});

export const reviewJob = asyncHandler(async (req, res) => {
  if (!ensureEnabled(res)) return;
  const job = await getPersistentJob(req.params.jobId, req.user.role === 'super_admin' ? null : req.user.sub);
  if (!job) return res.status(404).json({ error: 'Generation job not found or expired.' });
  const decisions = await saveReviewDecisions(job.id, req.user.sub, Array.isArray(req.body?.decisions) ? req.body.decisions : []);
  res.json({ decisions });
});

export const publishJob = asyncHandler(async (req, res) => {
  if (!ensureEnabled(res)) return;
  const job = await getPersistentJob(req.params.jobId, req.user.role === 'super_admin' ? null : req.user.sub);
  if (!job) return res.status(404).json({ error: 'Generation job not found or expired.' });
  const decisions = new Map((await saveReviewDecisions(job.id, req.user.sub, Array.isArray(req.body?.decisions) ? req.body.decisions : [])).map((item) => [item.item_id, item]));
  const items = generatedItems(job);
  const duplicates = await findDuplicates(items);
  duplicates.forEach((item) => { const decision = decisions.get(item.itemId); if (decision) decision.duplicate = item.duplicate; });
  const published = await publishApproved({ job, adminId: req.user.sub, decisions, items });
  res.status(201).json({ published });
});
