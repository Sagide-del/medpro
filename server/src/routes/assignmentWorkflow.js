import { Router } from 'express';
import {
  createAssignment,
  createQuestionBankQuestion,
  generateAiAssignment,
  getStudentAssignment,
  getTeacherAssignment,
  getTeacherSubmission,
  gradeTeacherSubmission,
  listQuestionBank,
  listStudentAssignments,
  listTeacherAssignments,
  listTeacherGroups,
  listTeacherSubmissions,
  startStudentAssignment,
  studentAssignmentResults,
  submitStudentAssignment,
  teacherStudentPerformance,
  updateQuestionBankQuestion,
} from '../controllers/assignmentWorkflowController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';
import { requirePremiumAccess } from '../middleware/subscriptionAccess.js';

const router = Router();

router.use(authenticate);

router.get('/teacher/groups', requireRole('teacher'), listTeacherGroups);
router.get('/teacher/assignments', requireRole('teacher'), listTeacherAssignments);
router.get('/teacher/assignments/:id', requireRole('teacher'), getTeacherAssignment);
router.post('/teacher/assignments', requireRole('teacher'), createAssignment);
router.get('/teacher/question-bank', requireRole('teacher'), listQuestionBank);
router.post('/teacher/question-bank', requireRole('teacher'), createQuestionBankQuestion);
router.patch('/teacher/question-bank/:id', requireRole('teacher'), updateQuestionBankQuestion);
router.post('/teacher/ai-generate', requireRole('teacher'), generateAiAssignment);
router.get('/teacher/submissions', requireRole('teacher'), listTeacherSubmissions);
router.get('/teacher/submissions/:id', requireRole('teacher'), getTeacherSubmission);
router.patch('/teacher/submissions/:id/grade', requireRole('teacher'), gradeTeacherSubmission);
router.get('/teacher/performance', requireRole('teacher'), teacherStudentPerformance);

router.get('/student/assignments', requireRole('student'), requirePremiumAccess('assignments'), listStudentAssignments);
router.get('/student/assignments/:id', requireRole('student'), requirePremiumAccess('assignments'), getStudentAssignment);
router.post('/student/assignments/:id/start', requireRole('student'), requirePremiumAccess('assignments'), startStudentAssignment);
router.post('/student/assignments/:id/submit', requireRole('student'), requirePremiumAccess('assignments'), submitStudentAssignment);
router.get('/student/assignments/:id/results', requireRole('student'), requirePremiumAccess('assignments'), studentAssignmentResults);

export default router;
