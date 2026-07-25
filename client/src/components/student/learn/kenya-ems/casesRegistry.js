// Registry of all 15 hard-coded Kenya EMS case components. Each Case1..Case15
// component owns its full worksheet content directly (see ./cases/CaseN.jsx) --
// this file only wires them to their id/order_number for the dashboard,
// library grid, and case-runner route to look up by number.
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

export const kenyaEmsCaseRegistry = [
  { id: 1, Component: Case1, meta: meta1 },
  { id: 2, Component: Case2, meta: meta2 },
  { id: 3, Component: Case3, meta: meta3 },
  { id: 4, Component: Case4, meta: meta4 },
  { id: 5, Component: Case5, meta: meta5 },
  { id: 6, Component: Case6, meta: meta6 },
  { id: 7, Component: Case7, meta: meta7 },
  { id: 8, Component: Case8, meta: meta8 },
  { id: 9, Component: Case9, meta: meta9 },
  { id: 10, Component: Case10, meta: meta10 },
  { id: 11, Component: Case11, meta: meta11 },
  { id: 12, Component: Case12, meta: meta12 },
  { id: 13, Component: Case13, meta: meta13 },
  { id: 14, Component: Case14, meta: meta14 },
  { id: 15, Component: Case15, meta: meta15 },
];

export function findCaseEntry(orderNumber) {
  return kenyaEmsCaseRegistry.find((entry) => entry.id === Number(orderNumber)) || null;
}
