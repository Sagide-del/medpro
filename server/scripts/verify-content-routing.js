import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { pool } from '../src/config/database.js';
import { ensureQuestionBankSchema } from '../src/services/questionBankSchema.js';
import { publishApproved } from '../src/services/aiGeneratorV2Service.js';
import { gradePublishedResponse } from '../src/services/publishedGrading.js';
import { validateGroundedArtifacts } from '../src/services/ragService.js';

assert.equal((await gradePublishedResponse({ type: 'multiple_choice', options: ['Alpha', 'Beta'], answer: 'B' }, 'Beta')).score, 100);
assert.equal((await gradePublishedResponse({ type: 'true_false', answer: 'False' }, 'True')).score, 0);
assert.equal((await gradePublishedResponse({ type: 'short_answer' }, 'Answer')).status, 'awaiting_review');
const evidence = { chunk_id: 'one', document_id: randomUUID(), page_number: 1, version: '1', source_document: 'Fixture.pdf', text: 'A synthetic source with evidence for software testing only.' };
const artifact = { title: 'Fixture', summary: 'Synthetic source', sections: [{ heading: 'Test', text: evidence.text, chunk_id: 'one', evidence_quote: evidence.text }] };
assert.ok(validateGroundedArtifacts([artifact], [evidence], 'notes')[0].source_references.length);
assert.throws(() => validateGroundedArtifacts([{ ...artifact, sections: [{ ...artifact.sections[0], chunk_id: 'wrong' }] }], [evidence], 'notes'));
assert.throws(() => validateGroundedArtifacts([artifact], [evidence], 'psychometric_clinical'));
await ensureQuestionBankSchema();
const db = await pool.connect();
const originalQuery = pool.query, originalConnect = pool.connect;
await db.query('BEGIN');
pool.query = (...args) => db.query(...args);
pool.connect = async () => ({ query: (sql, values) => /^(BEGIN|COMMIT|ROLLBACK)$/.test(sql) ? Promise.resolve({ rows: [] }) : db.query(sql, values), release() {} });
try {
  const admin = (await db.query('SELECT user_id FROM users LIMIT 1')).rows[0].user_id;
  await db.query(`INSERT INTO rag_sources(id,scope_key,filename,file_hash,source_type,program,subject,version,status,created_by,approved_by)
    VALUES($1,'global','Fixture.pdf','fixture','textbook','EMT','Test','1','ready',$2,$2)`, [evidence.document_id, admin]);
  const destinations = { question_bank: 'questions', psychometric_clinical: 'psychometric_clinical', psychometric_situational: 'psychometric_situational', psychometric_readiness: 'psychometric_readiness',
    ems_cases: 'kenya_cases', notes: 'notes', study_guides: 'study_guides', drug_reference: 'drug_reference', clinical_protocols: 'clinical_protocols', cheat_sheets: 'cheat_sheets', podcast: 'podcasts', skills_videos: 'skills_videos', flashcards: 'flashcards', mnemonics: 'mnemonics', diagrams: 'diagrams' };
  const moduleId = (await db.query("SELECT id FROM mcq_modules WHERE program='EMT' LIMIT 1")).rows[0].id;
  for (const [destination, expected] of Object.entries(destinations)) {
    const jobId = randomUUID();
    await db.query("INSERT INTO ai_generation_jobs(id,admin_id,content_type,title) VALUES($1,$2,'notes','Fixture')", [jobId, admin]);
    const item = { ...validateGroundedArtifacts([artifact], [evidence], 'notes')[0], id: 'test', type: 'multiple_choice', options: ['First', 'Second'], answer: 'First', difficulty: 'Intermediate' };
    const job = { id: jobId, content_type: 'notes', request_json: { audience: 'emt-basic', moduleId, publishDestination: destination, useRag: true, sourceReferences: [{ document_id: evidence.document_id, chunk_id: 'one' }] } };
    await assert.rejects(publishApproved({ job, adminId: admin, items: [{ ...item, source_references: [] }], decisions: new Map([['test', { decision: 'approved' }]]) }), /requires evidence/);
    const [published] = await publishApproved({ job, adminId: admin, items: [item], decisions: new Map([['test', { decision: 'approved' }]]) });
    assert.equal(published.destination_key, expected, destination);
    assert.equal(published.program, 'EMT');
    assert.match(published.source_citation, /PDF page 1/);
  }
  console.log('PASS: all 15 publishing destinations, preserved evidence, EMT scoping, deterministic grading and resource validation');
} finally {
  pool.query = originalQuery; pool.connect = originalConnect;
  await db.query('ROLLBACK'); db.release(); await pool.end();
}
