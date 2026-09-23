import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { pool } from '../src/config/database.js';
import { ensureQuestionBankSchema } from '../src/services/questionBankSchema.js';
import { normalizeRagProgram, readableScopes, retrieveSources, validateGroundedQuestions } from '../src/services/ragService.js';

assert.equal(normalizeRagProgram('emt-paramedic'), 'Paramedic');
assert.throws(() => normalizeRagProgram('all-levels'));
assert.deepEqual(readableScopes({ role: 'teacher', sub: 'a', institutionId: 'school-a' }), ['global', 'institution:school-a']);
const chunk = { chunk_id: 'chunk1', document_id: 'doc1', page_number: 3, version: '6', source_document: 'source.pdf', text: 'This educational source contains a complete evidence statement.' };
const question = { question: 'Which evidence statement is present?', options: ['Complete evidence', 'No evidence'], answer: 'Complete evidence',
  feedback: 'The source contains a complete statement.', type: 'multiple_choice', difficulty: 'Intermediate', chunk_id: 'chunk1', evidence_quote: chunk.text };
const validate = (items) => validateGroundedQuestions(items, [chunk], 1, ['multiple_choice'], 'Intermediate');
assert.match(validate([question])[0].source_citation, /PDF page 3/);
for (const change of [{ chunk_id: 'invented' }, { evidence_quote: 'This is an invented quotation without evidence.' }, { answer: 'wrong' }, { difficulty: 'Advanced' }, { type: 'short_answer' }]) {
  assert.throws(() => validate([{ ...question, ...change }]));
}
assert.throws(() => validateGroundedQuestions([question, question], [chunk], 2, ['multiple_choice'], 'Intermediate'));

await ensureQuestionBankSchema();
const client = await pool.connect();
const originalQuery = pool.query;
const originalFetch = globalThis.fetch;
const savedEnv = { ...process.env };
pool.query = (...args) => client.query(...args);
try {
  await client.query('BEGIN');
  const user = (await client.query('SELECT user_id FROM users LIMIT 1')).rows[0];
  assert.ok(user, 'Local integration database needs a user fixture');
  const subject = `RAG fixture ${randomUUID()}`;
  const ids = {};
  for (const [name, program, scope, status, type] of [
    ['emt', 'EMT', 'global', 'ready', 'textbook'],
    ['para', 'Paramedic', 'global', 'ready', 'textbook'],
    ['both', 'both', 'global', 'ready', 'protocol'],
    ['private', 'EMT', 'institution:other', 'ready', 'textbook'],
    ['draft', 'EMT', 'global', 'uploaded', 'textbook'],
    ['drug', 'EMT', 'global', 'ready', 'drug_reference'],
  ]) {
    ids[name] = randomUUID();
    await client.query(`INSERT INTO rag_sources(id,scope_key,filename,file_hash,source_type,program,subject,version,status,created_by,approved_by)
      VALUES($1::uuid,$2,'fixture.pdf',$1::text,$3,$4,$5,'1',$6,$7,$7)`, [ids[name], scope, type, program, subject, status, user.user_id]);
  }
  process.env.RAG_ENABLED = 'true'; process.env.RAG_SERVICE_URL = 'http://test.invalid'; process.env.RAG_SERVICE_KEY = 'test-key';
  let selected;
  globalThis.fetch = async (_url, options) => {
    selected = JSON.parse(options.body).document_ids;
    return { ok: true, json: async () => ({ chunks: [
      ...selected.map((id) => ({ ...chunk, document_id: id })),
      { ...chunk, document_id: ids.private }, // service metadata cannot bypass Node authorization
    ] }) };
  };
  const caller = { sub: user.user_id, role: 'teacher', institutionId: 'mine' };
  const result = await retrieveSources(caller, { program: 'EMT', subject, search: 'evidence' });
  assert.deepEqual(new Set(selected), new Set([ids.emt, ids.both]));
  assert.equal(result.length, 2);
  await retrieveSources(caller, { program: 'Paramedic', subject, search: 'evidence' });
  assert.deepEqual(new Set(selected), new Set([ids.para, ids.both]));
  await retrieveSources(caller, { program: 'EMT', subject, search: 'evidence', destination: 'drug_reference' });
  assert.deepEqual(selected, [ids.drug]);
  await client.query("UPDATE rag_sources SET status='withdrawn' WHERE id=ANY($1::uuid[])", [[ids.emt, ids.both]]);
  await assert.rejects(retrieveSources(caller, { program: 'EMT', subject, search: 'evidence' }), /No approved/);
  await assert.rejects(retrieveSources(caller, { program: 'EMT', search: '' }), /Enter a topic/);
  await assert.rejects(retrieveSources(caller, { program: 'EMT', search: 'x', destination: 'unknown' }), /retrieval route/);
  console.log('PASS: exact pathway/tenant/source routing, withdrawn sources, missing evidence, citations, question filters and answer validation');
} finally {
  await client.query('ROLLBACK'); pool.query = originalQuery; globalThis.fetch = originalFetch;
  for (const key of ['RAG_ENABLED', 'RAG_SERVICE_URL', 'RAG_SERVICE_KEY']) {
    if (savedEnv[key] === undefined) delete process.env[key]; else process.env[key] = savedEnv[key];
  }
  client.release(); await pool.end();
}
