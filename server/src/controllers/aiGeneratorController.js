import { query, withTransaction } from '../config/database.js';
import { asyncHandler } from '../utils/helpers.js';
import {
  createGenerationJob,
  finishGenerationJob,
  getGenerationJob,
  updateGenerationJob,
} from '../services/masterAiGeneratorService.js';

const CONTENT_DESTINATIONS = {
  case_study: 'Question Bank',
  simulation: 'Simulation Library',
  assignment: 'Assignment Bank',
  exam: 'Exam Center',
  video_script: 'Video Script Bank',
  worksheet: 'Worksheet Bank',
};

function cleanText(value) {
  return String(value || '').trim();
}

function normalizeContentType(value) {
  const next = cleanText(value).toLowerCase();
  if (['case', 'case_study', 'case-study', 'case study'].includes(next)) return 'case_study';
  if (['simulation', 'skill_simulation', 'skill-simulation'].includes(next)) return 'simulation';
  if (['assignment', 'assignments'].includes(next)) return 'assignment';
  if (['exam', 'mcq_exam', 'mcq', 'assessment'].includes(next)) return 'exam';
  if (['video_script', 'video script', 'video'].includes(next)) return 'video_script';
  if (['worksheet'].includes(next)) return 'worksheet';
  return 'case_study';
}

function normalizeSourceType(value) {
  const next = cleanText(value).toLowerCase();
  if (['pdf', 'article', 'url'].includes(next)) return next;
  return 'article';
}

function stripHtml(input = '') {
  return String(input)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function loadUrlExcerpt(url) {
  if (!url) return '';
  try {
    const response = await fetch(url, { redirect: 'follow' });
    if (!response.ok) return '';
    const contentType = response.headers.get('content-type') || '';
    const body = await response.text();
    if (contentType.includes('text/html') || contentType.includes('text/plain')) {
      return stripHtml(body).slice(0, 5000);
    }
    return body.slice(0, 2000);
  } catch {
    return '';
  }
}

function buildSourceSummary({ sourceType, sourceTitle, sourceText, sourceUrl, sourceFileName, prompt, contentType }) {
  const sections = [
    `Artifact: ${CONTENT_DESTINATIONS[contentType] || 'Question Bank'}`,
    `Source type: ${sourceType}`,
    sourceTitle ? `Source title: ${sourceTitle}` : '',
    sourceFileName ? `Source file: ${sourceFileName}` : '',
    sourceUrl ? `Source URL: ${sourceUrl}` : '',
    sourceText ? `Source excerpt:\n${sourceText}` : '',
    prompt ? `Generation brief:\n${prompt}` : '',
  ].filter(Boolean);

  return sections.join('\n\n');
}

function parseJsonBoolean(value, fallback = false) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
    if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  }
  return fallback;
}

function parseQuestionTypes(value) {
  if (!value) {
    return {
      multipleChoice: true,
      trueFalse: true,
      numeric: false,
      shortAnswer: true,
    };
  }

  if (typeof value === 'object') {
    return {
      multipleChoice: !!value.multipleChoice,
      trueFalse: !!value.trueFalse,
      numeric: !!value.numeric,
      shortAnswer: !!value.shortAnswer,
    };
  }

  try {
    const parsed = JSON.parse(value);
    return parseQuestionTypes(parsed);
  } catch {
    return {
      multipleChoice: true,
      trueFalse: true,
      numeric: false,
      shortAnswer: true,
    };
  }
}

function splitIds(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === 'string') {
    return value.split(',').map((item) => String(item).trim()).filter(Boolean);
  }
  return [];
}

function normalizeCaseRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    difficulty: row.difficulty,
    description: row.description || '',
    location: row.location || '',
    incident_date: row.incident_date || null,
    passing_percentage: row.passing_percentage ?? row.passing_score ?? null,
    is_active: row.is_active,
    created_by: row.created_by || null,
    created_by_name: row.created_by_name || null,
    order_number: row.order_number || null,
    content_json: row.content_json || {},
    grading_json: row.grading_json || {},
    customization_json: row.content_json?.customization_json || {},
    created_at: row.created_at,
    updated_at: row.updated_at || null,
  };
}

