import express from 'express';
import {
  getGoals, createGoal, updateGoal,
  addContribution, deleteGoal,
} from '../controllers/goalController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getGoals)
  .post(protect, createGoal);

router.post('/:id/contribute', protect, addContribution);

router.route('/:id')
  .put(protect, updateGoal)
  .delete(protect, deleteGoal);

export default router;