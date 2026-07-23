import { Router } from 'express';
import {
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
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
]);

const router = Router();
const { upload, urlFor } = createUploader('clinical-reference-cards');

router.use(authenticate);

router.get('/', requireRole('student', 'teacher', 'institution_admin', 'super_admin'), requirePremiumAccess('clinical_reference_cards'), listClinicalReferenceCards);
router.get('/:id', requireRole('student', 'teacher', 'institution_admin', 'super_admin'), requirePremiumAccess('clinical_reference_cards'), getClinicalReferenceCard);
router.post('/', requireRole('super_admin', 'institution_admin'), createClinicalReferenceCard);
router.patch('/:id', requireRole('super_admin', 'institution_admin'), updateClinicalReferenceCard);
router.patch('/:id/publish', requireRole('super_admin', 'institution_admin'), publishClinicalReferenceCard);
router.patch('/:id/unpublish', requireRole('super_admin', 'institution_admin'), unpublishClinicalReferenceCard);
router.delete('/:id', requireRole('super_admin', 'institution_admin'), deleteClinicalReferenceCard);

router.post(
  '/:id/file',
  requireRole('super_admin', 'institution_admin'),
  upload.single('file'),
  (req, res, next) => {
    if (!req.file) return res.status(400).json({ error: 'Upload a PDF or image card file.' });
    if (!ALLOWED_MIME_TYPES.has(req.file.mimetype)) {
      return res.status(400).json({ error: 'Only PDF and image clinical reference cards are supported.' });
    }

    req.body = {
      fileUrl: urlFor(req.file),
      fileKind: req.file.mimetype === 'application/pdf' ? 'pdf' : 'image',
      thumbnailUrl: req.file.mimetype.startsWith('image/') ? urlFor(req.file) : null,
    };
    next();
  },
  setClinicalReferenceCardFile
);

export default router;
