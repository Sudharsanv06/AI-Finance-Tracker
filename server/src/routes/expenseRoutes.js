import express from 'express';
import {
  getExpenses,
  createExpense,
  approveExpense,
  rejectExpense,
  markAsPaid,
  deleteExpense,
} from '../controllers/expenseController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getExpenses)
  .post(protect, authorize('Organizer', 'FinanceAdmin'), createExpense);

router.put('/:id/approve',
  protect,
  authorize('Approver', 'FinanceAdmin'),
  approveExpense
);

router.put('/:id/reject',
  protect,
  authorize('Approver', 'FinanceAdmin'),
  rejectExpense
);

router.put('/:id/pay',
  protect,
  authorize('FinanceAdmin'),
  markAsPaid
);

router.delete('/:id',
  protect,
  authorize('Organizer', 'FinanceAdmin'),
  deleteExpense
);

export default router;