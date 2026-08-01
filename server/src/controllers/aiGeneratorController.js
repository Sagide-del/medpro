import { query, withTransaction } from '../config/database.js';
import { asyncHandler } from '../utils/helpers.js';
import {
  createGenerationJob,
  failGenerationJob,
  finishGenerationJob,
  getGenerationJob,
  updateGenerationJob,
} from '../services/masterAiGeneratorService.js';
import { getSignedPdfUrl } from '../services/storage.js';

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

function stripCodeFence(input = '') {
  return String(input)
    .replace(/```json\s*/gi, '```')
    .replace(/^```[\w-]*\s*/m, '')
    .replace(/\s*```$/m, '')
    .trim();
}

function safeJsonParse(value, fallback = null) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

async function callDeepSeek(messages, { model = 'deepseek-v4-pro', temperature = 0.2 } = {}) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY is not configured.');
  }

  const baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      stream: false,
      reasoning_effort: 'high',
      extra_body: { thinking: { type: 'enabled' } },
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`DeepSeek request failed (${response.status}): ${text.slice(0, 300)}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content || '';
}

async function extractPdfTextFromUrl(fileUrl) {
  if (!fileUrl) return '';
  try {
    const signedUrl = await getSignedPdfUrl(fileUrl, 3600);
    const response = await fetch(signedUrl, { redirect: 'follow' });
    if (!response.ok) return '';
    const bytes = Buffer.from(await response.arrayBuffer());
    const pdfModule = await import('pdf-parse');
    const pdfParse = pdfModule.default || pdfModule;
    const parsed = await pdfParse(bytes);
    return cleanText(parsed?.text || '').slice(0, 12000);
  } catch {
    return '';
  }
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

async function extractSourceMaterial({ sourceType, sourceText, sourceUrl, sourceFileUrl, sourceTitle, sourceOrigin, sourceDate }) {
  const title = cleanText(sourceTitle);
  const origin = cleanText(sourceOrigin);
  const date = cleanText(sourceDate);
  const text = cleanText(sourceText);
  if (text) {
    return {
      sourceText: text.slice(0, 12000),
      sourceTitle: title,
      sourceOrigin: origin,
      sourceDate: date,
      sourceNote: 'Text pasted by user.',
    };
  }

  if (sourceType === 'pdf' && sourceFileUrl) {
    const pdfText = await extractPdfTextFromUrl(sourceFileUrl);
    if (pdfText) {
      return {
        sourceText: pdfText,
        sourceTitle: title || 'Uploaded PDF',
        sourceOrigin: origin,
        sourceDate: date,
        sourceNote: 'PDF text extracted from upload.',
      };
    }
  }

  if (sourceType === 'url' && sourceUrl) {
    const urlText = await loadUrlExcerpt(sourceUrl);
    if (urlText) {
      return {
        sourceText: urlText.slice(0, 12000),
        sourceTitle: title || cleanText(sourceUrl),
        sourceOrigin: origin,
        sourceDate: date,
        sourceNote: 'Web content extracted from URL.',
      };
    }
  }

  return {
    sourceText: cleanText(title || sourceUrl || sourceFileUrl || ''),
    sourceTitle: title,
    sourceOrigin: origin,
    sourceDate: date,
    sourceNote: 'No extractable source text found.',
  };
}

async function analyzeSourceContent({ sourceType, sourceText, sourceTitle, sourceOrigin, sourceDate, sourceUrl, contentType, audience, topic, difficulty }) {
  const prompt = [
    'Analyze the source material for MedProHub content generation.',
    'Use only the supplied source text. Do not invent facts.',
    `Content type: ${contentType}`,
    `Target audience: ${audience}`,
    `Topic hint: ${topic || 'Not provided'}`,
    `Difficulty: ${difficulty}`,
    `Source title: ${sourceTitle || 'Not provided'}`,
    `Source origin: ${sourceOrigin || 'Not provided'}`,
    `Source date: ${sourceDate || 'Not provided'}`,
    `Source URL: ${sourceUrl || 'Not provided'}`,
    `Source type: ${sourceType}`,
    '',
    'SOURCE MATERIAL:',
    sourceText.slice(0, 12000) || 'No source text available.',
    '',
    'Return strict JSON with keys:',
    '{',
    '  "incident_type": string,',
    '  "location": string,',
    '  "date": string,',
    '  "key_facts": string[],',
    '  "patient_population": string,',
    '  "education_focus": string[],',
    '  "recommended_tags": string[],',
    '  "structure_notes": string,',
    '  "warnings": string[]',
    '}',
  ].join('\n');

  const raw = await callDeepSeek([
    {
      role: 'system',
      content: 'You are an expert EMS curriculum developer for Kenya. Respond only in strict JSON.',
    },
    { role: 'user', content: prompt },
  ]);
  return safeJsonParse(stripCodeFence(raw), {});
}

async function generateSourceDrivenDraft({ contentType, title, sourceText, analysis, audience, topic, difficulty, questionCount, includeAnswerKey, includeFeedback, bloomPriority, sourceTitle, sourceOrigin, sourceDate, sourceUrl }) {
  const prompt = [
    'Generate source-driven educational content for MedProHub.',
    'Use ONLY the source material and analysis below. Do not invent facts or generic placeholders.',
    'If the source does not specify something, use "Not stated in source."',
    `Content type: ${contentType}`,
    `Draft title: ${title}`,
    `Audience: ${audience}`,
    `Topic hint: ${topic || 'Not provided'}`,
    `Difficulty: ${difficulty}`,
    `Question count: ${questionCount}`,
    `Include answer key: ${includeAnswerKey ? 'yes' : 'no'}`,
    `Include feedback: ${includeFeedback ? 'yes' : 'no'}`,
    `Prioritize higher-order thinking: ${bloomPriority ? 'yes' : 'no'}`,
    `Source title: ${sourceTitle || 'Not provided'}`,
    `Source origin: ${sourceOrigin || 'Not provided'}`,
    `Source date: ${sourceDate || 'Not provided'}`,
    `Source URL: ${sourceUrl || 'Not provided'}`,
    '',
    'ANALYSIS JSON:',
    JSON.stringify(analysis || {}, null, 2),
    '',
    'SOURCE MATERIAL:',
    sourceText.slice(0, 12000) || 'No source text available.',
    '',
    'Return strict JSON with keys:',
    '{',
    '  "title": string,',
    '  "summary": string,',
    '  "source_alignment": string,',
    '  "preview_questions": [',
    '    {',
    '      "type": "multiple_choice" | "true_false" | "short_answer" | "scenario_step",',
    '      "question": string,',
    '      "options": string[] | null,',
    '      "answer": string,',
    '      "feedback": string,',
    '      "bloom_level": string,',
    '      "difficulty": string',
    '    }',
    '  ],',
    '  "answer_key": object,',
    '  "content_notes": string[]',
    '}',
  ].join('\n');

  const raw = await callDeepSeek([
    {
      role: 'system',
      content: 'You are an expert EMS curriculum developer. Generate only source-based educational content in strict JSON.',
    },
    { role: 'user', content: prompt },
  ]);
  return safeJsonParse(stripCodeFence(raw), {});
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
  const sourceOrigin = cleanText(body.sourceOrigin || body.source_origin || '');
  const sourceDate = cleanText(body.sourceDate || body.source_date || '');
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
  const extractedSource = await extractSourceMaterial({
    sourceType,
    sourceText,
    sourceUrl,
    sourceFileUrl,
    sourceTitle,
    sourceOrigin,
    sourceDate,
  });
  const sourceExcerpt = cleanText(extractedSource.sourceText || sourceText || sourceUrl || sourceFileName || title).slice(0, 12000);
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
        sourceOrigin: sourceOrigin || null,
        sourceDate: sourceDate || null,
        sourceFileUrl,
        sourceFileName,
        prompt,
      sourceExcerpt,
      sourceNote: extractedSource.sourceNote,
      previewQuestions: [],
      answerKey: {},
    },
  });

  updateGenerationJob(job.jobId, {
    status: 'running',
    progress: 15,
    description: 'Source content extracted',
  });

  setTimeout(async () => {
    try {
      updateGenerationJob(job.jobId, {
        status: 'running',
        progress: 40,
        description: 'Analyzing source material',
      });

      const analysis = await analyzeSourceContent({
        sourceType,
        sourceText: sourceExcerpt,
        sourceTitle,
        sourceOrigin,
        sourceDate,
        sourceUrl,
        contentType,
        audience,
        topic,
        difficulty,
      });

      updateGenerationJob(job.jobId, {
        status: 'running',
        progress: 70,
        description: 'Generating source-based content',
      });

      const generated = await generateSourceDrivenDraft({
        contentType,
        title,
        sourceText: sourceExcerpt,
        analysis,
        audience,
        topic,
        difficulty,
        questionCount,
        includeAnswerKey,
        includeFeedback,
        bloomPriority,
      });

      const previewQuestions = Array.isArray(generated.preview_questions)
        ? generated.preview_questions.map((question, index) => ({
          id: `${job.jobId}-preview-${index + 1}`,
          type: cleanText(question.type || 'short_answer'),
          question: cleanText(question.question || question.prompt || ''),
          options: Array.isArray(question.options) ? question.options : [],
          answer: cleanText(question.answer || question.correct_answer || ''),
          feedback: cleanText(question.feedback || question.explanation || ''),
          bloom_level: cleanText(question.bloom_level || question.bloomLevel || ''),
          difficulty: cleanText(question.difficulty || difficulty),
        }))
        : [];

      const answerKey = generated.answer_key && typeof generated.answer_key === 'object' ? generated.answer_key : {};
      const contentNotes = Array.isArray(generated.content_notes) ? generated.content_notes : [];
      const previewDraft = cleanText(generated.summary || generated.source_alignment || `${title} draft generated from source material.`);

      finishGenerationJob(job.jobId, {
        title: cleanText(generated.title || title),
        contentType,
        destination,
        generationProfile,
        sourceType,
        sourceUrl: sourceUrl || null,
        sourceTitle: sourceTitle || null,
        sourceOrigin: sourceOrigin || null,
        sourceDate: sourceDate || null,
        sourceFileUrl,
        sourceFileName,
        prompt,
        sourceExcerpt,
        sourceNote: extractedSource.sourceNote,
        analysis,
        previewQuestions,
        answerKey,
        contentNotes,
        draft: previewDraft,
      });
    } catch (error) {
      failGenerationJob(job.jobId, error.message);
      updateGenerationJob(job.jobId, {
        status: 'failed',
        description: error.message,
      });
    }
  }, 0);

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
      sourceNote: extractedSource.sourceNote,
      previewQuestions: [],
      answerKey: {},
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
