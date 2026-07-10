import { FlashcardDeck } from '../models/FlashcardDeck.js';
import { Flashcard } from '../models/Flashcard.js';
import { Payment } from '../models/Payment.js';
import { asyncHandler } from '../utils/helpers.js';

export const listDecks = asyncHandler(async (req, res) => {
  const status = req.user?.role === 'super_admin' ? req.query.status : 'published';
  const rows = await FlashcardDeck.list({ status, category: req.query.category });
  res.json({ decks: rows });
});

export const getDeck = asyncHandler(async (req, res) => {
  const deck = await FlashcardDeck.findById(req.params.id);
  if (!deck) return res.status(404).json({ error: 'Deck not found.' });

  let unlocked = req.user?.role !== 'student';
  if (req.user?.role === 'student') {
    unlocked = await Payment.hasActiveAccess(req.user.sub, 'flashcard_deck', deck.deck_id);
  }
  const cards = unlocked ? await Flashcard.forDeck(deck.deck_id) : [];
  res.json({ deck, cards, unlocked });
});

export const createDeck = asyncHandler(async (req, res) => {
  const { cards = [], ...rest } = req.body;
  if (!rest.title) return res.status(400).json({ error: 'Title is required.' });
  const deck = await FlashcardDeck.create({ ...rest, uploadedBy: req.user.sub }, cards);
  res.status(201).json({ deck });
});

export const addCards = asyncHandler(async (req, res) => {
  const cards = await FlashcardDeck.addCards(req.params.id, req.body.cards || []);
  res.status(201).json({ cards });
});

export const publishDeck = asyncHandler(async (req, res) => {
  const deck = await FlashcardDeck.setStatus(req.params.id, 'published');
  res.json({ deck });
});

export const deleteDeck = asyncHandler(async (req, res) => {
  await FlashcardDeck.delete(req.params.id);
  res.status(204).end();
});

// ---- Study mode (spaced repetition) ----
export const dueCards = asyncHandler(async (req, res) => {
  const unlocked = await Payment.hasActiveAccess(req.user.sub, 'flashcard_deck', req.params.id);
  if (!unlocked) return res.status(403).json({ error: 'Purchase this deck to study.' });
  const cards = await Flashcard.dueForStudent(req.user.sub, req.params.id);
  res.json({ cards });
});

export const reviewCard = asyncHandler(async (req, res) => {
  const { cardId } = req.params;
  const { quality } = req.body; // 0-5 self-rated recall
  if (quality === undefined || quality < 0 || quality > 5) {
    return res.status(400).json({ error: 'quality must be between 0 and 5.' });
  }
  const progress = await Flashcard.recordReview(req.user.sub, cardId, quality);
  res.json({ progress });
});

export const deckProgress = asyncHandler(async (req, res) => {
  const summary = await Flashcard.progressSummary(req.user.sub, req.params.id);
  res.json({ summary });
});
