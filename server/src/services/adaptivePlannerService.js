import { createEmptyCard, fsrs, Rating } from 'ts-fsrs';
import { query, withTransaction } from '../config/database.js';

// Rollback: disable PLANNER_PREDICTION_ENABLED. Retain history and FSRS cards.
export const PLANNER_PREDICTION_ENABLED = process.env.PLANNER_PREDICTION_ENABLED === 'true';
const scheduler = fsrs({ request_retention: 0.9, enable_fuzz: false, maximum_interval: 365 });
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const dayMs = 86400000;
function invalid(message) { return Object.assign(new Error(message), { status: 400, publicMessage: message }); }
export function plannerOptions({ program, examDate = null, dailyStudyHours = 1 } = {}) {
  if (!['EMT', 'Paramedic'].includes(program)) throw invalid('Select EMT or Paramedic.');
  const hours = Number(dailyStudyHours);
  if (!Number.isFinite(hours) || hours < 0.5 || hours > 8 || !Number.isInteger(hours * 2)) throw invalid('Study hours must be between 0.5 and 8 in half-hour increments.');
  if (examDate && (!/^\d{4}-\d{2}-\d{2}$/.test(examDate) || !Number.isFinite(Date.parse(examDate)) || new Date(examDate).toISOString().slice(0, 10) !== examDate)) throw invalid('Provide a valid exam date.');
  return { program, examDate, dailyStudyHours: hours };
}
export function highPriority(topic) { return /cardi|pediatr|paediatr|obstetric|ob\/gyn/i.test(topic); }
export function updateCard(previous, score, date, topic) {
  const card = previous ? { ...previous, due: new Date(previous.due), last_review: previous.last_review ? new Date(previous.last_review) : undefined } : createEmptyCard(date);
  const rating = score < 60 ? Rating.Again : score < 80 ? Rating.Hard : score < 95 ? Rating.Good : Rating.Easy;
  const next = scheduler.next(card, date, rating).card;
  if (highPriority(topic)) next.due = new Date(date.getTime() + Math.max(60000, (next.due.getTime() - date.getTime()) / 3));
  return next;
}
async function syncVerifiedAttempts(userId, program) {
  return withTransaction(async (db) => {
    await db.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`planner:${userId}:${program}`]);
    const { rows } = await db.query(`SELECT a.id,a.percentage,a.completed_at,m.title FROM student_mcq_attempts a
      JOIN mcq_modules m ON m.id=a.module_id WHERE a.student_id=$1 AND m.program=$2
      AND NOT EXISTS (SELECT 1 FROM user_study_history h WHERE h.attempt_id=a.id)
      ORDER BY a.completed_at,a.id`, [userId, program]);
    for (const attempt of rows) {
      const { rows: states } = await db.query('SELECT fsrs_card FROM memory_state WHERE user_id=$1 AND program=$2 AND topic=$3 FOR UPDATE', [userId, program, attempt.title]);
      const date = new Date(attempt.completed_at);
      const card = updateCard(states[0]?.fsrs_card, Number(attempt.percentage), date, attempt.title);
      await db.query(`INSERT INTO user_study_history(user_id,program,topic,performance,attempt_id,source_kind,studied_on,created_at)
        VALUES($1,$2,$3,$4,$5,'assessment',$6::timestamptz::date,$6::timestamptz) ON CONFLICT(attempt_id) DO NOTHING`, [userId, program, attempt.title, attempt.percentage, attempt.id, date]);
      await db.query(`INSERT INTO memory_state(user_id,program,topic,difficulty,stability,retrievability,last_reviewed_at,next_review_at,fsrs_card)
        VALUES($1,$2,$3,$4,$5,1,$6,$7,$8::jsonb) ON CONFLICT(user_id,program,topic) DO UPDATE SET
        difficulty=EXCLUDED.difficulty,stability=EXCLUDED.stability,retrievability=1,last_reviewed_at=EXCLUDED.last_reviewed_at,
        next_review_at=EXCLUDED.next_review_at,fsrs_card=EXCLUDED.fsrs_card,updated_at=now()`,
      [userId, program, attempt.title, card.difficulty, card.stability, date, card.due, JSON.stringify(card)]);
    }
    if (rows.length) await db.query('DELETE FROM risk_predictions WHERE user_id=$1 AND program=$2', [userId, program]);
  });
}
export function calculatePrediction({ topic, scores, difficulty = 5, due, examDays, dailyStudyHours, now = new Date() }) {
  const recent = scores.slice(-5);
  const mastery = recent.length ? recent.reduce((sum, score) => sum + score, 0) / recent.length : 0;
  const remaining = Math.max(0, 70 - mastery);
  const gains = recent.slice(1).map((score, index) => score - recent[index]);
  const learningRate = gains.length ? gains.reduce((sum, gain) => sum + gain, 0) / gains.length : null;
  const usableRate = learningRate !== null && learningRate > 0 ? learningRate : null;
  const hoursNeeded = remaining === 0 ? 0 : usableRate ? (remaining / usableRate) * 2 : null;
  const daysNeeded = hoursNeeded === null ? null : hoursNeeded / dailyStudyHours;
  const risk = remaining === 0 ? 0 : daysNeeded === null || examDays === null ? 1 : clamp(daysNeeded / Math.max(1, examDays), 0, 1);
  const importance = highPriority(topic) ? 1 : 0.7;
  const urgency = examDays === null ? 0.5 : clamp(14 / Math.max(1, examDays), 0, 1);
  const priority = clamp(urgency * 0.3 + clamp(difficulty / 10, 0, 1) * 0.2 + importance * 0.2 + (1 - mastery / 100) * 0.3, 0, 1);
  return { topic, mastery: Math.round(mastery), attempts: scores.length, learningRate,
    priorityScore: Number(priority.toFixed(3)), riskScore: risk, riskLevel: risk > 0.7 ? 'high' : risk >= 0.4 ? 'medium' : 'low',
    riskConfidence: gains.length >= 3 && usableRate && examDays !== null ? 'limited_observed_trend' : 'insufficient_history',
    predictedMasteryDate: daysNeeded === null || !Number.isFinite(daysNeeded) || daysNeeded > 3650 ? null : new Date(now.getTime() + daysNeeded * dayMs).toISOString().slice(0, 10),
    estimatedHoursNeeded: hoursNeeded, due: !due || new Date(due) <= now, next_review_at: due,
    algorithm: 'FSRS with heuristic allocation; no trained RF/PPO model' };
}
export async function getPredictions(userId, input = {}) {
  const { program, examDate, dailyStudyHours } = plannerOptions(input);
  await syncVerifiedAttempts(userId, program);
  const { rows: revision } = await query("SELECT count(*)::int AS n, max(created_at) AS latest FROM user_study_history WHERE user_id=$1 AND program=$2 AND source_kind='assessment'", [userId, program]);
  const contextKey = `v2:${new Date().toISOString().slice(0, 10)}:${examDate || ''}:${dailyStudyHours}:${revision[0].n}:${revision[0].latest?.toISOString() || ''}`;
  const { rows: modules } = await query('SELECT id,title FROM mcq_modules WHERE program=$1 AND is_active=true ORDER BY order_number', [program]);
  const { rows: cached } = await query(`SELECT prediction FROM risk_predictions WHERE user_id=$1 AND program=$2 AND context_key=$3 AND calculated_at > now()-interval '24 hours'`, [userId, program, contextKey]);
  if (cached.length === modules.length && cached.every((row) => modules.some((module) => module.id === row.prediction?.moduleId))) return cached.map((row) => ({ ...row.prediction, due: !row.prediction.next_review_at || new Date(row.prediction.next_review_at) <= new Date() }));
  const { rows: history } = await query(`SELECT topic,performance FROM user_study_history WHERE user_id=$1 AND program=$2 AND source_kind='assessment' ORDER BY created_at,attempt_id`, [userId, program]);
  const { rows: states } = await query('SELECT * FROM memory_state WHERE user_id=$1 AND program=$2', [userId, program]);
  const now = new Date();
  const examDays = examDate ? Math.max(0, Math.ceil((Date.parse(examDate) - now.getTime()) / dayMs)) : null;
  const predictions = modules.map((module) => {
    const state = states.find((row) => row.topic === module.title);
    const scores = history.filter((row) => row.topic === module.title).map((row) => Number(row.performance));
    const prediction = calculatePrediction({ topic: module.title, scores, difficulty: Number(state?.difficulty || 5), due: state?.next_review_at, examDays, dailyStudyHours, now });
    const card = state?.fsrs_card;
    return { ...prediction, moduleId: module.id, difficulty: Number(state?.difficulty || 5), last_reviewed_at: state?.last_reviewed_at || null, stability: Number(state?.stability || 0),
      retrievability: card ? scheduler.get_retrievability({ ...card, due: new Date(card.due), last_review: new Date(card.last_review) }, now, false) : null };
  });
  await withTransaction(async (db) => {
    for (const prediction of predictions) await db.query(`INSERT INTO risk_predictions(user_id,program,topic,priority_score,risk_score,risk_level,current_mastery,predicted_mastery_date,exam_date,context_key,prediction)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb) ON CONFLICT(user_id,program,topic) DO UPDATE SET
      priority_score=EXCLUDED.priority_score,risk_score=EXCLUDED.risk_score,risk_level=EXCLUDED.risk_level,current_mastery=EXCLUDED.current_mastery,
      predicted_mastery_date=EXCLUDED.predicted_mastery_date,exam_date=EXCLUDED.exam_date,context_key=EXCLUDED.context_key,prediction=EXCLUDED.prediction,calculated_at=now()`,
    [userId, program, prediction.topic, prediction.priorityScore, prediction.riskScore, prediction.riskLevel, prediction.mastery, prediction.predictedMasteryDate, examDate, contextKey, JSON.stringify(prediction)]);
  });
  return predictions;
}
export async function generatePlan(userId, input = {}) {
  const options = plannerOptions(input);
  const predictions = await getPredictions(userId, options);
  const rank = (item) => item.due ? 0 : item.priorityScore > 0.7 ? 1 : item.riskLevel === 'high' ? 2 : 3;
  const ordered = [...predictions].sort((a, b) => rank(a) - rank(b) || b.priorityScore - a.priorityScore || a.mastery - b.mastery);
  const blocks = [];
  for (let index = 0; ordered.length && index < options.dailyStudyHours * 2; index++) {
    const item = ordered[index % ordered.length];
    blocks.push({ id: `${item.moduleId}-${index}`, moduleId: item.moduleId, topic: item.topic, minutes: 30, startMinute: index * 30,
      reason: item.due ? 'Due for review' : item.priorityScore > 0.7 ? 'High priority' : item.riskLevel === 'high' ? 'High risk / limited history' : 'Focused practice',
      mastery: item.mastery, completed: false, target: 70 });
  }
  const { rows } = await query(`INSERT INTO study_plans(user_id,program,plan_date,exam_date,daily_study_hours,blocks)
    VALUES($1,$2,CURRENT_DATE,$3,$4,$5::jsonb) ON CONFLICT(user_id,program,plan_date) DO UPDATE SET
    exam_date=EXCLUDED.exam_date,daily_study_hours=EXCLUDED.daily_study_hours,blocks=EXCLUDED.blocks,created_at=now() RETURNING *`,
  [userId, options.program, options.examDate, options.dailyStudyHours, JSON.stringify(blocks)]);
  return { plan: rows[0], predictions };
}
export async function recordStudySession(userId, input = {}) {
  const { program } = plannerOptions(input);
  if (!input.blockId) throw invalid('Choose a scheduled block. Assessment scores are recorded by the server, not this endpoint.');
  return withTransaction(async (db) => {
    const { rows } = await db.query('SELECT * FROM study_plans WHERE user_id=$1 AND program=$2 AND plan_date=CURRENT_DATE FOR UPDATE', [userId, program]);
    const plan = rows[0];
    const block = plan?.blocks.find((item) => item.id === input.blockId);
    if (!block) throw invalid('Scheduled block not found.');
    if (!block.completed) {
      block.completed = true;
      await db.query('UPDATE study_plans SET blocks=$2::jsonb WHERE id=$1', [plan.id, JSON.stringify(plan.blocks)]);
      await db.query(`INSERT INTO user_study_history(user_id,program,topic,duration_minutes,source_kind) VALUES($1,$2,$3,$4,'self_report')`, [userId, program, block.topic, block.minutes]);
    }
    return { plan, block };
  });
}
export async function getPlan(userId, input) { const { program } = plannerOptions(input); const { rows } = await query('SELECT * FROM study_plans WHERE user_id=$1 AND program=$2 AND plan_date=CURRENT_DATE', [userId, program]); return rows[0] || null; }
export async function getWeakTopics(userId, input) { return (await getPredictions(userId, input)).sort((a, b) => b.riskScore - a.riskScore || a.mastery - b.mastery).slice(0, 3); }
