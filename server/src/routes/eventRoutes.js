import express from 'express';
import {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
} from '../controllers/eventController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getEvents)
  .post(protect, authorize('Organizer', 'FinanceAdmin'), createEvent);

router.route('/:id')
  .get(protect, getEventById)
  .put(protect, authorize('Organizer', 'FinanceAdmin'), updateEvent)
  .delete(protect, authorize('Organizer', 'FinanceAdmin'), deleteEvent);

export default router;