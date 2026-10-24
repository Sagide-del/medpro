import { syncPublishedKenyaCase } from './kenyaCaseSeries.js';
import { readFile } from 'node:fs/promises';
import { withTransaction } from '../config/database.js';

// Bundled inside the server image, which cannot access ../database.
export async function ensureQuestionBankSchema() {
  const sql = await readFile(new URL('../migrations/question-bank.sql', import.meta.url), 'utf8');
  const contentSql = await readFile(new URL('../migrations/published-content.sql', import.meta.url), 'utf8');
  const ragSql = await readFile(new URL('../migrations/rag-sources.sql', import.meta.url), 'utf8');
  const plannerSql = await readFile(new URL('../migrations/planner-state.sql', import.meta.url), 'utf8');
  const nursingSql = await readFile(new URL('../migrations/nursing-pathway.sql', import.meta.url), 'utf8');
  const bookSql = await readFile(new URL('../migrations/book-generation.sql', import.meta.url), 'utf8');
  const kenyaSql=await readFile(new URL('../migrations/kenya-case-series.sql',import.meta.url),'utf8');
  await withTransaction(async (db) => {
    await db.query("SELECT pg_advisory_xact_lock(72603128)");
    await db.query(sql);
    await db.query(contentSql);
    await db.query(ragSql);
    await db.query(plannerSql);
    await db.query(nursingSql);
    await db.query(bookSql);
    await db.query(kenyaSql);
    const existing=await db.query("SELECT * FROM ai_published_content WHERE destination_key='kenya_cases' AND status='published' ORDER BY program,published_at,id");
    for(const content of existing.rows)await syncPublishedKenyaCase(db,content);
  });
}
