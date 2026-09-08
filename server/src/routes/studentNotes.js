import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';
import { listNotes, createNote, updateNote, deleteNote } from '../controllers/studentNotesController.js';

const router = Router();
router.use(authenticate, requireRole('student'));
router.get('/', listNotes);
router.post('/', createNote);
router.patch('/:id', updateNote);
router.delete('/:id', deleteNote);

export default router;
