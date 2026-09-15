import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { pool } from '../src/config/database.js';
import { ensureQuestionBankSchema } from '../src/services/questionBankSchema.js';
import { normalizeQuestion, publishQuestion } from '../src/services/publishQuestion.js';
import { QuestionBank } from '../src/models/QuestionBank.js';

assert.throws(() => normalizeQuestion({ question: 'Invalid', options: ['A', 'B'], answer: 'Z' }));
assert.equal(normalizeQuestion({ question: 'Boolean', type: 'true_false', answer: 'False' }).correct, 'option_b');
await ensureQuestionBankSchema();
const client = await pool.connect();
const original = pool.query;
pool.query = (...args) => client.query(...args);
try {
  await client.query('BEGIN');
  const studentId = (await client.query('SELECT user_id FROM users LIMIT 1')).rows[0].user_id;
  const moduleId = (await client.query("SELECT id FROM mcq_modules WHERE program='EMT' LIMIT 1")).rows[0].id;
  const id = randomUUID();
  const jobId = randomUUID();
  await client.query("INSERT INTO ai_generation_jobs(id, admin_id, content_type, title) VALUES ($1,$2,'exam','Publishing test')", [jobId, studentId]);
  const item = { question: 'Publishing integration fixture', options: ['First', 'Second', 'Third', 'Fourth'], answer: 'B', type: 'multiple_choice', difficulty: 'Hard' };
  await client.query(`INSERT INTO ai_published_content(id,job_id,source_item_id,content_type,title,program,topic,destination_key,status,content_json)
    VALUES ($1,$2,'test','exam','Fixture','EMT','Fixture','questions','published',$3)`, [id, jobId, JSON.stringify(item)]);
  const record = { id, program: 'EMT', topic: 'Fixture', content_json: item };
  const tx = { query: (...args) => client.query(...args) };
  await publishQuestion(tx, record, moduleId);
  await publishQuestion(tx, record, moduleId);
  assert.equal((await client.query('SELECT count(*)::int AS count FROM mcq_questions WHERE id=$1', [id])).rows[0].count, 1);
  const matching = await QuestionBank.listQuestions({ studentId, program: 'EMT', questionId: id, questionType: 'multiple_choice', difficulty: 'hard' });
  assert.equal(matching.questions.length, 1);
  assert.ok(!('correct_option' in matching.questions[0]));
  for (const filter of [{ program: 'Paramedic' }, { difficulty: 'medium' }, { questionType: 'true_false' }]) {
    assert.equal((await QuestionBank.listQuestions({ studentId, program: 'EMT', questionId: id, ...filter })).questions.length, 0);
  }
  await client.query("UPDATE ai_published_content SET status='draft' WHERE id=$1", [id]);
  assert.equal((await QuestionBank.listQuestions({ studentId, program: 'EMT', questionId: id })).questions.length, 0);
  console.log('PASS: publish, repeat publish, answer-key validation, pathway/type/difficulty filters, unpublish visibility');
} finally {
  await client.query('ROLLBACK'); pool.query = original; client.release(); await pool.end();
}
