import { Router } from 'express';
import healthRoutes from './health';
import queryRoutes from './query';

const router = Router();
router.use('/health', healthRoutes);
router.use('/query', queryRoutes);

export default router;
