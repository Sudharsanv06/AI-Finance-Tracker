import Income       from '../models/Income.js';
import FamilyMember from '../models/FamilyMember.js';

// ── Get All Income ────────────────────────────────────────────────────────────
// GET /api/income
export const getIncome = async (req, res, next) => {
  try {
    const { source, month, year, familyMember } = req.query;
    let query = { userId: req.user._id };

    if (source)       query.source       = source;
    if (familyMember) query.familyMember = familyMember;

    // Filter by month/year
    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end   = new Date(year, month, 0, 23, 59, 59);
      query.date  = { $gte: start, $lte: end };
    }

    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;

    const total   = await Income.countDocuments(query);
    const pages   = Math.ceil(total / limit);
    const incomes = await Income.find(query)
      .populate('familyMember', 'name relation color')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    // Total income sum
    const allIncome   = await Income.find({ userId: req.user._id });
    const totalAmount = allIncome.reduce((s, i) => s + (i.amount || 0), 0);

    // Monthly income (current month)
    const now         = new Date();
    const monthStart  = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthIncome = await Income.find({
      userId: req.user._id,
      date:   { $gte: monthStart },
    });
    const monthlyTotal = monthIncome.reduce((s, i) => s + (i.amount || 0), 0);

    res.json({
      success: true,
      count:   incomes.length,
      data:    {
        incomes,
        totalAmount,
        monthlyTotal,
        pagination: { total, pages, page, limit,
          hasNext: page < pages,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── Create Income ─────────────────────────────────────────────────────────────
// POST /api/income
export const createIncome = async (req, res, next) => {
  try {
    const {
      source, amount, date, description,
      isRecurring, frequency, familyMember, notes,
    } = req.body;

    if (!source || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Source and amount are required',
      });
    }

    const income = await Income.create({
      source, amount, date, description,
      isRecurring: isRecurring || false,
      frequency:   frequency   || 'one-time',
      familyMember: familyMember || null,
      notes,
      userId: req.user._id,
    });

    await income.populate('familyMember', 'name relation color');

    res.status(201).json({
      success: true,
      message: 'Income added successfully',
      data:    { income },
    });
  } catch (error) {
    next(error);
  }
};

// ── Update Income ─────────────────────────────────────────────────────────────
// PUT /api/income/:id
export const updateIncome = async (req, res, next) => {
  try {
    const income = await Income.findById(req.params.id);
    if (!income) {
      return res.status(404).json({
        success: false, message: 'Income not found',
      });
    }
    if (income.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false, message: 'Not authorized',
      });
    }

    const updated = await Income.findByIdAndUpdate(
      req.params.id, req.body, { new: true, runValidators: true }
    ).populate('familyMember', 'name relation color');

    res.json({
      success: true,
      message: 'Income updated successfully',
      data:    { income: updated },
    });
  } catch (error) {
    next(error);
  }
};

// ── Delete Income ─────────────────────────────────────────────────────────────
// DELETE /api/income/:id
export const deleteIncome = async (req, res, next) => {
  try {
    const income = await Income.findById(req.params.id);
    if (!income) {
      return res.status(404).json({
        success: false, message: 'Income not found',
      });
    }
    if (income.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false, message: 'Not authorized',
      });
    }
    await income.deleteOne();
    res.json({ success: true, message: 'Income deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ── Get Summary ───────────────────────────────────────────────────────────────
// GET /api/income/summary
export const getIncomeSummary = async (req, res, next) => {
  try {
    const now        = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart  = new Date(now.getFullYear(), 0, 1);

    // Monthly income
    const monthlyIncome = await Income.find({
      userId: req.user._id,
      date:   { $gte: monthStart },
    });

    // Yearly income
    const yearlyIncome = await Income.find({
      userId: req.user._id,
      date:   { $gte: yearStart },
    });

    // By source breakdown
    const allIncome = await Income.find({ userId: req.user._id });
    const bySource  = {};
    allIncome.forEach((i) => {
      bySource[i.source] = (bySource[i.source] || 0) + i.amount;
    });

    // Last 6 months chart data
    const chartData = [];
    for (let m = 5; m >= 0; m--) {
      const start = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const end   = new Date(now.getFullYear(), now.getMonth() - m + 1, 0);
      const month = start.toLocaleString('en-IN', { month: 'short' });
      const inc   = await Income.find({
        userId: req.user._id,
        date:   { $gte: start, $lte: end },
      });
      chartData.push({
        month,
        income: inc.reduce((s, i) => s + i.amount, 0),
      });
    }

    res.json({
      success: true,
      data: {
        monthlyTotal: monthlyIncome.reduce((s, i) => s + i.amount, 0),
        yearlyTotal:  yearlyIncome.reduce((s, i)  => s + i.amount, 0),
        allTimeTotal: allIncome.reduce((s, i)      => s + i.amount, 0),
        bySource,
        chartData,
      },
    });
  } catch (error) {
    next(error);
  }
};