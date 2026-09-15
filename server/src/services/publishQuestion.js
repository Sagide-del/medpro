export function normalizeQuestion(item) {
  const type = item.type || 'multiple_choice';
  if (!['multiple_choice', 'mcq', 'true_false', 'scenario', 'scenario_step'].includes(type)) {
    throw Object.assign(new Error('Question Bank requires multiple-choice, true/false, or scenario choices.'), { status: 400 });
  }
  const options = type === 'true_false' ? ['True', 'False'] : item.options;
  if (!Array.isArray(options) || options.length < 2 || options.length > 4 || options.some((x) => typeof x !== 'string' || !x.trim())) {
    throw Object.assign(new Error('Each question needs two to four nonempty answer choices.'), { status: 400 });
  }
  const answer = String(item.answer || item.correctAnswer || '').trim();
  let correct = options.findIndex((x) => x.trim().toLowerCase() === answer.toLowerCase());
  if (correct < 0 && /^(?:option_)?[a-d]$/i.test(answer)) correct = answer.slice(-1).toLowerCase().charCodeAt(0) - 97;
  if (correct < 0 || correct >= options.length || !String(item.question || item.prompt || '').trim()) {
    throw Object.assign(new Error('The question or its answer key is invalid. Review it before publishing.'), { status: 400 });
  }
  const difficulty = ({ basic: 'beginner', easy: 'beginner', beginner: 'beginner', medium: 'intermediate', intermediate: 'intermediate', hard: 'advanced', advanced: 'advanced' })[String(item.difficulty || 'intermediate').toLowerCase()];
  if (!difficulty) throw Object.assign(new Error('Invalid question difficulty.'), { status: 400 });
  return { options, correct: `option_${String.fromCharCode(97 + correct)}`, difficulty,
    type: type === 'mcq' ? 'multiple_choice' : type === 'scenario_step' ? 'scenario' : type };
}

export async function publishQuestion(tx, record, moduleId) {
  const item = record.content_json;
  const normalized = normalizeQuestion(item);
  const { rows } = await tx.query('SELECT id FROM mcq_modules WHERE id = $1 AND program = $2 AND is_active = true', [moduleId, record.program]);
  if (!rows.length) throw Object.assign(new Error('Choose an active module in the selected pathway.'), { status: 400 });
  const options = [...normalized.options, '', '', '', ''].slice(0, 4);
  await tx.query(`INSERT INTO mcq_questions
    (id, module_id, program, topic, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, difficulty, question_type, published_content_id)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$1)
    ON CONFLICT (id) DO UPDATE SET question_text=EXCLUDED.question_text, option_a=EXCLUDED.option_a,
      option_b=EXCLUDED.option_b, option_c=EXCLUDED.option_c, option_d=EXCLUDED.option_d,
      correct_option=EXCLUDED.correct_option, explanation=EXCLUDED.explanation,
      difficulty=EXCLUDED.difficulty, question_type=EXCLUDED.question_type,
      module_id=EXCLUDED.module_id, topic=EXCLUDED.topic, program=EXCLUDED.program`,
  [record.id, moduleId, record.program, record.topic || 'General', item.question || item.prompt,
    ...options, normalized.correct, item.feedback || item.explanation || '', normalized.difficulty, normalized.type]);
  await tx.query('UPDATE mcq_modules SET total_questions=(SELECT count(*) FROM mcq_questions WHERE module_id=$1) WHERE id=$1', [moduleId]);
}
