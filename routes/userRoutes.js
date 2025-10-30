import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { getMe, updateMe } from '../controllers/userController.js';

const router = express.Router();

router.get('/me', authMiddleware, getMe);
router.put('/me', authMiddleware, updateMe);

export default router;


