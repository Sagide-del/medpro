import { query, withTransaction } from '../config/database.js';
import { asyncHandler } from '../utils/helpers.js';
import {
  createGenerationJob,
  finishGenerationJob,
  getGenerationJob,
  updateGenerationJob,
} from '../services/masterAiGeneratorService.js';

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
  const { prompt = '', contentType = 'case', title = 'Generated content' } = req.body || {};
  const job = createGenerationJob({
    type: contentType,
    title,
    description: prompt,
    etaSeconds: 8,
  });

  updateGenerationJob(job.jobId, { status: 'running', progress: 20 });

  setTimeout(() => {
    finishGenerationJob(job.jobId, {
      title,
      contentType,
      draft: prompt || `${title} draft generated successfully.`,
    });
  }, 1200);

  res.status(201).json({
    jobId: job.jobId,
    job,
    draft: {
      title,
      contentType,
      prompt,
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
