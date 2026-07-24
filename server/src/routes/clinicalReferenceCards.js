import { Router } from 'express';
import {
  bulkUploadClinicalReferenceCards,
  createClinicalReferenceCard,
  deleteClinicalReferenceCard,
  getClinicalReferenceCard,
  listClinicalReferenceCards,
  publishClinicalReferenceCard,
  setClinicalReferenceCardFile,
  unpublishClinicalReferenceCard,
  updateClinicalReferenceCard,
} from '../controllers/clinicalReferenceCardController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';
import { requirePremiumAccess } from '../middleware/subscriptionAccess.js';
import { createUploader } from '../services/storage.js';

const ALLOWED_MIME_TYPES = new Set([
  'image/png',
]);

const router = Router();
const { upload, urlFor } = createUploader('clinical-reference-cards');

router.use(authenticate);

router.get('/', requireRole('student', 'teacher', 'institution_admin', 'super_admin'), requirePremiumAccess('clinical_reference_cards'), listClinicalReferenceCards);
router.get('/:id', requireRole('student', 'teacher', 'institution_admin', 'super_admin'), requirePremiumAccess('clinical_reference_cards'), getClinicalReferenceCard);
router.post('/', requireRole('super_admin'), createClinicalReferenceCard);
router.post('/bulk-upload', requireRole('super_admin'), upload.array('files', 50), (req, res, next) => {
  if (!Array.isArray(req.files) || req.files.length === 0) {
    return res.status(400).json({ error: 'Select one or more PNG files to upload.' });
  }
  for (const file of req.files) {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return res.status(400).json({ error: 'Only PNG files are supported.' });
    }
  }
  req.body = {
    ...req.body,
    uploadedFileUrls: req.files.map((file) => urlFor(file)),
  };
  next();
}, bulkUploadClinicalReferenceCards);
router.patch('/:id', requireRole('super_admin'), updateClinicalReferenceCard);
router.patch('/:id/publish', requireRole('super_admin'), publishClinicalReferenceCard);
router.patch('/:id/unpublish', requireRole('super_admin'), unpublishClinicalReferenceCard);
router.delete('/:id', requireRole('super_admin'), deleteClinicalReferenceCard);

router.post(
  '/:id/file',
  requireRole('super_admin'),
  upload.single('file'),
  (req, res, next) => {
    if (!req.file) return res.status(400).json({ error: 'Upload a PNG card file.' });
    if (!ALLOWED_MIME_TYPES.has(req.file.mimetype)) {
      return res.status(400).json({ error: 'Only PNG clinical reference cards are supported.' });
    }

    req.body = {
      fileUrl: urlFor(req.file),
      fileKind: 'image',
      thumbnailUrl: urlFor(req.file),
    };
    next();
  },
  setClinicalReferenceCardFile
);

export default router;
