import Event   from '../models/Event.js';
import Expense from '../models/Expense.js';

// ── Get All Events ────────────────────────────────────────────────────────────
// GET /api/events
export const getEvents = async (req, res, next) => {
  try {
    let query = {};

    query.createdBy = req.user._id;

    // Filter by status if provided
    if (req.query.status) {
      query.status = req.query.status;
    }

    const events = await Event.find(query)
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count:   events.length,
      data:    { events },
    });
  } catch (error) {
    next(error);
  }
};

// ── Get Single Event ──────────────────────────────────────────────────────────
// GET /api/events/:id
export const getEventById = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'name email role');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    if (event.createdBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this event',
      });
    }

    res.json({
      success: true,
      data:    { event },
    });
  } catch (error) {
    next(error);
  }
};

// ── Create Event ──────────────────────────────────────────────────────────────
// POST /api/events
export const createEvent = async (req, res, next) => {
  try {
    const {
      name,
      description,
      date,
      category,
      totalBudget,
      status,
    } = req.body;

    if (!name || !totalBudget) {
      return res.status(400).json({
        success: false,
        message: 'Event name and budget are required',
      });
    }

    const event = await Event.create({
      name,
      description,
      date,
      category,
      totalBudget,
      status:    status || 'active',
      createdBy: req.user._id,
    });

    await event.populate('createdBy', 'name email role');

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data:    { event },
    });
  } catch (error) {
    next(error);
  }
};

// ── Update Event ──────────────────────────────────────────────────────────────
// PUT /api/events/:id
export const updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    if (event.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this event',
      });
    }

    const updated = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email role');

    res.json({
      success: true,
      message: 'Event updated successfully',
      data:    { event: updated },
    });
  } catch (error) {
    next(error);
  }
};

// ── Delete Event ──────────────────────────────────────────────────────────────
// DELETE /api/events/:id
export const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    if (event.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this event',
      });
    }

    // Delete all expenses linked to this event
    await Expense.deleteMany({ eventId: req.params.id });
    await event.deleteOne();

    res.json({
      success: true,
      message: 'Event and linked expenses deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};