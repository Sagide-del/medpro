import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';
import {
  bulkApproveContent,
  bulkRejectContent,
  customizeContent,
  exportPdf,
  getGenerationProgress,
  saveCustomizedContent,
  startGeneration,
} from '../controllers/aiGeneratorController.js';

const router = Router();

router.use(authenticate);

router.post('/generate', requireRole('teacher', 'institution_admin', 'super_admin'), startGeneration);
router.get('/progress/:jobId', requireRole('teacher', 'institution_admin', 'super_admin'), getGenerationProgress);
router.get('/customize/:type/:id', requireRole('teacher', 'institution_admin', 'super_admin'), customizeContent);
router.post('/customize/save', requireRole('teacher', 'institution_admin', 'super_admin'), saveCustomizedContent);
router.post('/bulk-approve', requireRole('super_admin'), bulkApproveContent);
router.post('/bulk-reject', requireRole('super_admin'), bulkRejectContent);
router.post('/export/pdf', requireRole('teacher', 'institution_admin', 'super_admin'), exportPdf);

export default router;

