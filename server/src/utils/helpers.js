/** Wraps an async Express handler so rejected promises reach the error middleware */
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/** Normalizes 07XX / +2547XX / 2547XX to Daraja's required 2547XXXXXXXX format */
export function normalizePhone(phone) {
  const digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith('254')) return digits;
  if (digits.startsWith('0')) return `254${digits.slice(1)}`;
  if (digits.startsWith('7') || digits.startsWith('1')) return `254${digits}`;
  throw new Error('Enter a valid Safaricom number, e.g. 0712 345 678');
}

export function paginate(rowsCount, { page, limit }) {
  return {
    page,
    limit,
    total: rowsCount,
    totalPages: Math.max(1, Math.ceil(rowsCount / limit)),
  };
}

/** Grades an MCQ/short-answer question by loose string comparison */
export function isAnswerCorrect(correctAnswer, response) {
  if (correctAnswer == null || response == null) return false;
  return String(correctAnswer).trim().toLowerCase() === String(response).trim().toLowerCase();
}

/** SM-2 spaced repetition — quality is 0-5 (student's self-rated recall) */
export function sm2(prev, quality) {
  let { easeFactor = 2.5, intervalDays = 1, repetitions = 0 } = prev || {};

  if (quality < 3) {
    repetitions = 0;
    intervalDays = 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) intervalDays = 1;
    else if (repetitions === 2) intervalDays = 6;
    else intervalDays = Math.round(intervalDays * easeFactor);
  }

  easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

  const nextReviewAt = new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000);
  return { easeFactor: Number(easeFactor.toFixed(2)), intervalDays, repetitions, nextReviewAt };
}

export function slugifyAccountRef(text) {
  return String(text || 'MEDPRO').replace(/[^a-zA-Z0-9]/g, '').slice(0, 12) || 'MEDPRO';
}