async function loadCaseById(id) {
  const { rows } = await query(
    `SELECT cs.*, creator.full_name AS created_by_name
     FROM case_studies cs
     LEFT JOIN users creator ON creator.user_id = cs.created_by
     WHERE cs.id = $1
     LIMIT 1`,
    [id]
  );
  return normalizeCaseRow(rows[0]);
}

function sanitizeIdList(ids = []) {
  return Array.isArray(ids)
    ? ids.map((id) => String(id).trim()).filter(Boolean)
    : [];
}

function bufferForPdf(textLines = []) {
  const safeLines = textLines.map((line) => String(line).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)'));
  const stream = [
    'BT',
    '/F1 16 Tf',
    '72 760 Td',
    safeLines.length ? safeLines.map((line, index) => `${index === 0 ? '' : '0 -20 Td '}(${line}) Tj`).join('\n') : '(MedProHub) Tj',
    'ET',
  ].join('\n');

  const header = '%PDF-1.4\n';
  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj',
    `4 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream endobj`,
    '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
  ];
  let body = header;
  const offsets = [0];
  objects.forEach((obj) => {
    offsets.push(body.length);
    body += `${obj}\n`;
  });
  const xrefStart = body.length;
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    body += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  body += `trailer << /Root 1 0 R /Size ${objects.length + 1} >>\nstartxref\n${xrefStart}\n%%EOF`;
  return Buffer.from(body, 'binary');
}

export const startGeneration = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const contentType = normalizeContentType(body.contentType || body.content_type || 'case_study');
  const sourceType = normalizeSourceType(body.sourceType || body.source_type || (req.file ? 'pdf' : 'article'));
  const title = cleanText(body.title || body.sourceTitle || body.source_title || 'Generated content');
  const prompt = cleanText(body.prompt || body.instructions || '');
  const sourceUrl = cleanText(body.sourceUrl || body.source_url || '');
  const sourceTitle = cleanText(body.sourceTitle || body.source_title || '');
  const sourceText = cleanText(body.sourceText || body.source_text || '');
  const sourceFileUrl = req.file?.location || req.file?.url || req.file?.path || null;
  const sourceFileName = req.file?.originalname || null;
  const audience = cleanText(body.audience || body.targetAudience || 'emt-basic');
  const topic = cleanText(body.topic || body.subject || '');
  const difficulty = cleanText(body.difficulty || body.level || 'Intermediate');
  const questionCount = Math.max(10, Math.min(Number(body.questionCount || body.question_count || 20) || 20, 100));
  const bloomPriority = parseJsonBoolean(body.bloomPriority, true);
  const includeAnswerKey = parseJsonBoolean(body.includeAnswerKey, true);
  const includeFeedback = parseJsonBoolean(body.includeFeedback, true);
  const suggestDiagramPlaceholders = parseJsonBoolean(body.suggestDiagramPlaceholders, false);
  const autoTagByTopic = parseJsonBoolean(body.autoTagByTopic, true);
  const publishDestination = cleanText(body.publishDestination || body.targetLibrary || 'question_bank');
  const schoolAccess = cleanText(body.schoolAccess || 'all');
  const selectedSchoolIds = splitIds(body.selectedSchoolIds || body.schoolIds || []);
  const parsedQuestionTypes = parseQuestionTypes(body.questionTypes || body.question_types);
  const destination = CONTENT_DESTINATIONS[contentType] || 'Question Bank';
  const extractedExcerpt = sourceType === 'url' ? await loadUrlExcerpt(sourceUrl) : '';
  const sourceExcerpt = (sourceText || extractedExcerpt || (sourceFileName ? `Uploaded file: ${sourceFileName}` : '')).slice(0, 5000);
  const summary = buildSourceSummary({
    sourceType,
    sourceTitle,
    sourceText: sourceExcerpt,
    sourceUrl,
    sourceFileName,
    prompt,
    contentType,
  });
  const generationProfile = {
    audience,
    topic,
    difficulty,
    questionCount,
    bloomPriority,
    includeAnswerKey,
    includeFeedback,
    suggestDiagramPlaceholders,
    autoTagByTopic,
    publishDestination,
    schoolAccess,
    selectedSchoolIds,
    questionTypes: parsedQuestionTypes,
  };

  const job = createGenerationJob({
    type: contentType,
    title,
    description: summary || prompt || title,
    etaSeconds: 8,
    result: {
      title,
      contentType,
      destination,
      generationProfile,
      sourceType,
      sourceUrl: sourceUrl || null,
      sourceTitle: sourceTitle || null,
      sourceFileUrl,
      sourceFileName,
      prompt,
    },
  });

  updateGenerationJob(job.jobId, { status: 'running', progress: 20 });

  setTimeout(() => {
    finishGenerationJob(job.jobId, {
      title,
      contentType,
      destination,
      generationProfile,
      sourceType,
      sourceUrl: sourceUrl || null,
      sourceTitle: sourceTitle || null,
      sourceFileUrl,
      sourceFileName,
      prompt,
      sourceExcerpt,
      draft: prompt || sourceExcerpt || `${title} draft generated successfully.`,
    });
  }, 1200);

  res.status(201).json({
    jobId: job.jobId,
    job,
    draft: {
      title,
      contentType,
      prompt,
      destination,
      generationProfile,
      sourceType,
      sourceUrl: sourceUrl || null,
      sourceTitle: sourceTitle || null,
      sourceFileUrl,
      sourceFileName,
      sourceExcerpt,
    },
  });
});

