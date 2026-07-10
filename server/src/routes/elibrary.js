import { Router } from 'express';
import multer from 'multer';
import {
  listResources, getResource, createResource, setResourceFiles, publishResource, deleteResource, downloadFreeResource,
} from '../controllers/elibraryController.js';
import { ElibraryResource } from '../models/ElibraryResource.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';

const upload = multer({ dest: 'uploads/elibrary/' });
const router = Router();

router.get('/', optionalAuth, listResources);
router.get('/:id', optionalAuth, getResource);
router.post('/', authenticate, requireRole('super_admin'), createResource);
router.patch('/:id/publish', authenticate, requireRole('super_admin'), publishResource);
router.delete('/:id', authenticate, requireRole('super_admin'), deleteResource);
router.post('/:id/download', authenticate, requireRole('student'), downloadFreeResource);

router.post(
  '/:id/files',
  authenticate,
  requireRole('super_admin'),
  upload.fields([{ name: 'file', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]),
  async (req, res) => {
    const fileUrl = req.files?.file?.[0] ? `/uploads/elibrary/${req.files.file[0].filename}` : null;
    const thumbnailUrl = req.files?.thumbnail?.[0] ? `/uploads/elibrary/${req.files.thumbnail[0].filename}` : null;
    const resource = await ElibraryResource.setFiles(req.params.id, { fileUrl, thumbnailUrl });
    res.json({ resource });
  }
);
router.patch('/:id/files', authenticate, requireRole('super_admin'), setResourceFiles);

export default router;
