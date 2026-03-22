import { Router } from 'express';
import healthRoutes from './health';
import queryRoutes from './query';
import flowRoutes from './flow';
import chatRoutes from './chat';
import graphRoutes from './graph';
import traceRoutes from './trace';

const router = Router();
router.use('/health', healthRoutes);
router.use('/query', queryRoutes);
router.use('/flow', flowRoutes);
router.use('/chat', chatRoutes);
router.use('/graph', graphRoutes);
router.use('/trace', traceRoutes);

export default router;
