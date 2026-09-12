// Run against a development database. All fixtures are rolled back.
import { randomUUID } from 'node:crypto';
import { pool } from '../src/config/database.js';
import router from '../src/routes/publishedContent.js';
import assert from 'node:assert/strict';

const client = await pool.connect();
const originalQuery = pool.query;
pool.query = (...args) => client.query(...args);
try {
  await client.query('BEGIN');
  const { rows: users } = await client.query('SELECT user_id FROM users LIMIT 1');
  assert.ok(users.length, 'A development user is required');
  const studentId = users[0].user_id;
  const jobId = randomUUID();
  const emtId = randomUUID();
  const paraId = randomUUID();
  await client.query("INSERT INTO ai_generation_jobs (id,admin_id,content_type,title) VALUES ($1,$2,'exam','Verification fixture')", [jobId, studentId]);
  for (const [id, program, status] of [[emtId, 'EMT', 'published'], [paraId, 'Paramedic', 'published'], [randomUUID(), 'EMT', 'draft']]) {
    await client.query(`INSERT INTO ai_published_content
      (id,job_id,source_item_id,content_type,title,program,status,destination_key,content_json)
      VALUES ($1::uuid,$2,($1::uuid)::text,'exam','Fixture',$3,$4,'psychometric_clinical',$5)`,
    [id, jobId, program, status, JSON.stringify({ question: 'Fixture prompt', options: ['A', 'B'], correctAnswer: 'A' })]);
  }
  const invoke = (path, method, req) => new Promise((resolve, reject) => {
    const layer = router.stack.find((item) => item.route?.path === path && item.route.methods[method]);
    const res = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { resolve({ status: this.statusCode, body }); } };
    layer.route.stack.at(-1).handle({ user: { sub: studentId }, ...req }, res, reject);
  });
  const feed = await invoke('/', 'get', { query: { program: 'EMT', destination: 'psychometric_clinical' } });
  assert.equal(feed.status, 200);
  assert.ok(feed.body.content.some((item) => item.id === emtId));
  assert.ok(!feed.body.content.some((item) => item.id === paraId));
  assert.ok(feed.body.content.every((item) => !('correctAnswer' in item.content_json)));
  const denied = await invoke('/:id/responses', 'post', { params: { id: paraId }, body: { program: 'EMT', response: 'A' } });
  assert.equal(denied.status, 404);
  const submitted = await invoke('/:id/responses', 'post', { params: { id: emtId }, body: { program: 'EMT', response: 'A' } });
  assert.equal(submitted.status, 201);
  assert.equal(submitted.body.status, 'awaiting_review');
  console.log('PASS: pathway separation, answer protection, response persistence, cross-pathway rejection');
} finally {
  await client.query('ROLLBACK');
  pool.query = originalQuery;
  client.release();
  await pool.end();
}
