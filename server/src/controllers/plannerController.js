import { asyncHandler } from '../utils/helpers.js';
import { PLANNER_PREDICTION_ENABLED, generatePlan, getPlan, getPredictions, getWeakTopics, recordStudySession } from '../services/adaptivePlannerService.js';

function enabled(res) { if (!PLANNER_PREDICTION_ENABLED) { res.status(404).json({ error: 'Planner predictions are not enabled.' }); return false; } return true; }

function options(req) { const input = req.method === 'GET' ? req.query : req.body || {}; return { ...input, program: input.program || req.user.program }; }
export const predictions = asyncHandler(async (req, res) => { if (!enabled(res)) return; res.json({ predictions: await getPredictions(req.user.sub, options(req)) }); });
export const generate = asyncHandler(async (req, res) => { if (!enabled(res)) return; res.status(201).json(await generatePlan(req.user.sub, options(req))); });
export const weakTopics = asyncHandler(async (req, res) => { if (!enabled(res)) return; res.json({ topics: await getWeakTopics(req.user.sub, options(req)) }); });
export const update = asyncHandler(async (req, res) => { if (!enabled(res)) return; res.status(201).json(await recordStudySession(req.user.sub, options(req))); });
export const recommendations = asyncHandler(async (req, res) => { if (!enabled(res)) return; const topics = await getWeakTopics(req.user.sub, options(req)); res.json({ recommendations: topics.map((topic) => ({ topic: topic.topic, moduleId: topic.moduleId, title: topic.attempts ? 'Build recall with focused practice' : 'Establish your baseline', reason: topic.attempts ? `${topic.mastery}% recent average against a 70% target` : 'Not enough verified assessment history yet', action: topic.due ? 'Review now' : 'Schedule a 30-minute block' })) }); });
export const today = asyncHandler(async (req, res) => { if (!enabled(res)) return; res.json({ plan: await getPlan(req.user.sub, options(req)) }); });
