import express from 'express';
import {
  getExpenses,
  createExpense,
  updateExpense,
  approveExpense,
  rejectExpense,
  markAsPaid,
  deleteExpense,
  exportExpensesCSV,
} from '../controllers/expenseController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getExpenses)
  .post(protect, createExpense);

router.get('/export/csv', protect, exportExpensesCSV);

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

router.put('/:id',
  protect,
  updateExpense
);

router.delete('/:id',
  protect,
  deleteExpense
);

export default router;