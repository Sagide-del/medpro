import express from 'express';
import cors from 'cors';
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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
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

app.listen(port, () => {
  logger.info(`MedPro Server running on port ${port}`);
  logger.info(`   http://localhost:${port}`);
  logger.info(`   Test: http://localhost:${port}/api/test`);
});

// Export for Vercel serverless deployment
export default app;
