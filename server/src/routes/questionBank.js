import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';
import {
  listQuestions, submitQuestions, bookmarkQuestion, getProgress,
  listMockExams, submitMockExam,
} from '../controllers/questionBankController.js';

const router = Router();
const student = [authenticate, requireRole('student')];

router.get('/questions', ...student, listQuestions);
router.post('/questions/submit', ...student, submitQuestions);
router.post('/questions/bookmark', ...student, bookmarkQuestion);
router.get('/mock-exams', ...student, listMockExams);
router.post('/mock-exams/:id/submit', ...student, submitMockExam);
router.get('/progress', ...student, getProgress);

export default router;
