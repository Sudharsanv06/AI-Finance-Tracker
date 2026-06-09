import express from 'express';
import {
  getInvestments,
  getPortfolioSummary,
  createInvestment,
  updateInvestment,
  deleteInvestment,
} from '../controllers/investmentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/summary', protect, getPortfolioSummary);

router.route('/')
  .get(protect, getInvestments)
  .post(protect, createInvestment);

router.route('/:id')
  .put(protect, updateInvestment)
  .delete(protect, deleteInvestment);

export default router;