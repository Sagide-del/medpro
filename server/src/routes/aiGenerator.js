import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';
import { createUploader } from '../services/storage.js';
import {
  bulkApproveContent,
  bulkRejectContent,
  customizeContent,
  exportPdf,
  getGenerationProgress,
  saveCustomizedContent,
  startGeneration,
} from '../controllers/aiGeneratorController.js';
import { getJob, listJobs, masterContent, publishJob, reviewJob } from '../controllers/aiGeneratorV2Controller.js';

const router = Router();
const { upload } = createUploader('ai-generator-sources');

router.use(authenticate);

router.post('/generate', requireRole('teacher', 'institution_admin', 'super_admin'), upload.single('sourceFile'), startGeneration);
router.get('/progress/:jobId', requireRole('teacher', 'institution_admin', 'super_admin'), getGenerationProgress);
router.get('/customize/:type/:id', requireRole('teacher', 'institution_admin', 'super_admin'), customizeContent);
router.post('/customize/save', requireRole('teacher', 'institution_admin', 'super_admin'), saveCustomizedContent);
router.post('/bulk-approve', requireRole('super_admin'), bulkApproveContent);
router.post('/bulk-reject', requireRole('super_admin'), bulkRejectContent);
router.post('/export/pdf', requireRole('teacher', 'institution_admin', 'super_admin'), exportPdf);
router.get('/v2/jobs', requireRole('teacher', 'institution_admin', 'super_admin'), listJobs);
router.get('/v2/master-content', requireRole('teacher', 'institution_admin', 'super_admin'), masterContent);
router.get('/v2/jobs/:jobId', requireRole('teacher', 'institution_admin', 'super_admin'), getJob);
router.post('/v2/jobs/:jobId/review', requireRole('teacher', 'institution_admin', 'super_admin'), reviewJob);
router.post('/v2/jobs/:jobId/publish', requireRole('teacher', 'institution_admin', 'super_admin'), publishJob);

export default router;
