import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { pool } from '../src/config/database.js';
import { ensureQuestionBankSchema } from '../src/services/questionBankSchema.js';
import { calculatePrediction, plannerOptions, updateCard, getPredictions, generatePlan, getPlan, recordStudySession } from '../src/services/adaptivePlannerService.js';

assert.throws(() => plannerOptions({ program: 'both' }));
assert.throws(() => plannerOptions({ program: 'EMT', dailyStudyHours: 0 }));
assert.throws(() => plannerOptions({ program: 'EMT', examDate: '2027-02-31' }));
const now = new Date('2026-09-21T12:00:00Z');
const normal = updateCard(null, 90, now, 'Operations');
const priority = updateCard(null, 90, now, 'Cardiology');
assert.ok(normal.stability > 0 && normal.difficulty >= 1);
assert.equal(priority.due - now, (normal.due - now) / 3);
assert.equal(calculatePrediction({ topic: 'A', scores: [], examDays: 10, dailyStudyHours: 1 }).predictedMasteryDate, null);
assert.equal(calculatePrediction({ topic: 'A', scores: [80, 90], examDays: 10, dailyStudyHours: 1 }).riskScore, 0);
const oneHour = calculatePrediction({ topic: 'A', scores: [30, 40], examDays: 30, dailyStudyHours: 1 });
const twoHours = calculatePrediction({ topic: 'A', scores: [30, 40], examDays: 30, dailyStudyHours: 2 });
assert.ok(twoHours.riskScore < oneHour.riskScore);

await ensureQuestionBankSchema();
const db = await pool.connect();
const originalQuery = pool.query;
const originalConnect = pool.connect;
await db.query('BEGIN');
pool.query = (...args) => db.query(...args);
// Keep service transactions inside one rollback-only integration fixture.
pool.connect = async () => ({ query: (sql, values) => /^(BEGIN|COMMIT|ROLLBACK)$/.test(sql) ? Promise.resolve({ rows: [] }) : db.query(sql, values), release() {} });
try {
  const user = (await db.query('SELECT user_id FROM users LIMIT 1')).rows[0].user_id;
  const modules = (await db.query("SELECT DISTINCT ON (program) id,title,program FROM mcq_modules WHERE is_active=true ORDER BY program,order_number")).rows;
  assert.equal(modules.length, 2);
  const module = modules.find((item) => item.program === 'EMT');
  const id = randomUUID();
  await db.query(`INSERT INTO student_mcq_attempts(id,student_id,module_id,score,percentage,total_questions,correct_answers,wrong_answers,passed,attempt_number,completed_at,submitted_answers,review_payload)
    SELECT $1,$2,$3,7,70,10,7,3,false,COALESCE(MAX(attempt_number),0)+1,now(),'[]','[]' FROM student_mcq_attempts WHERE student_id=$2 AND module_id=$3`, [id, user, module.id]);
  const input = { program: 'EMT', dailyStudyHours: 2, examDate: '2027-01-01' };
  await getPredictions(user, input);
  await getPredictions(user, input);
  assert.equal((await db.query('SELECT count(*)::int AS n FROM user_study_history WHERE attempt_id=$1', [id])).rows[0].n, 1);
  const { plan } = await generatePlan(user, input);
  assert.equal(plan.blocks.length, 4);
  assert.equal(plan.program, 'EMT');
  const completed = await recordStudySession(user, { program: 'EMT', blockId: plan.blocks[0].id, performance: 100 });
  assert.equal(completed.block.completed, true);
  const selfReport = (await db.query("SELECT performance FROM user_study_history WHERE user_id=$1 AND source_kind='self_report' AND program='EMT' ORDER BY created_at DESC LIMIT 1", [user])).rows[0];
  assert.equal(selfReport.performance, null);
  const paramedic = await generatePlan(user, { ...input, program: 'Paramedic' });
  assert.equal(paramedic.plan.program, 'Paramedic');
  assert.equal((await getPlan(user, { program: 'EMT' })).id, plan.id);
  console.log('PASS: FSRS updates, 3x priority cadence, risk hours, input validation, verified-attempt idempotency, full scheduling, persistent completion, pathway isolation');
} finally {
  pool.query = originalQuery; pool.connect = originalConnect;
  await db.query('ROLLBACK'); db.release(); await pool.end();
}
