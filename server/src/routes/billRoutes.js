import express from 'express';
import {
  getBills, createBill, markBillPaid,
  markBillUnpaid, updateBill, deleteBill,
} from '../controllers/billController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getBills)
  .post(protect, createBill);

router.patch('/:id/pay',   protect, markBillPaid);
router.patch('/:id/unpay', protect, markBillUnpaid);

router.route('/:id')
  .put(protect, updateBill)
  .delete(protect, deleteBill);

export default router;