import express from 'express';
import {
  getLoans,
  getLoanSummary,
  createLoan,
  updateLoan,
  addPayment,
  deleteLoan,
} from '../controllers/loanController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/summary',        protect, getLoanSummary);
router.route('/')
  .get(protect,  getLoans)
  .post(protect, createLoan);
router.route('/:id')
  .put(protect,    updateLoan)
  .delete(protect, deleteLoan);
router.post('/:id/payment',   protect, addPayment);

export default router;