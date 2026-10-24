import { createHash } from 'node:crypto';
import { PROGRAMS } from '../utils/programs.js';
import { ragError } from './ragService.js';

export const BOOK_DESTINATIONS = ['question_bank', 'psychometric_clinical', 'psychometric_situational', 'psychometric_readiness', 'study_guides', 'drug_reference', 'cheat_sheets', 'podcasts', 'flashcards', 'notes', 'mnemonics', 'diagrams'];
export function sourceSupportsProgram(sourceProgram, program) {
  return sourceProgram === program || sourceProgram === 'all' || (sourceProgram === 'both' && ['EMT', 'Paramedic'].includes(program));
}
export function contentFingerprint(item) {
  const stem = item.question || item.title || item.summary || '';
  const cards = (item.cards || []).map((card) => card.front).join(' ');
  return createHash('sha256').update(`${stem} ${cards}`.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()).digest('hex');
}
export function buildBookPlan(source, passages, input) {
  const targets = input.targets;
  if (!Array.isArray(targets) || !targets.length || targets.length > 3 || targets.some((target) => !target || typeof target !== 'object') ||
      new Set(targets.map((target) => target.program)).size !== targets.length ||
      targets.some((target) => !PROGRAMS.includes(target.program) || !sourceSupportsProgram(source.program, target.program))) {
    throw ragError('Select distinct study tracks covered by this approved source.');
  }
  if (input.destinations !== undefined && !Array.isArray(input.destinations)) throw ragError('Choose a list of destinations.');
  if (targets.some((target) => target.moduleId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(target.moduleId))) throw ragError('Invalid question module identifier.');
  const destinations = [...new Set(input.destinations || ['question_bank', 'psychometric_clinical'])];
  if (!destinations.length || destinations.some((destination) => !BOOK_DESTINATIONS.includes(destination))) throw ragError('Choose a supported book destination.');
  const difficulty = input.difficulty || 'intermediate';
  if (!['beginner', 'intermediate', 'advanced'].includes(difficulty)) throw ragError('Choose a supported difficulty.');
  const questionTypes = input.questionTypes || ['multiple_choice'];
  if (!Array.isArray(questionTypes) || !questionTypes.length || questionTypes.some(type => !['multiple_choice','true_false','scenario'].includes(type))) throw ragError('Choose supported question types.');
  const count = Number(input.questionsPerBatch ?? 10);
  if (!Number.isInteger(count) || count < 5 || count > 20) throw ragError('Choose 5–20 questions per batch.');
  const chapters = input.chapters;
  if (chapters !== undefined && (!Array.isArray(chapters) || !chapters.length || chapters.some((title) => typeof title !== 'string'))) throw ragError('Select at least one chapter.');
  const lastPage = Number(source.page_count || Math.max(0,...passages.map((passage) => passage.page_number)));
  const pageStart = Number(input.pageStart ?? 1), pageEnd = Number(input.pageEnd ?? lastPage);
  if (!Number.isInteger(pageStart) || !Number.isInteger(pageEnd) || pageStart < 1 || pageEnd < pageStart || pageEnd > lastPage) throw ragError('Choose a valid PDF page range within this book.');
  const selected = passages.filter((passage) => (!chapters || chapters.includes(passage.chapter_title)) && passage.page_number >= pageStart && passage.page_number <= pageEnd);
  if (!selected.length) throw ragError(passages.length ? 'No readable passages match this chapter/page selection.' : 'No chapter passages are available. Reindex this source first.', 409);
  const groups = [];
  for (const passage of selected) {
    let group = groups.at(-1);
    if (!group || group.chapter !== passage.chapter_title || group.passages.length === 8) {
      group = { chapter: passage.chapter_title, passages: [] }; groups.push(group);
    }
    group.passages.push(passage);
  }
  const tasks = groups.flatMap((group) => targets.flatMap((target) => destinations.map((destination) => ({
    program: target.program, moduleId: target.moduleId || null, destination,
    chapter: group.chapter, firstPage: group.passages[0].page_number, lastPage: group.passages.at(-1).page_number,
    chunkIds: group.passages.map((passage) => passage.chunk_id),
  }))));
  if (tasks.length > 200) throw ragError(`This plan requires ${tasks.length} batches. Select fewer chapters, destinations, or a smaller PDF page range; each run is limited to 200 batches.`);
  return { targets, destinations, difficulty, questionTypes: [...new Set(questionTypes)], questionsPerBatch: count, tasks, estimatedModelCalls: tasks.length * 2,
    passageCount: selected.length, readablePages: new Set(selected.map((passage) => passage.page_number)).size,
    questionDraftTarget: tasks.filter((task) => task.destination === 'question_bank').length * count };
}
