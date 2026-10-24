import { Router } from 'express';
import { requireRole } from '../middleware/roleCheck.js';
import { asyncHandler } from '../utils/helpers.js';
import { bookGenerationConfig, bookCoverage, planBook, createBookRun, listBookRuns, getBookRun, controlBookRun } from '../services/bookGenerationService.js';
import { generateIncident } from '../services/incidentGenerationService.js';
import { ragError } from '../services/ragService.js';
const router = Router();
for (const name of ['id', 'sourceId']) router.param(name, (_req, _res, next, value) => next(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value) ? undefined : ragError('Invalid identifier.')));
router.use(requireRole('teacher', 'institution_admin', 'super_admin'));
router.use((req, _res, next) => {
  for (const id of [req.body?.sourceId, req.params.id, req.params.sourceId].filter(Boolean)) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return next(ragError('Invalid book or run identifier.'));
  }
  next();
});
router.post('/incidents', requireRole('super_admin'), asyncHandler(async (req,res) => res.status(201).json(await generateIncident(req.user,req.body || {}))));
router.get('/config', (_req, res) => res.json(bookGenerationConfig()));
router.get('/sources/:sourceId/coverage', asyncHandler(async (req, res) => res.json(await bookCoverage(req.user, req.params.sourceId))));
router.post('/plan', asyncHandler(async (req, res) => {
  const { plan } = await planBook(req.user, req.body || {});
  res.json({ ...plan, tasks: undefined });
}));
router.post('/runs', asyncHandler(async (req, res) => res.status(201).json(await createBookRun(req.user, req.body || {}))));
router.get('/runs', asyncHandler(async (req, res) => res.json({ runs: await listBookRuns(req.user) })));
router.get('/runs/:id', asyncHandler(async (req, res) => res.json(await getBookRun(req.user, req.params.id))));
router.post('/runs/:id/:action', asyncHandler(async (req, res) => { await controlBookRun(req.user, req.params.id, req.params.action); res.json({ ok: true }); }));
export default router;
