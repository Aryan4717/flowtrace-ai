import { Router } from 'express';
import healthRoutes from './health';
import queryRoutes from './query';
import flowRoutes from './flow';

const router = Router();
router.use('/health', healthRoutes);
router.use('/query', queryRoutes);
router.use('/flow', flowRoutes);

export default router;
