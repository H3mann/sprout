import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import rateLimit from 'express-rate-limit';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { requireAuth, buildOptionalAuth } from './middleware/auth';
import { realmSupabase } from './supabase';
import childrenRouter from './routes/children';
import growthRouter from './routes/growth';
import milestonesRouter from './routes/milestones';
import vaccinesRouter from './routes/vaccines';
import searchRouter from './routes/search';
import visitPrepRouter from './routes/visitPrep';
import realestateRouter from './routes/realestate';

const realmOptionalAuth = buildOptionalAuth(realmSupabase);

const app = express();
const PORT = process.env.PORT || 3333;

app.use(helmet());

// CORS — supports comma-separated origins via CORS_ORIGIN env var
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:4200')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests with no origin (e.g. curl, server-to-server)
      if (!origin) return callback(null, true);
      // Exact match against allowed list
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // Allow any Vercel preview URL for this project
      if (/^https:\/\/sprout.*\.vercel\.app$/.test(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
  })
);

app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});
app.use('/api/', limiter);

// Request logging
app.use((req, _res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Health check (no auth)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public routes (no auth — used by home page search)
app.use('/api/search', searchRouter);

// Protected routes
app.use('/api/children', requireAuth, childrenRouter);
app.use('/api/growth', requireAuth, growthRouter);
app.use('/api/milestones', requireAuth, milestonesRouter);
app.use('/api/vaccines', requireAuth, vaccinesRouter);
app.use('/api/visit-prep', requireAuth, visitPrepRouter);
app.use('/api/realestate', realmOptionalAuth, realestateRouter);

// Global error handler — catch unhandled errors, return generic message
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(`[ERROR] ${new Date().toISOString()} — ${err.stack || err.message}`);
  res.status(500).json({ error: 'An internal server error occurred.' });
});

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Sprout API running on 0.0.0.0:${PORT}`);
});
