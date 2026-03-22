import { Router } from 'express';
import { getTraceFlow, getDetectBrokenFlows } from '../controllers/flowController';

const router = Router();
router.get('/trace/:id', getTraceFlow);
router.get('/broken', getDetectBrokenFlows);

export default router;
