import { ragConfiguration } from './ragConfiguration.js';
import { processNextIncidentTask } from './incidentGenerationService.js';
import { randomUUID } from 'node:crypto';
import { query, withTransaction } from '../config/database.js';
import { ragEnabled, ragError, readableScopes } from './ragService.js';
import { buildBookPlan, contentFingerprint } from './bookGenerationPlan.js';
import { generateRetrievedDraft } from './groundedGenerationService.js';

export function bookGenerationConfig() {
  return { indexingEnabled: ragEnabled(), indexingConfigured: ragConfiguration().configured, indexingIssues: ragConfiguration().issues, generationConfigured: Boolean(process.env.DEEPSEEK_API_KEY), maxTasks: 200 };
}
async function sourceFor(user, id) {
  const { rows } = await query('SELECT * FROM rag_sources WHERE id=$1 AND scope_key=ANY($2::text[])', [id, readableScopes(user)]);
  if (!rows[0]) throw ragError('Source not found in your scope.', 404);
  return rows[0];
}
export async function bookCoverage(user, id) {
  const source = await sourceFor(user, id);
  const { rows } = await query(`SELECT chapter_title,count(*)::int AS passages,min(page_number)::int AS first_page,
    max(page_number)::int AS last_page FROM rag_source_passages WHERE document_id=$1 GROUP BY chapter_title ORDER BY min(page_number)`, [id]);
  return { source: { id: source.id, status: source.status, program: source.program, subject: source.subject,
    filename: source.filename, version: source.version, pageCount: source.page_count, global: source.scope_key === 'global' }, chapters: rows };
}
export async function planBook(user, input) {
  const source = await sourceFor(user, input.sourceId);
  if (source.status !== 'ready' || !source.approved_by) throw ragError('Approve and finish indexing the source first.', 409);
  const { rows: passages } = await query('SELECT chunk_id,page_number,chapter_title FROM rag_source_passages WHERE document_id=$1 ORDER BY page_number,ordinal', [source.id]);
  return { source, plan: buildBookPlan(source, passages, input) };
}
export async function createBookRun(user, input) {
  if (!ragEnabled() || !process.env.DEEPSEEK_API_KEY) throw ragError('Enable source indexing and configure the generation provider before starting a book run.', 503);
  if (input.clientToken && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.clientToken)) throw ragError('Invalid run request token.');
  const { source, plan } = await planBook(user, input);
  return withTransaction(async (db) => {
    if (input.clientToken) {
      await db.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`book-request:${user.sub}:${input.clientToken}`]);
      const existing = await db.query(`SELECT r.id,count(t.id)::int AS count FROM book_generation_runs r
        JOIN book_generation_tasks t ON t.run_id=r.id WHERE r.created_by=$1 AND r.client_token=$2 GROUP BY r.id`, [user.sub, input.clientToken]);
      if (existing.rows[0]) return { id: existing.rows[0].id, taskCount: existing.rows[0].count, estimatedModelCalls: existing.rows[0].count * 2 };
    }
    // Lock the catalog row so withdrawal/reindex cannot race with plan creation.
    const current = await db.query("SELECT id FROM rag_sources WHERE id=$1 AND status='ready' AND approved_by IS NOT NULL AND version=$2 AND file_hash=$3 FOR SHARE", [source.id, source.version, source.file_hash]);
    if (!current.rows.length) throw ragError('The source changed. Refresh the coverage plan.', 409);
    const { rows: runs } = await db.query(`INSERT INTO book_generation_runs(source_id,source_version,source_hash,created_by,settings,client_token)
      VALUES($1,$2,$3,$4,$5::jsonb,$6) RETURNING id`, [source.id, source.version, source.file_hash, user.sub, JSON.stringify({ ...input, questionsPerBatch: plan.questionsPerBatch }), input.clientToken || null]);
    const runId = runs[0].id;
    const modules = new Map();
    for (const target of [...plan.targets].sort((a,b) => a.program.localeCompare(b.program))) {
      if (!plan.destinations.includes('question_bank')) continue;
      let moduleId = target.moduleId;
      if (!moduleId) {
        await db.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`book-module:${target.program}`]);
        const existing = await db.query('SELECT id FROM mcq_modules WHERE program=$1 AND lower(title)=lower($2) AND is_active=true ORDER BY order_number LIMIT 1', [target.program, source.subject.slice(0,160)]);
        moduleId = existing.rows[0]?.id;
        if (!moduleId) {
          const created = await db.query(`INSERT INTO mcq_modules(program,title,description,order_number,total_questions)
            SELECT $1::varchar(40),$2::varchar(160),$3::text,COALESCE(max(order_number),0)+1,0 FROM mcq_modules WHERE program=$1::varchar(40) RETURNING id`,
          [target.program, source.subject.slice(0,160), `Source-grounded revision for ${source.subject}. Content appears after review and publication.`]);
          moduleId = created.rows[0].id;
        }
      }
      const valid = await db.query('SELECT id FROM mcq_modules WHERE id=$1 AND program=$2 AND is_active=true', [moduleId, target.program]);
      if (!valid.rows.length) throw ragError('Choose an active module belonging to each selected study track.');
      modules.set(target.program, moduleId);
    }
    for (const task of plan.tasks) {
      const jobId = randomUUID();
      const references = task.chunkIds.map((id) => ({ document_id: source.id, chunk_id: id, version: source.version }));
      const request = { audience: task.program, moduleId: modules.get(task.program), useRag: true,
        sourceReferences: references, topic: task.chapter, publishDestination: task.destination,
        bookRunId: runId, questionCount: plan.questionsPerBatch, difficulty: plan.difficulty, questionTypes: plan.questionTypes };
      await db.query(`INSERT INTO ai_generation_jobs(id,admin_id,content_type,title,request_json,source_type,citation)
        VALUES($1,$2,$3,$4,$5::jsonb,'indexed_book',$6)`, [jobId, user.sub, task.destination,
      `${source.subject}: ${task.chapter} · ${task.program} · ${task.destination}`, JSON.stringify(request), `${source.filename}, ${source.version}, PDF pages ${task.firstPage}–${task.lastPage}`]);
      await db.query(`INSERT INTO book_generation_tasks(run_id,job_id,program,destination,chapter_title,first_page,last_page,chunk_ids)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8)`, [runId, jobId, task.program, task.destination, task.chapter, task.firstPage, task.lastPage, task.chunkIds]);
    }
    return { id: runId, taskCount: plan.tasks.length, estimatedModelCalls: plan.estimatedModelCalls };
  });
}
export async function listBookRuns(user) {
  const { rows } = await query(`SELECT r.*,s.filename,s.subject,s.scope_key,
    count(t.id)::int AS total,count(*) FILTER(WHERE t.status='queued')::int AS queued,
    count(*) FILTER(WHERE t.status='generating')::int AS generating,count(*) FILTER(WHERE t.status='review' AND t.generated_count > (SELECT count(*) FROM ai_published_content p WHERE p.job_id=t.job_id AND p.status='published'))::int AS review,
    count(*) FILTER(WHERE t.status='review' AND t.generated_count=0 AND t.duplicate_count=0)::int AS unsupported,
    count(*) FILTER(WHERE t.status='failed')::int AS failed,count(*) FILTER(WHERE j.status='published')::int AS published,
    COALESCE(sum(t.generated_count),0)::int AS drafts,COALESCE(sum(t.duplicate_count),0)::int AS duplicates
    FROM book_generation_runs r JOIN rag_sources s ON s.id=r.source_id
    JOIN book_generation_tasks t ON t.run_id=r.id JOIN ai_generation_jobs j ON j.id=t.job_id
    WHERE ($1::uuid IS NULL OR r.created_by=$1) AND s.scope_key=ANY($2::text[])
    GROUP BY r.id,s.filename,s.subject,s.scope_key ORDER BY r.created_at DESC LIMIT 50`,
  [user.role === 'super_admin' ? null : user.sub, readableScopes(user)]);
  return rows;
}
export async function getBookRun(user, id) {
  const { rows } = await query(`SELECT r.*,s.scope_key,s.status AS source_status FROM book_generation_runs r JOIN rag_sources s ON s.id=r.source_id
    WHERE r.id=$1 AND ($2::uuid IS NULL OR r.created_by=$2) AND s.scope_key=ANY($3::text[])`,
  [id, user.role === 'super_admin' ? null : user.sub, readableScopes(user)]);
  if (!rows[0]) throw ragError('Book run not found in your scope.', 404);
  const tasks = await query(`SELECT t.*,j.status AS job_status,j.title,j.result_json->'contentNotes' AS content_notes,
    (SELECT count(*)::int FROM ai_published_content p WHERE p.job_id=t.job_id AND p.status='published') AS published_count FROM book_generation_tasks t JOIN ai_generation_jobs j ON j.id=t.job_id
    WHERE run_id=$1 ORDER BY t.created_at,t.first_page,t.program,t.destination`, [id]);
  return { run: rows[0], tasks: tasks.rows };
}
export async function controlBookRun(user, id, action) {
  const detail = await getBookRun(user, id);
  if (action !== 'pause' && detail.run.source_status !== 'ready') throw ragError('The source must be ready before resuming or retrying this run.', 409);
  if (!['pause', 'resume', 'retry_failed'].includes(action)) throw ragError('Unknown run action.');
  await withTransaction(async (db) => {
    if (action === 'retry_failed') {
      await db.query("UPDATE ai_generation_jobs SET status='queued' WHERE id IN (SELECT job_id FROM book_generation_tasks WHERE run_id=$1 AND status='failed')", [id]);
      await db.query("UPDATE book_generation_tasks SET status='queued',attempts=0,error=NULL,claim_token=NULL,updated_at=now() WHERE run_id=$1 AND status='failed'", [id]);
    } else await db.query('UPDATE book_generation_runs SET paused=$2 WHERE id=$1', [id, action === 'pause']);
  });
}

