import { Router } from 'express';
import {
  listDecks, getDeck, createDeck, addCards, publishDeck, deleteDeck,
  dueCards, reviewCard, deckProgress,
} from '../controllers/flashcardController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';

const router = Router();

router.get('/', optionalAuth, listDecks);
router.get('/:id', optionalAuth, getDeck);
router.post('/', authenticate, requireRole('super_admin'), createDeck);
router.post('/:id/cards', authenticate, requireRole('super_admin'), addCards);
router.patch('/:id/publish', authenticate, requireRole('super_admin'), publishDeck);
router.delete('/:id', authenticate, requireRole('super_admin'), deleteDeck);

router.get('/:id/study/due', authenticate, requireRole('student'), dueCards);
router.get('/:id/study/progress', authenticate, requireRole('student'), deckProgress);
router.post('/cards/:cardId/review', authenticate, requireRole('student'), reviewCard);

export default router;
