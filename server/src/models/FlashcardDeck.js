import { query, withTransaction } from '../config/database.js';

export const FlashcardDeck = {
  async list({ status = 'published', category, limit = 50, offset = 0 } = {}) {
    const conditions = [];
    const params = [];
    let i = 1;
    if (status) { conditions.push(`status = $${i++}`); params.push(status); }
    if (category) { conditions.push(`category = $${i++}`); params.push(category); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await query(
      `SELECT * FROM flashcard_decks ${where} ORDER BY created_at DESC LIMIT $${i++} OFFSET $${i++}`,
      [...params, limit, offset]
    );
    return rows;
  },

  async findById(deckId) {
    const { rows } = await query(`SELECT * FROM flashcard_decks WHERE deck_id = $1`, [deckId]);
    return rows[0] || null;
  },

  async create({ title, description, category, difficulty, price = 10, uploadedBy }, cards = []) {
    return withTransaction(async (tx) => {
      const { rows } = await tx.query(
        `INSERT INTO flashcard_decks (title, description, category, difficulty, price, card_count, uploaded_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [title, description || null, category || null, difficulty || 'intermediate', price, cards.length, uploadedBy]
      );
      const deck = rows[0];
      let position = 0;
      for (const c of cards) {
        await tx.query(
          `INSERT INTO flashcards (deck_id, front, back, image_url, position) VALUES ($1,$2,$3,$4,$5)`,
          [deck.deck_id, c.front, c.back, c.imageUrl || null, position++]
        );
      }
      return deck;
    });
  },

  async setStatus(deckId, status) {
    const { rows } = await query(`UPDATE flashcard_decks SET status = $1 WHERE deck_id = $2 RETURNING *`, [status, deckId]);
    return rows[0];
  },

  async incrementPurchases(deckId) {
    await query(`UPDATE flashcard_decks SET purchase_count = purchase_count + 1 WHERE deck_id = $1`, [deckId]);
  },

  async delete(deckId) {
    await query(`DELETE FROM flashcard_decks WHERE deck_id = $1`, [deckId]);
  },

  async addCards(deckId, cards) {
    return withTransaction(async (tx) => {
      const { rows: existing } = await tx.query(`SELECT COALESCE(MAX(position), -1) AS max_pos FROM flashcards WHERE deck_id = $1`, [deckId]);
      let position = existing[0].max_pos + 1;
      const inserted = [];
      for (const c of cards) {
        const { rows } = await tx.query(
          `INSERT INTO flashcards (deck_id, front, back, image_url, position) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
          [deckId, c.front, c.back, c.imageUrl || null, position++]
        );
        inserted.push(rows[0]);
      }
      await tx.query(`UPDATE flashcard_decks SET card_count = card_count + $1 WHERE deck_id = $2`, [cards.length, deckId]);
      return inserted;
    });
  },
};
