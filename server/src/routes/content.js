// DEPRECATED: the old unified `content_items` table has been split into
// dedicated worksheets, flashcard_decks, and medical_graphics tables/routes.
// Use /api/worksheets, /api/flashcards, /api/graphics, and /api/assessments instead.
// This stub is kept only so older clients get a clear error instead of a crash.
import { Router } from 'express';

const router = Router();

router.use((_req, res) => {
  res.status(410).json({
    error: 'This endpoint has been replaced. Use /api/worksheets, /api/flashcards, /api/graphics, or /api/assessments.',
  });
});

export default router;
