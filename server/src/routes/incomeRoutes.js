import express from 'express';
import {
  getIncome,
  createIncome,
  updateIncome,
  deleteIncome,
  getIncomeSummary,
} from '../controllers/incomeController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/summary', protect, getIncomeSummary);

router.route('/')
  .get(protect, getIncome)
  .post(protect, createIncome);

router.route('/:id')
  .put(protect, updateIncome)
  .delete(protect, deleteIncome);

export default router;