import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { requireAuth } from './middleware/auth';
import childrenRouter from './routes/children';
import growthRouter from './routes/growth';
import milestonesRouter from './routes/milestones';
import vaccinesRouter from './routes/vaccines';
import visitPrepRouter from './routes/visitPrep';

const app = express();
const PORT = process.env.PORT || 3333;

app.use(cors({ origin: 'http://localhost:4200' }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/children', requireAuth, childrenRouter);
app.use('/api/growth', requireAuth, growthRouter);
app.use('/api/milestones', requireAuth, milestonesRouter);
app.use('/api/vaccines', requireAuth, vaccinesRouter);
app.use('/api/visit-prep', requireAuth, visitPrepRouter);

app.listen(PORT, () => {
  console.log(`Sprout API running on http://localhost:${PORT}`);
});
