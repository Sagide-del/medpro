import { Router } from 'express';
import { createUploader } from '../services/storage.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';
import {
  approveCase,
  completeStudentCase,
  customizeTeacherContent,
  generateCase,
  getMasterCase,
  getStudentAssignment,
  getStudentProgress,
  getTeacherBankCase,
  listMasterCases,
  listStudentAssignments,
  listTeacherBank,
  listTeacherContent,
  publishCase,
  publishTeacherContent,
  rejectCase,
  saveStudentAnswer,
  updateMasterCase,
  uploadCaseImages,
} from '../controllers/medprohubEmsController.js';

const router = Router();
const { upload } = createUploader('medprohub-ems');

router.use(authenticate);

// Super admin
router.post('/admin/medprohub/ems/generate', requireRole('super_admin'), upload.single('sourceFile'), generateCase);
router.get('/admin/medprohub/ems/cases', requireRole('super_admin'), listMasterCases);
router.get('/admin/medprohub/ems/:id', requireRole('super_admin'), getMasterCase);
router.put('/admin/medprohub/ems/:id', requireRole('super_admin'), updateMasterCase);
router.post('/admin/medprohub/ems/:id/approve', requireRole('super_admin'), approveCase);
router.post('/admin/medprohub/ems/:id/reject', requireRole('super_admin'), rejectCase);
router.post('/admin/medprohub/ems/:id/publish', requireRole('super_admin'), publishCase);
router.post('/admin/medprohub/ems/:id/images', requireRole('super_admin'), upload.array('images', 10), uploadCaseImages);

// Teacher
router.get('/teacher/medprohub/ems/bank', requireRole('teacher', 'institution_admin', 'super_admin'), listTeacherBank);
router.get('/teacher/medprohub/ems/bank/:id', requireRole('teacher', 'institution_admin', 'super_admin'), getTeacherBankCase);
router.post('/teacher/medprohub/ems/customize', requireRole('teacher', 'institution_admin', 'super_admin'), customizeTeacherContent);
router.get('/teacher/medprohub/ems/my', requireRole('teacher', 'institution_admin', 'super_admin'), listTeacherContent);
router.post('/teacher/medprohub/ems/publish', requireRole('teacher', 'institution_admin', 'super_admin'), publishTeacherContent);

// Student
router.get('/student/medprohub/ems/assignments', requireRole('student'), listStudentAssignments);
router.get('/student/medprohub/ems/:id', requireRole('student'), getStudentAssignment);
router.post('/student/medprohub/ems/:id/answer', requireRole('student'), saveStudentAnswer);
router.get('/student/medprohub/ems/:id/progress', requireRole('student'), getStudentProgress);
router.post('/student/medprohub/ems/:id/complete', requireRole('student'), completeStudentCase);

export default router;

