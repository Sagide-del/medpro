import { query } from '../config/database.js';
import { sm2 } from '../utils/helpers.js';

export const Flashcard = {
  async forDeck(deckId) {
    const { rows } = await query(`SELECT * FROM flashcards WHERE deck_id = $1 ORDER BY position`, [deckId]);
    return rows;
  },

  async findById(cardId) {
    const { rows } = await query(`SELECT * FROM flashcards WHERE card_id = $1`, [cardId]);
    return rows[0] || null;
  },

  /** Cards due for review for a student within an unlocked deck (spaced repetition study queue) */
  async dueForStudent(studentId, deckId) {
    const { rows } = await query(
      `SELECT f.*, fp.ease_factor, fp.interval_days, fp.repetitions, fp.next_review_at
       FROM flashcards f
       LEFT JOIN flashcard_progress fp ON fp.card_id = f.card_id AND fp.student_id = $1
       WHERE f.deck_id = $2 AND (fp.next_review_at IS NULL OR fp.next_review_at <= now())
       ORDER BY f.position`,
      [studentId, deckId]
    );
    return rows;
  },

  /** Records a spaced-repetition review (quality 0-5) and returns the updated schedule */
  async recordReview(studentId, cardId, quality) {
    const { rows: existing } = await query(
      `SELECT ease_factor AS "easeFactor", interval_days AS "intervalDays", repetitions FROM flashcard_progress WHERE student_id = $1 AND card_id = $2`,
      [studentId, cardId]
    );
    const next = sm2(existing[0], quality);
    const { rows } = await query(
      `INSERT INTO flashcard_progress (student_id, card_id, ease_factor, interval_days, repetitions, next_review_at, last_reviewed_at)
       VALUES ($1,$2,$3,$4,$5,$6, now())
       ON CONFLICT (student_id, card_id) DO UPDATE SET
         ease_factor = EXCLUDED.ease_factor, interval_days = EXCLUDED.interval_days,
         repetitions = EXCLUDED.repetitions, next_review_at = EXCLUDED.next_review_at, last_reviewed_at = now()
       RETURNING *`,
      [studentId, cardId, next.easeFactor, next.intervalDays, next.repetitions, next.nextReviewAt]
    );
    return rows[0];
  },

  async progressSummary(studentId, deckId) {
    const { rows } = await query(
      `SELECT COUNT(*)::int AS total_cards,
              COUNT(fp.progress_id)::int AS reviewed_cards,
              COUNT(*) FILTER (WHERE fp.next_review_at <= now())::int AS due_now
       FROM flashcards f
       LEFT JOIN flashcard_progress fp ON fp.card_id = f.card_id AND fp.student_id = $1
       WHERE f.deck_id = $2`,
      [studentId, deckId]
    );
    return rows[0];
  },
};
