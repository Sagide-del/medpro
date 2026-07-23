import { SimulationEngine } from '../models/SimulationEngine.js';
import { asyncHandler } from '../utils/helpers.js';

function categoryFromScenario(scenario) {
  const skill = String(scenario.skill || '').toLowerCase();
  if (skill.includes('airway') || skill.includes('ventilation') || skill.includes('oxygen')) return 'Airway';
  if (skill.includes('trauma') || skill.includes('bleeding') || skill.includes('spinal')) return 'Trauma';
  if (skill.includes('cardiac') || skill.includes('stemi') || skill.includes('chest pain')) return 'Cardiology';
  if (skill.includes('ob') || skill.includes('childbirth')) return 'Obstetrics';
  if (skill.includes('mass casualty') || skill.includes('operations') || skill.includes('behavioral')) return 'Operations';
  return 'Medical Emergencies';
}

export const startSimulationAttempt = asyncHandler(async (req, res) => {
  const scenario = req.body.scenario;
  if (!scenario?.id || !scenario?.skill || !Array.isArray(scenario.actions)) {
    return res.status(400).json({ error: 'Scenario metadata is required to start a simulation.' });
  }

  const simulation = await SimulationEngine.upsertSimulation({
    externalScenarioId: scenario.id,
    title: scenario.skill,
    category: scenario.category || categoryFromScenario(scenario),
    scenarioType: scenario.type,
    skill: scenario.skill,
    instructions: scenario.instructions,
    dispatch: scenario.dispatch,
    actions: scenario.actions,
  });

  const attempt = await SimulationEngine.startAttempt({
    simulationId: simulation.simulation_id,
    studentId: req.user.sub,
    institutionId: req.user.institutionId,
  });

  res.status(201).json({ attempt, simulation });
});

export const completeSimulationAttempt = asyncHandler(async (req, res) => {
  const attempt = await SimulationEngine.findAttempt(req.params.id);
  if (!attempt || attempt.student_id !== req.user.sub) {
    return res.status(404).json({ error: 'Simulation attempt not found.' });
  }

  const completed = await SimulationEngine.completeAttempt({
    attemptId: req.params.id,
    selectedActionIds: req.body.selectedActionIds || [],
    program: req.body.program || 'EMT',
  });

  res.json(completed);
});

export const mySimulationResults = asyncHandler(async (req, res) => {
  const results = await SimulationEngine.resultsForStudent(req.user.sub);
  res.json({ results });
});

export const myLatestSimulationResult = asyncHandler(async (req, res) => {
  const result = await SimulationEngine.latestResultForStudent(req.user.sub);
  res.json({ result });
});

export const teacherSimulationPerformance = asyncHandler(async (req, res) => {
  const results = await SimulationEngine.teacherPerformance(req.user.sub, req.user.institutionId);
  res.json({ results });
});
