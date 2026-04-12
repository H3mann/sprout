import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import childrenRouter from './routes/children';
import growthRouter from './routes/growth';
import milestonesRouter from './routes/milestones';
import vaccinesRouter from './routes/vaccines';
import visitPrepRouter from './routes/visitPrep';

const app = express();
const PORT = process.env.PORT || 3333;

app.use(cors({ origin: 'http://localhost:4200' }));
app.use(express.json());

app.use('/api/children', childrenRouter);
app.use('/api/growth', growthRouter);
app.use('/api/milestones', milestonesRouter);
app.use('/api/vaccines', vaccinesRouter);
app.use('/api/visit-prep', visitPrepRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Sprout API running on http://localhost:${PORT}`);
});
