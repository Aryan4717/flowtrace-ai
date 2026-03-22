import { Router } from 'express';
import { postQuery } from '../controllers/queryController';

const router = Router();
router.post('/', postQuery);

export default router;
