import 'dotenv/config';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pool } from '../src/config/database.js';
import { User } from '../src/models/User.js';
import { Assessment } from '../src/models/Assessment.js';
import { QuestionBank } from '../src/models/QuestionBank.js';

const enabled = process.env.RUN_DB_TESTS === 'true';
test('Nursing migration is repeatable and students retain independent pathway progress', { skip: !enabled }, async () => {
  assert(['localhost', '127.0.0.1'].includes(new URL(process.env.DATABASE_URL).hostname), 'Use a local disposable development database.');
  const sql = await readFile(new URL('../src/migrations/nursing-pathway.sql', import.meta.url), 'utf8');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const before = await client.query("SELECT count(*)::int AS count FROM mcq_questions WHERE program IN ('EMT','Paramedic')");
    await client.query(sql); await client.query(sql);
    const after = await client.query("SELECT count(*)::int AS count FROM mcq_questions WHERE program IN ('EMT','Paramedic')");
    assert.equal(after.rows[0].count, before.rows[0].count);
    const duplicates = await client.query("SELECT question_text FROM mcq_questions WHERE program='Nursing' GROUP BY module_id,question_text HAVING count(*)>1");
    assert.equal(duplicates.rows.length, 0);
  } finally { await client.query('ROLLBACK'); client.release(); }
  const user = await User.create({ fullName: 'Nursing database test', email: `nursing-db-${Date.now()}@example.test`, password: 'TestOnly123!', program: 'Nursing' });
  try {
    const [paramedic, nursing] = await Promise.all([Assessment.listMcqModules(user.user_id, 'Paramedic'), Assessment.listMcqModules(user.user_id, 'Nursing')]);
    assert.equal(nursing.length, 4);
    assert.equal(nursing[0].status, 'available');
    assert.equal(paramedic[0].status, 'available');
    const bank = await QuestionBank.listQuestions({ studentId: user.user_id, program: 'Nursing' });
    assert(bank.questions.length >= 8);
    assert(bank.questions.every((question) => !('correct_option' in question)));
    const repeat = await Assessment.listMcqModules(user.user_id, 'Nursing');
    assert.equal(repeat[0].status, 'available');
  } finally { await pool.query('DELETE FROM users WHERE user_id=$1', [user.user_id]); }
});
test.after(async () => { await pool.end(); });
