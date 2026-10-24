import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBookPlan, sourceSupportsProgram, contentFingerprint } from '../src/services/bookGenerationPlan.js';
const source = { program: 'all' };
const passages = Array.from({ length: 18 }, (_, index) => ({ chunk_id: `chunk-${index}`, page_number: index + 1, chapter_title: index < 9 ? 'Cells' : 'Tissues' }));
test('book coverage traverses every passage, respects chapters, and defaults to questions and cases', () => {
  const plan = buildBookPlan(source, passages, { targets: [{ program: 'Nursing' }], questionsPerBatch: 5 });
  assert.equal(plan.tasks.length, 8);
  assert.deepEqual(plan.destinations, ['question_bank', 'psychometric_clinical']);
  const questions = plan.tasks.filter((task) => task.destination === 'question_bank');
  assert.equal(new Set(questions.flatMap((task) => task.chunkIds)).size, 18);
  assert.equal(questions.flatMap((task) => task.chunkIds).length, 18);
  assert(questions.every((task) => task.chunkIds.length <= 8));
  assert.equal(plan.estimatedModelCalls,16);
});
test('chapter selection, track scope, and workload limits are enforced', () => {
  assert.equal(sourceSupportsProgram('both','Nursing'), false);
  assert.equal(sourceSupportsProgram('all','Nursing'), true);
  assert.throws(() => buildBookPlan({program:'EMT'},passages,{targets:[{program:'Nursing'}]}), /tracks/);
  const plan = buildBookPlan(source,passages,{targets:[{program:'EMT'}],chapters:['Tissues']});
  assert.equal(plan.passageCount,9);
  assert.throws(() => buildBookPlan(source,passages,{targets:[null]}));
  assert.throws(() => buildBookPlan(source,passages,{targets:[{program:'EMT'}],questionsPerBatch:200}), /5–20/);
  assert.throws(() => buildBookPlan(source,Array.from({length:900},(_,index)=>({...passages[0],page_number:index+1,chunk_id:String(index)})),{targets:[{program:'EMT'},{program:'Nursing'}]}), /200 batches/);
});
test('fingerprints ignore cosmetic spelling changes without exposing book text', () => {
  assert.equal(contentFingerprint({question:'What is a cell?'}),contentFingerprint({question:'WHAT  is a cell!'}));
  assert.notEqual(contentFingerprint({question:'What is a tissue?'}),contentFingerprint({question:'What is a cell?'}));
});
