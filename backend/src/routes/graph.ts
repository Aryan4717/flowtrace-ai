import { Router } from 'express';
import { getNode, getNeighbors } from '../controllers/graphController';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
router.get('/node/:id', asyncHandler(getNode));
router.get('/neighbors/:id', asyncHandler(getNeighbors));

export default router;
