import Expense from '../models/Expense.js';
import Event   from '../models/Event.js';

// ── Get All Expenses ──────────────────────────────────────────────────────────
// GET /api/expenses
export const getExpenses = async (req, res, next) => {
  try {
    let query = {};

    if (req.query.eventId) {
      query.eventId = req.query.eventId;
    }
    if (req.query.status) {
      query.approvalStatus = req.query.status;
    }
    query.submittedBy = req.user._id;

    // ── Pagination ──────────────────────────────────────────────
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;

    const total    = await Expense.countDocuments(query);
    const pages    = Math.ceil(total / limit);

    const expenses = await Expense.find(query)
      .populate('eventId',     'name totalBudget spentAmount')
      .populate('submittedBy', 'name email role')
      .populate('approvedBy',  'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      count:   expenses.length,
      data:    {
        expenses,
        pagination: {
          total,
          pages,
          page,
          limit,
          hasNext: page < pages,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── Create Expense ────────────────────────────────────────────────────────────
// POST /api/expenses
export const createExpense = async (req, res, next) => {
  try {
    const {
      description,
      amount,
      category,
      paymentMethod,
      date,
      eventId,
      notes,
      approvalStatus,
    } = req.body;

    if (!description || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Description and amount are required',
      });
    }

    const cleanEventId = (eventId && eventId !== 'null' && eventId !== 'undefined' && eventId !== '') ? eventId : null;

    // Verify event exists if eventId is provided
    if (cleanEventId) {
      const event = await Event.findById(cleanEventId);
      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Event not found',
        });
      }
    }

    const expense = await Expense.create({
      description,
      amount,
      category,
      paymentMethod,
      date:        date || Date.now(),
      eventId:     cleanEventId,
      notes,
      approvalStatus: cleanEventId ? (approvalStatus || 'Pending') : (approvalStatus || 'Approved'),
      submittedBy: req.user._id,
    });

    // If already approved or paid, increment event spentAmount if eventId is set
    if (expense.eventId && (expense.approvalStatus === 'Approved' || expense.approvalStatus === 'Paid')) {
      await Event.findByIdAndUpdate(expense.eventId, {
        $inc: { spentAmount: expense.amount },
      });
    }

    await expense.populate([
      { path: 'eventId',     select: 'name totalBudget spentAmount' },
      { path: 'submittedBy', select: 'name email role' },
    ]);

    res.status(201).json({
      success: true,
      message: 'Expense submitted successfully',
      data:    { expense },
    });
  } catch (error) {
    next(error);
  }
};

// ── Update Expense ────────────────────────────────────────────────────────────
// PUT /api/expenses/:id
export const updateExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found',
      });
    }

    if (expense.submittedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this expense',
      });
    }

    // Save values for updating event spentAmount
    const oldAmount = expense.amount;
    const oldStatus = expense.approvalStatus;
    const oldEventId = expense.eventId;

    const {
      description,
      amount,
      category,
      paymentMethod,
      date,
      eventId,
      notes,
      approvalStatus,
    } = req.body;

    if (description) expense.description = description;
    if (amount !== undefined) expense.amount = amount;
    if (category) expense.category = category;
    if (paymentMethod) expense.paymentMethod = paymentMethod;
    if (date) expense.date = date;
    if (notes !== undefined) expense.notes = notes;
    if (approvalStatus) expense.approvalStatus = approvalStatus;

    if (eventId !== undefined) {
      const cleanEventId = (eventId && eventId !== 'null' && eventId !== '') ? eventId : null;
      expense.eventId = cleanEventId;
    }

    // Verify event exists if provided
    if (expense.eventId) {
      const event = await Event.findById(expense.eventId);
      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Event not found',
        });
      }
    }

    await expense.save();

    // Adjust spentAmount on the event if eventId exists
    // Deduct old amount from old event if it was Approved or Paid
    if (oldEventId && (oldStatus === 'Approved' || oldStatus === 'Paid')) {
      await Event.findByIdAndUpdate(oldEventId, {
        $inc: { spentAmount: -oldAmount },
      });
    }
    // Add new amount to new event if new status is Approved or Paid
    if (expense.eventId && (expense.approvalStatus === 'Approved' || expense.approvalStatus === 'Paid')) {
      await Event.findByIdAndUpdate(expense.eventId, {
        $inc: { spentAmount: expense.amount },
      });
    }

    await expense.populate([
      { path: 'eventId',     select: 'name totalBudget spentAmount' },
      { path: 'submittedBy', select: 'name email role' },
    ]);

    res.json({
      success: true,
      message: 'Expense updated successfully',
      data: { expense },
    });
  } catch (error) {
    next(error);
  }
};

