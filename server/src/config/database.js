import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

// Deliberately its own flag rather than "NODE_ENV === production": a
// docker-compose/self-hosted Postgres container has no TLS listener at all,
// so forcing SSL there breaks the connection even in a production-mode
// deploy. Managed providers (Railway, Render, Supabase, Neon) all terminate
// TLS with a certificate chain Node won't validate by default, so DB_SSL=true
// pairs with rejectUnauthorized: false there.
const useSsl = process.env.DB_SSL === 'true';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSsl ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true' } : false,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle Postgres client', err);
});

export const query = (text, params) => pool.query(text, params);

/** Run multiple statements inside a transaction. `fn` receives a client with the same query signature. */
export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn({ query: (text, params) => client.query(text, params) });
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