// One durable task per claim. Multiple API instances share this PostgreSQL queue.
export async function processNextBookTask({ generate = generateRetrievedDraft, runId = null } = {}) {
  const task = await withTransaction(async (db) => {
    await db.query(`UPDATE book_generation_tasks SET status=CASE WHEN attempts<2 THEN 'queued' ELSE 'failed' END,
      error='Generation was interrupted; retry failed batches if needed.',claim_token=NULL
      WHERE status='generating' AND updated_at < now()-interval '15 minutes' AND ($1::uuid IS NULL OR run_id=$1)`, [runId]);
    const { rows } = await db.query(`SELECT t.*,r.source_id,r.source_version,r.source_hash FROM book_generation_tasks t
      JOIN book_generation_runs r ON r.id=t.run_id WHERE t.status='queued' AND NOT r.paused AND ($1::uuid IS NULL OR r.id=$1)
      ORDER BY t.created_at,t.first_page FOR UPDATE OF t SKIP LOCKED LIMIT 1`, [runId]);
    if (!rows[0]) return null;
    const token = randomUUID();
    await db.query("UPDATE book_generation_tasks SET status='generating',attempts=attempts+1,claim_token=$2,updated_at=now() WHERE id=$1", [rows[0].id, token]);
    await db.query("UPDATE ai_generation_jobs SET status='generating',updated_at=now() WHERE id=$1", [rows[0].job_id]);
    return { ...rows[0], token };
  });
  if (!task) return false;
  try {
    const { rows } = await query(`SELECT p.*,s.filename,s.version,s.scope_key,s.subject FROM rag_source_passages p JOIN rag_sources s ON s.id=p.document_id
      WHERE p.document_id=$1 AND p.chunk_id=ANY($2::text[]) AND s.status='ready' AND s.approved_by IS NOT NULL
      AND s.version=$3 AND s.file_hash=$4 ORDER BY p.page_number,p.ordinal`, [task.source_id, task.chunk_ids, task.source_version, task.source_hash]);
    if (rows.length !== task.chunk_ids.length) throw ragError('Source was withdrawn, changed, or reindexed. Refresh its plan before continuing.', 409);
    const chunks = rows.map((row) => ({ document_id: row.document_id, chunk_id: row.chunk_id, page_number: row.page_number,
      version: row.version, source_document: row.filename, text: row.passage_text, clinical_subject: row.subject }));
    const job = (await query('SELECT request_json FROM ai_generation_jobs WHERE id=$1', [task.job_id])).rows[0];
    const generated = await generate({ chunks, program: task.program, topic: task.chapter_title,
      destination: task.destination, count: job.request_json.questionCount, types: job.request_json.questionTypes || ['multiple_choice'], difficulty: job.request_json.difficulty || 'intermediate' });
    if (!Array.isArray(generated.preview_questions) || (task.destination==='question_bank' && !generated.preview_questions.length)) throw ragError('No supported content was generated for this passage batch.', 422);
    await withTransaction(async (db) => {
      const claim = await db.query("SELECT id FROM book_generation_tasks WHERE id=$1 AND claim_token=$2 AND status='generating' FOR UPDATE", [task.id, task.token]);
      if (!claim.rows.length) return;
      const active = await db.query("SELECT id FROM rag_sources WHERE id=$1 AND status='ready' AND approved_by IS NOT NULL AND version=$2 AND file_hash=$3 FOR SHARE", [task.source_id, task.source_version, task.source_hash]);
      if (!active.rows.length) throw ragError('Source is no longer available. Nothing was published.', 409);
      const items = [];
      for (const item of generated.preview_questions) {
        const fingerprint = contentFingerprint(item);
        const inserted = await db.query(`INSERT INTO book_content_fingerprints(scope_key,program,destination,fingerprint,job_id)
          VALUES($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING RETURNING fingerprint`, [rows[0].scope_key, task.program, task.destination, fingerprint, task.job_id]);
        if (inserted.rows.length) items.push({ ...item, id: randomUUID(), topic: task.chapter_title });
      }
      await db.query("UPDATE ai_generation_jobs SET status='completed',result_json=$2::jsonb,updated_at=now() WHERE id=$1", [task.job_id,
        JSON.stringify({ previewQuestions: items, contentNotes: generated.content_notes || [], bookRunId: task.run_id })]);
      await db.query("UPDATE book_generation_tasks SET status='review',generated_count=$3,duplicate_count=$4,error=NULL,updated_at=now() WHERE id=$1 AND claim_token=$2",
      [task.id, task.token, items.length, generated.preview_questions.length-items.length]);
    });
  } catch (error) {
    // Fail explicitly rather than continuously spending on an unsupported batch.
    await withTransaction(async (db) => {
      const providerFailure = error.providerStatus || ['TimeoutError','AbortError','TypeError'].includes(error.name);
      const changed = await db.query("UPDATE book_generation_tasks SET status='failed',error=$3,updated_at=now() WHERE id=$1 AND claim_token=$2 RETURNING job_id", [task.id, task.token,
        error.publicMessage || (providerFailure ? 'Generation provider unavailable. The run is paused; check provider access and limits, then retry and resume.' : 'This batch could not be generated. Check source/provider configuration, then retry.')]);
      if (changed.rows.length) {
        if (providerFailure || error.status === 409) await db.query('UPDATE book_generation_runs SET paused=true WHERE id=$1', [task.run_id]);
        await db.query("UPDATE ai_generation_jobs SET status='failed',updated_at=now() WHERE id=$1", [task.job_id]);
      }
    });
    console.error('Book generation batch failed:', error.publicMessage || error.name);
  }
  return true;
}
let timer;
let running = false;
export function startBookGenerationWorker() {
  if (!process.env.DEEPSEEK_API_KEY || timer) return;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      if (ragEnabled()) await processNextBookTask();
      await processNextIncidentTask();
    } catch (error) { console.error('Book queue unavailable:', error.name); }
    finally { running = false; }
  };
  timer = setInterval(tick, 3000); timer.unref(); void tick();
}
export function stopBookGenerationWorker() { clearInterval(timer); timer = undefined; }
