import { Router } from 'express';
import multer from 'multer';
import {
  listWorksheets, getWorksheet, createWorksheet, publishWorksheet, deleteWorksheet,
  submitWorksheet, mySubmissions, worksheetSubmissions, gradeSubmission,
} from '../controllers/worksheetController.js';
import { Worksheet } from '../models/Worksheet.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';

const upload = multer({ dest: 'uploads/worksheets/' });
const router = Router();

router.get('/', optionalAuth, listWorksheets);
router.get('/my-submissions', authenticate, requireRole('student'), mySubmissions);
router.get('/:id', optionalAuth, getWorksheet);
router.post('/', authenticate, requireRole('super_admin'), createWorksheet);
router.patch('/:id/publish', authenticate, requireRole('super_admin'), publishWorksheet);
router.delete('/:id', authenticate, requireRole('super_admin'), deleteWorksheet);

router.post('/:id/file', authenticate, requireRole('super_admin'), upload.single('file'), async (req, res) => {
  const worksheet = await Worksheet.setFileUrl(req.params.id, `/uploads/worksheets/${req.file.filename}`);
  res.json({ worksheet });
});

router.post('/:id/submit', authenticate, requireRole('student'), submitWorksheet);
router.get('/:id/submissions', authenticate, requireRole('super_admin', 'teacher'), worksheetSubmissions);
router.patch('/submissions/:submissionId/grade', authenticate, requireRole('super_admin', 'teacher'), gradeSubmission);

export default router;
