#!/usr/bin/env node
// One-time database setup — runs schema.sql, then the three migrations, in
// the required order (see README "Deploying to production" for why the
// order matters). Exists so `railway run npm run migrate` (or the local
// equivalent) works without needing psql installed, which is especially
// handy on Windows or a fresh Railway/Render shell.
//
// Usage:
//   npm run migrate            # schema + migrations only
//   npm run migrate -- --seed  # also load database/seed.sql (demo data — do
//                               # NOT use this against a real production DB)
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Client } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbDir = path.join(__dirname, '..', '..', 'database');

const withSeed = process.argv.includes('--seed');

const files = [
  'schema.sql',
  ...(withSeed ? ['seed.sql'] : []),
  'migration_001_elibrary_research_alerts.sql',
  'migration_002_fix_research_sources.sql',
  'migration_003_subscription_index.sql',
  'migration_004_clinical_reference_cards.sql',
  'migration_005_assignment_workflow.sql',
  'migration_006_simulation_engine.sql',
];

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Run this with the same environment as the server (e.g. `railway run npm run migrate`).');
  process.exit(1);
}

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true' } : false,
});

async function run() {
  await client.connect();
  console.log(`Connected. Running ${files.length} file(s)${withSeed ? ' (including demo seed data)' : ''}...\n`);

  for (const file of files) {
    const filePath = path.join(dbDir, file);
    if (!fs.existsSync(filePath)) {
      console.error(`Missing file: ${filePath}`);
      process.exitCode = 1;
      break;
    }
    const sql = fs.readFileSync(filePath, 'utf8');
    process.stdout.write(`-> ${file} ... `);
    try {
      await client.query(sql);
      console.log('done');
    } catch (err) {
      console.log('FAILED');
      console.error(err.message);
      process.exitCode = 1;
      break;
    }
  }

  await client.end();
}

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