export const getGenerationProgress = asyncHandler(async (req, res) => {
  const job = getGenerationJob(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Generation job not found.' });
  res.json({ job });
});

export const customizeContent = asyncHandler(async (req, res) => {
  const type = String(req.params.type || '').toLowerCase();
  if (!['case', 'case_study', 'kenya_ems_case', 'case-study'].includes(type)) {
    return res.status(400).json({ error: 'Unsupported content type.' });
  }

  const item = await loadCaseById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Content item not found.' });

  res.json({ item });
});

export const saveCustomizedContent = asyncHandler(async (req, res) => {
  const { type = 'case', id, customization = {} } = req.body || {};
  if (!id) return res.status(400).json({ error: 'id is required.' });
  if (!['case', 'case_study', 'kenya_ems_case', 'case-study'].includes(String(type).toLowerCase())) {
    return res.status(400).json({ error: 'Unsupported content type.' });
  }

  const item = await loadCaseById(id);
  if (!item) return res.status(404).json({ error: 'Content item not found.' });

  const nextContentJson = {
    ...(item.content_json || {}),
    customization_json: {
      ...(item.content_json?.customization_json || {}),
      ...customization,
    },
  };

  const rows = await withTransaction(async (db) => {
    const { rows: updated } = await db.query(
      `UPDATE case_studies
       SET content_json = $2::jsonb,
           updated_at = now()
       WHERE id = $1
       RETURNING *`,
      [id, JSON.stringify(nextContentJson)]
    );
    return updated;
  });

  res.json({ item: normalizeCaseRow(rows[0]) });
});

export const bulkApproveContent = asyncHandler(async (req, res) => {
  const ids = sanitizeIdList(req.body?.ids);
  if (!ids.length) return res.status(400).json({ error: 'ids are required.' });

  const { rows } = await query(
    `UPDATE case_studies
     SET is_active = true,
         updated_at = now()
     WHERE id = ANY($1::uuid[])
     RETURNING id`,
    [ids]
  );

  res.json({ updated: rows.map((row) => row.id) });
});

export const bulkRejectContent = asyncHandler(async (req, res) => {
  const ids = sanitizeIdList(req.body?.ids);
  if (!ids.length) return res.status(400).json({ error: 'ids are required.' });

  const { rows } = await query(
    `UPDATE case_studies
     SET is_active = false,
         updated_at = now()
     WHERE id = ANY($1::uuid[])
     RETURNING id`,
    [ids]
  );

  res.json({ updated: rows.map((row) => row.id) });
});

export const exportPdf = asyncHandler(async (req, res) => {
  const { title = 'MedProHub Export', content = '' } = req.body || {};
  const pdf = bufferForPdf([String(title), '', String(content).slice(0, 1800)]);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${String(title).replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'medprohub'}.pdf"`);
  res.send(pdf);
});
