import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

import { pool } from './config/database.js';
import { logger } from './utils/logger.js';

import authRoutes from './routes/auth.js';
import assessmentRoutes from './routes/assessments.js';
import worksheetRoutes from './routes/worksheets.js';
import flashcardRoutes from './routes/flashcards.js';
import graphicRoutes from './routes/graphics.js';
import logbookRoutes from './routes/logbook.js';
import videoRoutes from './routes/videos.js';
import groupRoutes from './routes/groups.js';
import paymentRoutes from './routes/payments.js';
import institutionRoutes from './routes/institutions.js';
import userRoutes from './routes/users.js';
import adminRoutes from './routes/admin.js';
import analyticsRoutes from './routes/analytics.js';
import elibraryRoutes from './routes/elibrary.js';
import researchRoutes from './routes/research.js';
import alertRoutes from './routes/alerts.js';
import notificationRoutes from './routes/notifications.js';
import contentRoutes from './routes/content.js'; // deprecated stub — see routes/content.js

// ---- Fail fast on boot rather than crash (or silently misbehave) on the ----
// ---- first request that needs a missing/placeholder secret. -------------
function assertRequiredEnv() {
  const missing = ['DATABASE_URL', 'JWT_SECRET'].filter((key) => !process.env[key]);
  if (missing.length) {
    logger.error(`Missing required environment variable(s): ${missing.join(', ')}. Refusing to start.`);
    process.exit(1);
  }
  if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET.startsWith('change-me')) {
    logger.error('JWT_SECRET is still the placeholder value from .env.example — set a real random secret before running in production.');
    process.exit(1);
  }
}
assertRequiredEnv();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 5000;

// Railway/Render/most PaaS put the app behind a reverse proxy. Without this,
// req.ip is always the proxy's address — which breaks IP-based rate limiting
// below (and would break secure-cookie/HTTPS detection if this app ever used
// cookies).
app.set('trust proxy', 1);

app.use(helmet({
  // This is a JSON API plus a static file server for uploads — it never
  // serves its own HTML, so a script/style CSP designed for HTML pages has
  // nothing to protect and only risks confusing unrelated tooling.
  contentSecurityPolicy: false,
  // Default is "same-origin", which would make browsers refuse to load
  // images/videos/PDFs served from /uploads when the client is on a
  // different origin (e.g. Railway's split client/api domains).
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(compression());

// CLIENT_ORIGIN supports a single origin or a comma-separated list (e.g. staging + prod).
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser requests (no Origin header, e.g. curl/health checks)
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
  })
);

// Baseline abuse protection. Auth and payment-initiation endpoints get their
// own tighter limits below since they're the ones worth brute-forcing/spamming.
app.use(
  '/api',
  rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false })
);
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again in a few minutes.' },
});
app.use('/api/auth/login', strictLimiter);
app.use('/api/auth/register', strictLimiter);
app.use('/api/payments/purchase', strictLimiter);
app.use('/api/payments/subscribe', strictLimiter);

app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Verify database connectivity at boot
pool.connect((err, client, release) => {
  if (err) {
    logger.error('Database connection error:', err.message);
    return;
  }
  logger.info('Database connected successfully.');
  release();
});

app.get('/api/test', (_req, res) => {
  res.json({ message: 'MedPro API is working!', time: new Date().toISOString(), version: '2.0.0' });
});
// Conventional health-check path for uptime monitors/PaaS platforms that expect one.
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/worksheets', worksheetRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/graphics', graphicRoutes);
app.use('/api/logbook', logbookRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/institutions', institutionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/elibrary', elibraryRoutes);
app.use('/api/research', researchRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/content', contentRoutes);

app.use((req, res) => {
  res.status(404).json({ error: `No route for ${req.method} ${req.originalUrl}` });
});

// Centralized error handler
app.use((err, _req, res, _next) => {
  logger.error(err.stack || err.message);
  if (err.code === '23505') return res.status(409).json({ error: 'That record already exists.' });
  if (err.code === '23503') return res.status(400).json({ error: 'Related record not found.' });
  res.status(err.status || 500).json({ error: err.publicMessage || 'Something went wrong on our end.' });
});

const server = app.listen(port, () => {
  logger.info(`MedPro Server running on port ${port}`);
  logger.info(`   http://localhost:${port}`);
  logger.info(`   Test: http://localhost:${port}/api/test`);
});

// Railway/Render send SIGTERM before stopping a container on every redeploy
// or scale-down. Without this, in-flight requests get dropped and the pg
// pool is torn down uncleanly instead of finishing its current queries.
function shutdown(signal) {
  logger.info(`${signal} received, shutting down gracefully...`);
  server.close(async () => {
    try {
      await pool.end();
    } catch (err) {
      logger.error('Error closing database pool:', err.message);
    }
    logger.info('Shutdown complete.');
    process.exit(0);
  });
  // Don't hang forever if a connection refuses to close.
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection:', reason);
});
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception:', err.stack || err.message);
  process.exit(1);
});

// Export for Vercel serverless deployment
export default app;
