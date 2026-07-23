import { query, withTransaction } from '../config/database.js';

function inferWeakAreas(selectedLabels, incorrectSteps, scenarioMeta) {
  const weak = new Set();
  if (incorrectSteps.some((step) => step.is_critical)) weak.add(scenarioMeta.skill);
  if (incorrectSteps.some((step) => step.is_harmful)) weak.add(`${scenarioMeta.category} protocol safety`);
  if (selectedLabels.length === 0) weak.add(`${scenarioMeta.category} clinical decision-making`);
  return [...weak];
}

function recommendationForScore(score, scenarioMeta, criticalErrors) {
  if (criticalErrors > 0) return `Review ${scenarioMeta.skill} safety checkpoints and retry this simulation.`;
  if (score >= 85) return `Strong performance. Review advanced ${scenarioMeta.skill} refinements to keep improving.`;
  if (score >= 70) return `Competent overall. Review ${scenarioMeta.skill} sequencing to raise your score further.`;
  return `Review ${scenarioMeta.skill} fundamentals before repeating this simulation.`;
}

export const SimulationEngine = {
  async upsertSimulation({ externalScenarioId, title, category, scenarioType, skill, instructions, dispatch, actions = [] }) {
    return withTransaction(async (tx) => {
      const { rows } = await tx.query(
        `INSERT INTO simulations (external_scenario_id, title, category, scenario_type, skill, instructions, dispatch, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'published')
         ON CONFLICT (external_scenario_id)
         DO UPDATE SET title = EXCLUDED.title,
                       category = EXCLUDED.category,
                       scenario_type = EXCLUDED.scenario_type,
                       skill = EXCLUDED.skill,
                       instructions = EXCLUDED.instructions,
                       dispatch = EXCLUDED.dispatch
         RETURNING *`,
        [externalScenarioId, title, category, scenarioType || null, skill, instructions || null, dispatch || null]
      );
      const simulation = rows[0];

      await tx.query(`DELETE FROM simulation_steps WHERE simulation_id = $1`, [simulation.simulation_id]);
      for (let index = 0; index < actions.length; index += 1) {
        const action = actions[index];
        await tx.query(
          `INSERT INTO simulation_steps (simulation_id, step_key, label, is_critical, is_correct, is_harmful, position)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [simulation.simulation_id, action.id, action.label, !!action.critical, !!action.correct, !!action.harmful, index]
        );
      }

      return simulation;
    });
  },

  async startAttempt({ simulationId, studentId, institutionId }) {
    const { rows } = await query(
      `INSERT INTO simulation_attempts (simulation_id, student_id, institution_id)
       VALUES ($1,$2,$3)
       RETURNING *`,
      [simulationId, studentId, institutionId || null]
    );
    return rows[0];
  },

  async findAttempt(attemptId) {
    const { rows } = await query(
      `SELECT sa.*, s.external_scenario_id, s.title, s.category, s.skill, s.scenario_type
       FROM simulation_attempts sa
       JOIN simulations s ON s.simulation_id = sa.simulation_id
       WHERE sa.simulation_attempt_id = $1`,
      [attemptId]
    );
    return rows[0] || null;
  },

  async stepsForSimulation(simulationId) {
    const { rows } = await query(
      `SELECT * FROM simulation_steps WHERE simulation_id = $1 ORDER BY position`,
      [simulationId]
    );
    return rows;
  },

  async recommendedCards(program, category, skill) {
    const { rows } = await query(
      `SELECT clinical_card_id, title, module, topic, skill
       FROM clinical_reference_cards
       WHERE status = 'published' AND program = $1 AND (topic = $2 OR skill = $3 OR module = $2)
       ORDER BY created_at DESC
       LIMIT 3`,
      [program, category, skill]
    );
    return rows;
  },

  async completeAttempt({ attemptId, selectedActionIds = [], program = 'EMT' }) {
    const attempt = await this.findAttempt(attemptId);
    if (!attempt) return null;
    const steps = await this.stepsForSimulation(attempt.simulation_id);
    const selected = new Set(selectedActionIds || []);
    const criticalSteps = steps.filter((step) => step.is_critical);
    const correctSteps = steps.filter((step) => step.is_correct);
    const incorrectSteps = steps.filter((step) => (step.is_correct && !selected.has(step.step_key)) || (step.is_harmful && selected.has(step.step_key)));
    const harmfulSelected = steps.filter((step) => step.is_harmful && selected.has(step.step_key));
    const criticalHit = criticalSteps.filter((step) => selected.has(step.step_key)).length;
    const correctSelected = correctSteps.filter((step) => selected.has(step.step_key)).length;
    const durationSeconds = Math.max(1, Math.round((Date.now() - new Date(attempt.started_at).getTime()) / 1000));
    const clinicalDecisionScore = criticalSteps.length ? Number(((criticalHit / criticalSteps.length) * 100).toFixed(2)) : 0;
    const protocolComplianceScore = correctSteps.length ? Number(((correctSelected / correctSteps.length) * 100).toFixed(2)) : 0;
    const timeScore = Math.max(40, 100 - Math.floor(durationSeconds / 45));
    const criticalErrors = harmfulSelected.length;
    const overallCompetencyScore = Number(Math.max(0, (clinicalDecisionScore * 0.45) + (protocolComplianceScore * 0.35) + (timeScore * 0.20) - (criticalErrors * 10)).toFixed(2));
    const weakAreas = inferWeakAreas(steps.filter((step) => selected.has(step.step_key)).map((step) => step.label), incorrectSteps, {
      category: attempt.category,
      skill: attempt.skill,
    });
    const recommendedCards = await this.recommendedCards(program, attempt.category, attempt.skill);
    const recommendedSimulations = weakAreas.length ? [`Repeat ${attempt.title}`, `${attempt.category} focused scenario review`] : [`Advance to another ${attempt.category} scenario`];
    const recommendation = recommendationForScore(overallCompetencyScore, { category: attempt.category, skill: attempt.skill }, criticalErrors);

    await query(
      `UPDATE simulation_attempts
       SET status = 'graded', submitted_at = now(), graded_at = now()
       WHERE simulation_attempt_id = $1`,
      [attemptId]
    );

    const { rows } = await query(
      `INSERT INTO simulation_results
       (simulation_attempt_id, clinical_decision_score, critical_errors, time_taken_seconds, actions_completed, protocol_compliance_score, overall_competency_score, weak_areas, recommended_cards, recommended_simulations, recommendation)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       ON CONFLICT (simulation_attempt_id)
       DO UPDATE SET clinical_decision_score = EXCLUDED.clinical_decision_score,
                     critical_errors = EXCLUDED.critical_errors,
                     time_taken_seconds = EXCLUDED.time_taken_seconds,
                     actions_completed = EXCLUDED.actions_completed,
                     protocol_compliance_score = EXCLUDED.protocol_compliance_score,
                     overall_competency_score = EXCLUDED.overall_competency_score,
                     weak_areas = EXCLUDED.weak_areas,
                     recommended_cards = EXCLUDED.recommended_cards,
                     recommended_simulations = EXCLUDED.recommended_simulations,
                     recommendation = EXCLUDED.recommendation
       RETURNING *`,
      [
        attemptId,
        clinicalDecisionScore,
        criticalErrors,
        durationSeconds,
        selectedActionIds.length,
        protocolComplianceScore,
        overallCompetencyScore,
        JSON.stringify(weakAreas),
        JSON.stringify(recommendedCards),
        JSON.stringify(recommendedSimulations),
        recommendation,
      ]
    );

    await query(
      `INSERT INTO student_performance (student_id, item_type, item_id, domain, score_pct, time_spent_sec, completed_at)
       VALUES ($1,'simulation',$2,'clinical',$3,$4,now())`,
      [attempt.student_id, attempt.simulation_id, overallCompetencyScore, durationSeconds]
    );

    return {
      attempt,
      result: rows[0],
    };
  },

  async resultsForStudent(studentId) {
    const { rows } = await query(
      `SELECT sr.*, s.title, s.category, s.skill, sa.simulation_attempt_id, sa.started_at, sa.graded_at
       FROM simulation_results sr
       JOIN simulation_attempts sa ON sa.simulation_attempt_id = sr.simulation_attempt_id
       JOIN simulations s ON s.simulation_id = sa.simulation_id
       WHERE sa.student_id = $1
       ORDER BY sa.graded_at DESC NULLS LAST, sa.started_at DESC`,
      [studentId]
    );
    return rows;
  },

  async latestResultForStudent(studentId) {
    const rows = await this.resultsForStudent(studentId);
    return rows[0] || null;
  },

  async teacherPerformance(teacherId, institutionId) {
    const { rows } = await query(
      `SELECT u.user_id, u.full_name, g.name AS group_name, s.title, s.category, s.skill,
              sr.overall_competency_score, sr.clinical_decision_score, sr.critical_errors, sr.time_taken_seconds,
              sr.weak_areas, sa.graded_at
       FROM simulation_results sr
       JOIN simulation_attempts sa ON sa.simulation_attempt_id = sr.simulation_attempt_id
       JOIN simulations s ON s.simulation_id = sa.simulation_id
       JOIN users u ON u.user_id = sa.student_id
       JOIN group_members gm ON gm.student_id = u.user_id
       JOIN groups g ON g.group_id = gm.group_id
       WHERE g.teacher_id = $1 AND sa.institution_id = $2
       ORDER BY sa.graded_at DESC NULLS LAST`,
      [teacherId, institutionId]
    );
    return rows;
  },
};