// ── Approve Expense ───────────────────────────────────────────────────────────
// PUT /api/expenses/:id/approve
export const approveExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found',
      });
    }

    if (expense.approvalStatus !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot approve an expense with status: ${expense.approvalStatus}`,
      });
    }

    expense.approvalStatus = 'Approved';
    expense.approvedBy     = req.user._id;
    await expense.save();

    // Update event spentAmount
    await Event.findByIdAndUpdate(expense.eventId, {
      $inc: { spentAmount: expense.amount },
    });

    await expense.populate([
      { path: 'eventId',     select: 'name totalBudget spentAmount' },
      { path: 'submittedBy', select: 'name email role' },
      { path: 'approvedBy',  select: 'name email role' },
    ]);

    res.json({
      success: true,
      message: 'Expense approved successfully',
      data:    { expense },
    });
  } catch (error) {
    next(error);
  }
};

// ── Reject Expense ────────────────────────────────────────────────────────────
// PUT /api/expenses/:id/reject
export const rejectExpense = async (req, res, next) => {
  try {
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required',
      });
    }

    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found',
      });
    }

    if (expense.approvalStatus === 'Paid') {
      return res.status(400).json({
        success: false,
        message: 'Cannot reject a paid expense',
      });
    }

    expense.approvalStatus  = 'Rejected';
    expense.approvedBy      = req.user._id;
    expense.rejectionReason = rejectionReason;
    await expense.save();

    await expense.populate([
      { path: 'eventId',     select: 'name totalBudget spentAmount' },
      { path: 'submittedBy', select: 'name email role' },
      { path: 'approvedBy',  select: 'name email role' },
    ]);

    res.json({
      success: true,
      message: 'Expense rejected',
      data:    { expense },
    });
  } catch (error) {
    next(error);
  }
};

// ── Mark as Paid ──────────────────────────────────────────────────────────────
// PUT /api/expenses/:id/pay
export const markAsPaid = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found',
      });
    }

    if (expense.approvalStatus !== 'Approved') {
      return res.status(400).json({
        success: false,
        message: 'Only approved expenses can be marked as paid',
      });
    }

    expense.approvalStatus = 'Paid';
    await expense.save();

    await expense.populate([
      { path: 'eventId',     select: 'name totalBudget spentAmount' },
      { path: 'submittedBy', select: 'name email role' },
      { path: 'approvedBy',  select: 'name email role' },
    ]);

    res.json({
      success: true,
      message: 'Expense marked as paid',
      data:    { expense },
    });
  } catch (error) {
    next(error);
  }
};

// ── Delete Expense ────────────────────────────────────────────────────────────
// DELETE /api/expenses/:id
export const deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found',
      });
    }

    // Only submitter can delete
    if (expense.submittedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this expense',
      });
    }

    // If approved/paid, deduct from event spentAmount if eventId is set
    if (
      expense.eventId &&
      (expense.approvalStatus === 'Approved' ||
      expense.approvalStatus === 'Paid')
    ) {
      await Event.findByIdAndUpdate(expense.eventId, {
        $inc: { spentAmount: -expense.amount },
      });
    }

    await expense.deleteOne();

    res.json({
      success: true,
      message: 'Expense deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc  Export expenses as CSV
// @route GET /api/expenses/export/csv
// @access Private
export const exportExpensesCSV = async (req, res, next) => {
  try {
    let query = { submittedBy: req.user._id };

    const expenses = await Expense.find(query)
      .populate('eventId',     'name')
      .populate('submittedBy', 'name')
      .sort({ createdAt: -1 });

    // Build CSV manually — no extra package needed
    const headers = [
      'Date',
      'Description',
      'Event',
      'Category',
      'Amount (INR)',
      'Payment Method',
      'Status',
      'Submitted By',
      'Notes',
    ].join(',');

    const rows = expenses.map((e) => [
      e.date ? new Date(e.date).toISOString().split('T')[0] : '',
      `"${(e.description || '').replace(/"/g, '""')}"`,
      `"${(e.eventId?.name || '').replace(/"/g, '""')}"`,
      e.category        || '',
      e.amount          || 0,
      e.paymentMethod   || '',
      e.approvalStatus  || '',
      `"${(e.submittedBy?.name || '').replace(/"/g, '""')}"`,
      `"${(e.notes || '').replace(/"/g, '""')}"`,
    ].join(','));

    const csv = [headers, ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="eventfi-expenses-${Date.now()}.csv"`
    );
    res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
};