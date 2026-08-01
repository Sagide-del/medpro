import { randomUUID } from 'crypto';

const jobs = new Map();

function clampProgress(value) {
  const num = Number(value) || 0;
  return Math.max(0, Math.min(100, Math.round(num)));
}

export function createGenerationJob({
  type = 'content',
  title = 'Generating content',
  description = '',
  etaSeconds = 0,
  result = null,
} = {}) {
  const jobId = randomUUID();
  const job = {
    jobId,
    type,
    title,
    description,
    progress: 0,
    status: 'queued',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    etaSeconds: clampProgress(etaSeconds),
    result,
  };

  jobs.set(jobId, job);
  return job;
}

export function updateGenerationJob(jobId, patch = {}) {
  const current = jobs.get(jobId);
  if (!current) return null;
  const next = {
    ...current,
    ...patch,
    progress: patch.progress != null ? clampProgress(patch.progress) : current.progress,
    updatedAt: new Date().toISOString(),
  };
  jobs.set(jobId, next);
  return next;
}

export function getGenerationJob(jobId) {
  return jobs.get(jobId) || null;
}

export function finishGenerationJob(jobId, result = null) {
  const current = jobs.get(jobId);
  if (!current) return null;
  const next = updateGenerationJob(jobId, {
    progress: 100,
    status: 'completed',
    result: result ?? current.result,
  });
  return next;
}

export function failGenerationJob(jobId, errorMessage = 'Generation failed') {
  const current = jobs.get(jobId);
  if (!current) return null;
  const next = updateGenerationJob(jobId, {
    progress: current.progress,
    status: 'failed',
    error: errorMessage,
  });
  return next;
}

