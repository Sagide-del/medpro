import { readFile } from 'node:fs/promises';
import { withTransaction } from '../config/database.js';

// Bundled inside the server image, which cannot access ../database.
export async function ensureQuestionBankSchema() {
  const sql = await readFile(new URL('../migrations/question-bank.sql', import.meta.url), 'utf8');
  await withTransaction(async (db) => {
    await db.query("SELECT pg_advisory_xact_lock(72603128)");
    await db.query(sql);
  });
}
