import express from 'express';
import { chat, categorizeExpense } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/chat',       protect, chat);
router.post('/categorize', protect, categorizeExpense);

export default router;