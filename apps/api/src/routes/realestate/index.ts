import { Router } from 'express';
import aiRouter from './ai';
import neighborhoodRouter from './neighborhood';
import dealRouter from './deal';
import savedSearchRouter from './savedSearch';
import zillowRouter from './zillow';

const router = Router();

router.use('/ai', aiRouter);
router.use('/neighborhood', neighborhoodRouter);
router.use('/deal', dealRouter);
router.use('/saved-searches', savedSearchRouter);
router.use('/zillow', zillowRouter);

export default router;
