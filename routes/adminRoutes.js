import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { roleMiddleware } from '../middleware/roleMiddleware.js';
import { listUsers, setUserRole } from '../controllers/adminController.js';

const router = express.Router();

router.get('/users', authMiddleware, roleMiddleware(['admin']), listUsers);
router.put('/users/:userId/role', authMiddleware, roleMiddleware(['admin']), setUserRole);

export default router;


