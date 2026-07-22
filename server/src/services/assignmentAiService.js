function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function overlapScore(modelAnswer, studentAnswer) {
  const modelTokens = tokenize(modelAnswer);
  const answerTokens = tokenize(studentAnswer);
  if (!modelTokens.length || !answerTokens.length) return 0;
  const answerSet = new Set(answerTokens);
  const matches = modelTokens.filter((token) => answerSet.has(token)).length;
  return matches / Math.max(modelTokens.length, 1);
}

export function generateAssignmentQuestions({ program, module, topic, skill, difficulty, questionType, numberOfQuestions }) {
  const count = Math.max(1, Math.min(Number(numberOfQuestions) || 5, 20));
  const items = [];

  for (let index = 0; index < count; index += 1) {
    const stem = `${program} ${module} ${topic} ${skill}`.trim();
    const promptBase = `Question ${index + 1}: ${stem}`;
    if (questionType === 'Multiple Choice') {
      items.push({
        questionType: 'mcq',
        prompt: `${promptBase} - which response best matches safe ${difficulty} practice?`,
        options: [
          `Prioritize the correct ${skill.toLowerCase()} step for ${topic.toLowerCase()}.`,
          `Delay intervention until after transport.`,
          `Skip reassessment after the initial decision.`,
          `Use an unrelated protocol pathway.`,
        ],
        correctAnswer: `Prioritize the correct ${skill.toLowerCase()} step for ${topic.toLowerCase()}.`,
        explanation: `This option aligns the learner with appropriate ${topic.toLowerCase()} management in ${module.toLowerCase()}.`,
        learningObjective: `Apply ${skill.toLowerCase()} principles in ${topic.toLowerCase()} scenarios.`,
        difficulty,
        markingGuide: 'Award full marks for the correct option only.',
        points: 5,
      });
    } else if (questionType === 'Scenario Based') {
      items.push({
        questionType: 'scenario_step',
        prompt: `${promptBase} - outline the most appropriate sequence of actions for a ${topic.toLowerCase()} scenario.`,
        options: null,
        correctAnswer: `A safe answer should identify assessment findings, the priority ${skill.toLowerCase()} intervention, reassessment, and appropriate escalation or transport planning.`,
        explanation: `Scenario answers should connect decision-making to a realistic EMS context.`,
        learningObjective: `Demonstrate structured clinical reasoning for ${topic.toLowerCase()}.`,
        difficulty,
        markingGuide: 'Look for scene safety, assessment, correct intervention, reassessment, and rationale.',
        points: 10,
      });
    } else if (questionType === 'Short Answer') {
      items.push({
        questionType: 'short_answer',
        prompt: `${promptBase} - explain the key considerations when performing ${skill.toLowerCase()} in ${topic.toLowerCase()}.`,
        options: null,
        correctAnswer: `A strong answer should identify the indications, safety checks, critical steps, and reassessment points for ${skill.toLowerCase()}.`,
        explanation: `Short answers should demonstrate understanding, safety, and rationale.`,
        learningObjective: `Explain the reasoning behind ${skill.toLowerCase()} decisions.`,
        difficulty,
        markingGuide: 'Award marks for indications, safety, correct method, and reassessment.',
        points: 8,
      });
    } else {
      items.push({
        questionType: 'short_answer',
        prompt: `${promptBase} - describe the practical knowledge a responder should demonstrate for ${skill.toLowerCase()}.`,
        options: null,
        correctAnswer: `Expected points include preparation, correct execution, communication, and post-intervention review.`,
        explanation: `Practical knowledge responses should show procedural understanding and safety awareness.`,
        learningObjective: `Describe practical knowledge required for ${skill.toLowerCase()}.`,
        difficulty,
        markingGuide: 'Award marks for preparation, sequence, safety, and documentation.',
        points: 8,
      });
    }
  }

  return items;
}

export function suggestShortAnswerGrade({ prompt, correctAnswer, studentAnswer, maxPoints, topic, skill }) {
  const similarity = overlapScore(correctAnswer, studentAnswer);
  const awarded = Math.round(similarity * Number(maxPoints || 0));
  const reasoning = similarity >= 0.75
    ? `The response covers most expected ${skill.toLowerCase()} points for ${topic.toLowerCase()}.`
    : similarity >= 0.4
      ? `The response shows partial understanding but misses some important ${skill.toLowerCase()} details.`
      : `The response is incomplete and does not yet demonstrate strong ${skill.toLowerCase()} reasoning.`;
  const feedback = similarity >= 0.75
    ? 'Strong answer. Tighten terminology and sequencing where needed.'
    : similarity >= 0.4
      ? 'Build on this by adding more safety checks, rationale, and reassessment points.'
      : 'Review the core topic, then restate the correct sequence and safety principles more clearly.';

  return {
    scorePct: maxPoints ? Math.round((awarded / maxPoints) * 100) : 0,
    pointsAwarded: awarded,
    reasoning: `${reasoning} Prompt reviewed: ${prompt}`,
    feedback,
  };
}
