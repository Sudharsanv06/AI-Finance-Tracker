import express from 'express';
import {
  getFamilyMembers,
  createFamilyMember,
  updateFamilyMember,
  deleteFamilyMember,
  getDeleteImpact,
} from '../controllers/familyController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getFamilyMembers)
  .post(protect, createFamilyMember);

router.get('/:id/delete-impact', protect, getDeleteImpact);

router.route('/:id')
  .put(protect, updateFamilyMember)
  .delete(protect, deleteFamilyMember);

export default router;