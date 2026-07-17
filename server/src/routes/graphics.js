import { Router } from 'express';
import { listGraphics, getGraphic, createGraphic, setGraphicFiles, publishGraphic, deleteGraphic } from '../controllers/graphicController.js';
import { MedicalGraphic } from '../models/MedicalGraphic.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';
import { createUploader } from '../services/storage.js';

const { upload, urlFor } = createUploader('graphics');
const router = Router();

router.get('/', optionalAuth, listGraphics);
router.get('/:id', optionalAuth, getGraphic);
router.post('/', authenticate, requireRole('super_admin'), createGraphic);
router.patch('/:id/publish', authenticate, requireRole('super_admin'), publishGraphic);
router.delete('/:id', authenticate, requireRole('super_admin'), deleteGraphic);

router.post(
  '/:id/files',
  authenticate,
  requireRole('super_admin'),
  upload.fields([{ name: 'file', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]),
  async (req, res) => {
    const fileUrl = urlFor(req.files?.file?.[0]);
    const thumbnailUrl = urlFor(req.files?.thumbnail?.[0]);
    const graphic = await MedicalGraphic.setFiles(req.params.id, { fileUrl, thumbnailUrl });
    res.json({ graphic });
  }
);
router.patch('/:id/files', authenticate, requireRole('super_admin'), setGraphicFiles);

export default router;
