import Income       from '../models/Income.js';
import FamilyMember from '../models/FamilyMember.js';
import { calculateNextRunDate } from '../utils/dateHelpers.js';

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
    const monthEnd    = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const monthIncome = await Income.find({
      userId: req.user._id,
      date:   { $gte: monthStart, $lte: monthEnd },
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

    const clientType = req.headers['x-client-type'];
    const isInternalSource = req.internalSource === 'ai-quick-add';

    let finalFamilyMember = familyMember;
    let assignedFallback = false;

    if (!finalFamilyMember) {
      const fallbackAllowed = clientType === 'mobile' || isInternalSource;
      if (!fallbackAllowed) {
        return res.status(400).json({
          success: false,
          message: 'Family member is required',
        });
      }

      let selfMember = await FamilyMember.findOne({ userId: req.user._id, relation: 'Self' });
      if (!selfMember) {
        selfMember = await FamilyMember.create({
          name:          req.user.name || 'Self',
          relation:      'Self',
          monthlyIncome: 0,
          color:         '#004643',
          userId:        req.user._id,
        });
      }
      finalFamilyMember = selfMember._id;
      assignedFallback = true;

      // Log warning for fallback usage (technical debt tracking)
      console.warn(`[income-fallback] user=${req.user._id} client=${clientType || 'unknown'}`);
    }

    const isTemplate = isRecurring || false;
    const nextRunDate = isTemplate ? calculateNextRunDate(date, frequency || 'monthly').toISOString().split('T')[0] : null;

    const income = await Income.create({
      source, amount, date, description,
      isRecurring: isRecurring || false,
      frequency:   frequency   || 'one-time',
      familyMember: finalFamilyMember,
      notes,
      userId: req.user._id,
      isTemplate,
      active: isTemplate ? true : false,
      nextRunDate,
    });

    await income.populate('familyMember', 'name relation color');

    res.status(201).json({
      success: true,
      message: 'Income added successfully',
      data:    { income },
      assignedFallback,
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

    if (req.body.hasOwnProperty('familyMember') && !req.body.familyMember) {
      return res.status(400).json({
        success: false,
        message: 'Family member is required',
      });
    }

    const updateData = { ...req.body };

    if (updateData.hasOwnProperty('isRecurring')) {
      const isTemplate = updateData.isRecurring || false;
      updateData.isTemplate = isTemplate;
      updateData.active = isTemplate;
      if (isTemplate) {
        const targetDate = updateData.date || income.date;
        const targetFreq = updateData.frequency || income.frequency || 'monthly';
        updateData.nextRunDate = calculateNextRunDate(targetDate, targetFreq).toISOString().split('T')[0];
      } else {
        updateData.nextRunDate = null;
      }
    } else if (income.isTemplate && (updateData.date || updateData.frequency)) {
      const targetDate = updateData.date || income.date;
      const targetFreq = updateData.frequency || income.frequency;
      updateData.nextRunDate = calculateNextRunDate(targetDate, targetFreq).toISOString().split('T')[0];
    }

    if (updateData.familyMember && updateData.familyMember !== (income.familyMember?._id || income.familyMember)?.toString()) {
      const targetMember = await FamilyMember.findById(updateData.familyMember);
      if (!targetMember) {
        return res.status(400).json({
          success: false,
          message: 'Family member not found',
        });
      }
      if (targetMember.archived) {
        return res.status(400).json({
          success: false,
          message: 'Cannot assign income to an archived family member',
        });
      }
    }

    const updated = await Income.findByIdAndUpdate(
      req.params.id, updateData, { new: true, runValidators: true }
    );
    if (updated) {
      await updated.populate('familyMember', 'name relation color');
    }

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
    const { month, year } = req.query;
    const now        = new Date();
    const targetMonth = month ? parseInt(month) : now.getMonth() + 1;
    const targetYear  = year ? parseInt(year) : now.getFullYear();

    const monthStart = new Date(targetYear, targetMonth - 1, 1);
    const monthEnd   = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);
    const yearStart  = new Date(targetYear, 0, 1);
    const yearEnd    = new Date(targetYear, 11, 31, 23, 59, 59, 999);

    // Monthly income
    const monthlyIncome = await Income.find({
      userId: req.user._id,
      date:   { $gte: monthStart, $lte: monthEnd },
    });

    // Yearly income
    const yearlyIncome = await Income.find({
      userId: req.user._id,
      date:   { $gte: yearStart, $lte: yearEnd },
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