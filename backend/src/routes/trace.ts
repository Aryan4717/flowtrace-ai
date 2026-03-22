import { Router } from 'express';
import { getTrace } from '../controllers/traceController';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
router.get('/:id', asyncHandler(getTrace));

export default router;
