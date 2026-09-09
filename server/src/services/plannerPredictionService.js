import { query, withTransaction } from '../config/database.js';

// Rollback: set PLANNER_PREDICTION_ENABLED=false and the new routes return 404;
// the existing Study Plans UI and historical assessment routes remain usable.
export const PLANNER_PREDICTION_ENABLED = process.env.PLANNER_PREDICTION_ENABLED === 'true';

let schemaPromise;
const TOPICS = [
  ['Preparatory', 8], ['Airway & Breathing', 9], ['Cardiology', 10], ['Trauma', 10],
  ['Medical', 9], ['Pediatrics', 9], ['OB/GYN', 9], ['Pharmacology', 7], ['Operations', 6],
];

async function ensureSchema() {
  if (!schemaPromise) schemaPromise = (async () => {
    await query(`CREATE TABLE IF NOT EXISTS user_study_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
      topic TEXT NOT NULL, duration_minutes INTEGER NOT NULL DEFAULT 0, studied_on DATE NOT NULL DEFAULT CURRENT_DATE,
      performance NUMERIC(5,2), mood INTEGER, sleep_quality INTEGER, energy_level INTEGER,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
    await query(`CREATE INDEX IF NOT EXISTS idx_study_history_user_date ON user_study_history(user_id, studied_on DESC)`);
    await query(`CREATE TABLE IF NOT EXISTS memory_state (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
      topic TEXT NOT NULL, difficulty NUMERIC(5,2) NOT NULL DEFAULT 5, stability NUMERIC(8,2) NOT NULL DEFAULT 1,
      retrievability NUMERIC(6,4) NOT NULL DEFAULT 0.9, last_reviewed_at TIMESTAMPTZ, next_review_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(user_id, topic))`);
    await query(`CREATE TABLE IF NOT EXISTS risk_predictions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
      topic TEXT NOT NULL, priority_score NUMERIC(6,3) NOT NULL DEFAULT 0, risk_score NUMERIC(6,3) NOT NULL DEFAULT 0,
      risk_level TEXT NOT NULL DEFAULT 'low', current_mastery NUMERIC(5,2) NOT NULL DEFAULT 0,
      predicted_mastery_date DATE, exam_date DATE, calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(user_id, topic))`);
    await query(`CREATE TABLE IF NOT EXISTS study_plans (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
      plan_date DATE NOT NULL DEFAULT CURRENT_DATE, exam_date DATE, daily_study_hours NUMERIC(5,2) NOT NULL DEFAULT 1,
      blocks JSONB NOT NULL DEFAULT '[]'::jsonb, status TEXT NOT NULL DEFAULT 'active', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(user_id, plan_date))`);
  })().catch((error) => { schemaPromise = null; throw error; });
  return schemaPromise;
}

function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
function recall(stability, elapsedDays) { return clamp(Math.pow(0.9, elapsedDays / Math.max(1, stability)), 0, 1); }
function daysUntil(date) { return Math.max(0, Math.ceil((new Date(date).getTime() - Date.now()) / 86400000)); }
function topicImportance(topic) { return TOPICS.find(([name]) => name === topic)?.[1] || 5; }

async function topicRows(userId) {
  const { rows } = await query(`
    SELECT t.topic, COALESCE(m.retrievability, 0) AS retrievability, COALESCE(m.difficulty, 5) AS difficulty,
      COALESCE(m.stability, 1) AS stability, m.last_reviewed_at, m.next_review_at,
      COALESCE(AVG(h.performance), 0) AS mastery, COUNT(h.id)::int AS attempts
    FROM unnest($2::text[]) AS t(topic) LEFT JOIN memory_state m ON m.user_id = $1 AND m.topic = t.topic
    LEFT JOIN user_study_history h ON h.user_id = $1 AND h.topic = t.topic
    GROUP BY t.topic, m.retrievability, m.difficulty, m.stability, m.last_reviewed_at, m.next_review_at
    ORDER BY t.topic`, [userId, TOPICS.map(([topic]) => topic)]);
  return rows;
}

export async function getPredictions(userId, examDate = null) {
  await ensureSchema();
  const rows = await topicRows(userId);
  const examDays = examDate ? daysUntil(examDate) : 30;
  return rows.map((row) => {
    const mastery = Number(row.mastery || 0);
    const weakness = 1 - mastery / 100;
    const urgency = clamp(10 / Math.max(1, examDays), 0, 10);
    const priority = clamp((urgency * .3) + (Number(row.difficulty) * .2) + (topicImportance(row.topic) * .2) + (weakness * 10 * .3), 0, 10) / 10;
    const remaining = Math.max(0, 70 - mastery);
    const learningRate = row.attempts ? Math.max(1, mastery / row.attempts) : 3;
    const daysNeeded = (remaining / learningRate * 2) / 1;
    const risk = clamp(daysNeeded / Math.max(1, examDays), 0, 1);
    return { ...row, mastery: Math.round(mastery), priorityScore: Number(priority.toFixed(3)), riskScore: Number(risk.toFixed(3)), riskLevel: risk > .7 ? 'high' : risk >= .4 ? 'medium' : 'low', due: !row.next_review_at || new Date(row.next_review_at) <= new Date() };
  });
}

export async function generatePlan(userId, { examDate, dailyStudyHours = 1 } = {}) {
  const predictions = await getPredictions(userId, examDate);
  const ordered = [...predictions].sort((a, b) => Number(b.due) - Number(a.due) || b.priorityScore - a.priorityScore || b.riskScore - a.riskScore);
  const blockCount = Math.max(1, Math.floor(Number(dailyStudyHours) * 2));
  const blocks = ordered.slice(0, blockCount).map((item, index) => ({ id: `${item.topic}-${index}`, topic: item.topic, minutes: 30, reason: item.due ? 'Due for review' : item.riskLevel === 'high' ? 'High completion risk' : 'High priority', mastery: item.mastery, target: 70, completed: false }));
  await ensureSchema();
  const { rows } = await query(`INSERT INTO study_plans (user_id, plan_date, exam_date, daily_study_hours, blocks) VALUES ($1,CURRENT_DATE,$2,$3,$4::jsonb) ON CONFLICT (user_id, plan_date) DO UPDATE SET exam_date=EXCLUDED.exam_date, daily_study_hours=EXCLUDED.daily_study_hours, blocks=EXCLUDED.blocks, created_at=NOW() RETURNING *`, [userId, examDate || null, Number(dailyStudyHours), JSON.stringify(blocks)]);
  return { plan: rows[0], predictions };
}

export async function recordStudySession(userId, input = {}) {
  await ensureSchema();
  const topic = String(input.topic || '').trim();
  if (!topic) throw Object.assign(new Error('Topic is required.'), { status: 400 });
  const rating = clamp(Number(input.rating ?? 2), 0, 4);
  return withTransaction(async (tx) => {
    await tx.query(`INSERT INTO user_study_history (user_id, topic, duration_minutes, performance, mood, sleep_quality, energy_level) VALUES ($1,$2,$3,$4,$5,$6,$7)`, [userId, topic, Number(input.durationMinutes || 0), Number(input.performance || 0), input.mood ?? null, input.sleepQuality ?? null, input.energyLevel ?? null]);
    const { rows } = await tx.query(`SELECT * FROM memory_state WHERE user_id=$1 AND topic=$2 FOR UPDATE`, [userId, topic]);
    const previous = rows[0] || { stability: 1, difficulty: 5 };
    const stability = clamp(Number(previous.stability) * (1 + ((rating - 1.5) * .25)), 1, 365);
    const difficulty = clamp(Number(previous.difficulty) + (2 - rating) * .35, 0, 10);
    const nextReview = new Date(Date.now() + stability * 86400000);
    const memory = await tx.query(`INSERT INTO memory_state (user_id, topic, difficulty, stability, retrievability, last_reviewed_at, next_review_at) VALUES ($1,$2,$3,$4,$5,NOW(),$6) ON CONFLICT (user_id, topic) DO UPDATE SET difficulty=EXCLUDED.difficulty, stability=EXCLUDED.stability, retrievability=EXCLUDED.retrievability, last_reviewed_at=EXCLUDED.last_reviewed_at, next_review_at=EXCLUDED.next_review_at, updated_at=NOW() RETURNING *`, [userId, topic, difficulty, stability, .9, nextReview]);
    return memory.rows[0];
  });
}

export async function getPlan(userId) { await ensureSchema(); const { rows } = await query(`SELECT * FROM study_plans WHERE user_id=$1 AND plan_date=CURRENT_DATE`, [userId]); return rows[0] || null; }
export async function getWeakTopics(userId) { return (await getPredictions(userId)).sort((a, b) => b.riskScore - a.riskScore || a.mastery - b.mastery).slice(0, 3); }
