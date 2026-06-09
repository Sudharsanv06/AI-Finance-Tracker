import Budget from '../models/Budget.js';

// ── Get Budgets ───────────────────────────────────────────────────────────────
export const getBudgets = async (req, res, next) => {
  try {
    const now   = new Date();
    const month = parseInt(req.query.month) || now.getMonth() + 1;
    const year  = parseInt(req.query.year)  || now.getFullYear();

    const budgets = await Budget.find({
      userId: req.user._id, month, year,
    }).sort({ category: 1 });

    const totalLimit = budgets.reduce((s, b) => s + b.monthlyLimit, 0);
    const totalSpent = budgets.reduce((s, b) => s + (b.spent || 0), 0);
    const alerts     = budgets.filter((b) => b.needsAlert).length;

    res.json({
      success: true,
      data: {
        budgets, totalLimit, totalSpent, alerts,
        month, year,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── Create Budget ─────────────────────────────────────────────────────────────
export const createBudget = async (req, res, next) => {
  try {
    const { category, monthlyLimit, month, year, alertAt } = req.body;
    const now = new Date();

    if (!category || !monthlyLimit) {
      return res.status(400).json({
        success: false,
        message: 'Category and monthly limit are required',
      });
    }

    // Check duplicate
    const existing = await Budget.findOne({
      userId:   req.user._id,
      category,
      month:    month || now.getMonth() + 1,
      year:     year  || now.getFullYear(),
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Budget for ${category} already exists this month`,
      });
    }

    const budget = await Budget.create({
      category,
      monthlyLimit,
      month:   month   || now.getMonth() + 1,
      year:    year    || now.getFullYear(),
      alertAt: alertAt || 80,
      userId:  req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Budget created',
      data:    { budget },
    });
  } catch (error) {
    next(error);
  }
};

// ── Update Budget ─────────────────────────────────────────────────────────────
export const updateBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findById(req.params.id);
    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget not found' });
    }
    if (budget.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const updated = await Budget.findByIdAndUpdate(
      req.params.id, req.body, { new: true }
    );

    res.json({ success: true, message: 'Budget updated', data: { budget: updated } });
  } catch (error) {
    next(error);
  }
};

// ── Delete Budget ─────────────────────────────────────────────────────────────
export const deleteBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findById(req.params.id);
    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget not found' });
    }
    if (budget.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await budget.deleteOne();
    res.json({ success: true, message: 'Budget deleted' });
  } catch (error) {
    next(error);
  }
};