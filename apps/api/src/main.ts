import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import rateLimit from 'express-rate-limit';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { requireAuth } from './middleware/auth';
import childrenRouter from './routes/children';
import growthRouter from './routes/growth';
import milestonesRouter from './routes/milestones';
import vaccinesRouter from './routes/vaccines';
import searchRouter from './routes/search';
import visitPrepRouter from './routes/visitPrep';

const app = express();
const PORT = process.env.PORT || 3333;

// CORS — configurable via env var
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:4200';
app.use(cors({ origin: corsOrigin }));

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

// Global error handler — catch unhandled errors, return generic message
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(`[ERROR] ${new Date().toISOString()} — ${err.stack || err.message}`);
  res.status(500).json({ error: 'An internal server error occurred.' });
});

app.listen(PORT, () => {
  console.log(`Sprout API running on port ${PORT}`);
});
