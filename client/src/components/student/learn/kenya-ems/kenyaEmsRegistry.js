// Registry of all 15 hard-coded Kenya EMS case components. This is the ONLY
// place the dashboard/library/case-runner need to know about Case1..Case15 --
// each component owns its full worksheet content directly (see ./cases/CaseN.jsx),
// nothing here (or anywhere in this module) reads case content from a database.
// Cases are looked up by case NUMBER (1-15), never a database id/UUID.
import Case1, { caseMeta as meta1 } from './cases/Case1';
import Case2, { caseMeta as meta2 } from './cases/Case2';
import Case3, { caseMeta as meta3 } from './cases/Case3';
import Case4, { caseMeta as meta4 } from './cases/Case4';
import Case5, { caseMeta as meta5 } from './cases/Case5';
import Case6, { caseMeta as meta6 } from './cases/Case6';
import Case7, { caseMeta as meta7 } from './cases/Case7';
import Case8, { caseMeta as meta8 } from './cases/Case8';
import Case9, { caseMeta as meta9 } from './cases/Case9';
import Case10, { caseMeta as meta10 } from './cases/Case10';
import Case11, { caseMeta as meta11 } from './cases/Case11';
import Case12, { caseMeta as meta12 } from './cases/Case12';
import Case13, { caseMeta as meta13 } from './cases/Case13';
import Case14, { caseMeta as meta14 } from './cases/Case14';
import Case15, { caseMeta as meta15 } from './cases/Case15';

export const kenyaEmsRegistry = [
  { caseNumber: 1, Component: Case1, meta: meta1 },
  { caseNumber: 2, Component: Case2, meta: meta2 },
  { caseNumber: 3, Component: Case3, meta: meta3 },
  { caseNumber: 4, Component: Case4, meta: meta4 },
  { caseNumber: 5, Component: Case5, meta: meta5 },
  { caseNumber: 6, Component: Case6, meta: meta6 },
  { caseNumber: 7, Component: Case7, meta: meta7 },
  { caseNumber: 8, Component: Case8, meta: meta8 },
  { caseNumber: 9, Component: Case9, meta: meta9 },
  { caseNumber: 10, Component: Case10, meta: meta10 },
  { caseNumber: 11, Component: Case11, meta: meta11 },
  { caseNumber: 12, Component: Case12, meta: meta12 },
  { caseNumber: 13, Component: Case13, meta: meta13 },
  { caseNumber: 14, Component: Case14, meta: meta14 },
  { caseNumber: 15, Component: Case15, meta: meta15 },
];

export const TOTAL_KENYA_EMS_CASES = kenyaEmsRegistry.length;

export function findCaseEntry(caseNumber) {
  return kenyaEmsRegistry.find((entry) => entry.caseNumber === Number(caseNumber)) || null;
}
