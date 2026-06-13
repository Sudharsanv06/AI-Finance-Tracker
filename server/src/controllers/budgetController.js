import Budget from '../models/Budget.js';
import Expense from '../models/Expense.js';

// ── Get Budgets ───────────────────────────────────────────────────────────────
export const getBudgets = async (req, res, next) => {
  try {
    const now   = new Date();
    const month = parseInt(req.query.month) || now.getMonth() + 1;
    const year  = parseInt(req.query.year)  || now.getFullYear();

    const budgets = await Budget.find({
      userId: req.user._id, month, year,
    }).sort({ category: 1 });

    // Calculate dynamic spent for each budget on the fly
    for (let budget of budgets) {
      const start = new Date(year, month - 1, 1);
      const end   = new Date(year, month, 0, 23, 59, 59);

      const expenses = await Expense.find({
        submittedBy: req.user._id,
        category:    budget.category,
        date:        { $gte: start, $lte: end },
        approvalStatus: { $ne: 'Rejected' },
      });

      const spentSum = expenses.reduce((sum, e) => sum + e.amount, 0);

      if (budget.spent !== spentSum) {
        budget.spent = spentSum;
        await budget.save();
      }
    }

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