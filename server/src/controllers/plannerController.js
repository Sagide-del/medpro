import { asyncHandler } from '../utils/helpers.js';
import { PLANNER_PREDICTION_ENABLED, generatePlan, getPlan, getPredictions, getWeakTopics, recordStudySession } from '../services/plannerPredictionService.js';

function enabled(res) { if (!PLANNER_PREDICTION_ENABLED) { res.status(404).json({ error: 'Planner predictions are not enabled.' }); return false; } return true; }

export const predictions = asyncHandler(async (req, res) => { if (!enabled(res)) return; res.json({ predictions: await getPredictions(req.user.sub, req.query.examDate) }); });
export const generate = asyncHandler(async (req, res) => { if (!enabled(res)) return; res.status(201).json(await generatePlan(req.user.sub, req.body || {})); });
export const weakTopics = asyncHandler(async (req, res) => { if (!enabled(res)) return; res.json({ topics: await getWeakTopics(req.user.sub) }); });
export const update = asyncHandler(async (req, res) => { if (!enabled(res)) return; res.status(201).json({ memory: await recordStudySession(req.user.sub, req.body || {}) }); });
export const recommendations = asyncHandler(async (req, res) => { if (!enabled(res)) return; const topics = await getWeakTopics(req.user.sub); res.json({ recommendations: topics.map((topic) => ({ topic: topic.topic, title: topic.mastery < 60 ? 'Needs urgent practice' : 'Keep building recall', reason: `${topic.mastery}% mastery against a 70% target`, action: topic.due ? 'Review now' : 'Schedule a 30-minute block' })) }); });
export const today = asyncHandler(async (req, res) => { if (!enabled(res)) return; res.json({ plan: await getPlan(req.user.sub) }); });
