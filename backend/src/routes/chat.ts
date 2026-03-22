import { Router } from 'express';
import { postChat } from '../controllers/chatController';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
router.post('/', asyncHandler(postChat));

export default router;
