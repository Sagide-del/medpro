import test from 'node:test';
import assert from 'node:assert/strict';
import { canonicalProgram } from '../src/utils/programs.js';
import { plannerOptions } from '../src/services/adaptivePlannerService.js';
import { normalizeRagProgram } from '../src/services/ragService.js';

test('Nursing keeps its own identity through publishing, retrieval and planning', () => {
  for (const input of ['Nursing', 'nursing', 'nurse']) {
    assert.equal(canonicalProgram(input), 'Nursing');
    assert.equal(normalizeRagProgram(input), 'Nursing');
  }
  assert.equal(plannerOptions({ program: 'Nursing' }).program, 'Nursing');
  assert.equal(canonicalProgram('emt-paramedic'), 'Paramedic');
  assert.equal(canonicalProgram('emt-basic'), 'EMT');
  assert.equal(canonicalProgram('unknown'), null);
  assert.throws(() => plannerOptions({ program: 'unknown' }), /Select/);
});
