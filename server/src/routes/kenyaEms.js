import { Router } from 'express';
import {
  listKenyaEmsCases,
  getKenyaEmsCase,
  submitKenyaEmsCase,
} from '../controllers/kenyaEmsController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';

const router = Router();

// Cases are addressed by case NUMBER (1-15) throughout -- never a database id/UUID.
router.get('/', authenticate, requireRole('student'), listKenyaEmsCases);
router.get('/:caseNumber', authenticate, requireRole('student'), getKenyaEmsCase);
router.post('/:caseNumber/submit', authenticate, requireRole('student'), submitKenyaEmsCase);

export default router;
