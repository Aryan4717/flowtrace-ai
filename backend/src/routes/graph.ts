import { Router } from 'express';
import {
  getNode,
  getNeighbors,
  getFullGraphData,
  getEntity,
} from '../controllers/graphController';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
router.get('/', asyncHandler(getFullGraphData));
router.get('/entity/:id', asyncHandler(getEntity));
router.get('/node/:id', asyncHandler(getNode));
router.get('/neighbors/:id', asyncHandler(getNeighbors));

export default router;
