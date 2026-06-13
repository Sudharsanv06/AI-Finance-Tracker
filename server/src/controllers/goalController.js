import Goal from '../models/Goal.js';

// ── Get All Goals ─────────────────────────────────────────────────────────────
export const getGoals = async (req, res, next) => {
  try {
    const { status } = req.query;
    let query = { userId: req.user._id };
    if (status) query.status = status;

    const goals = await Goal.find(query).sort({ createdAt: -1 });

    if (!goals || goals.length === 0) {
      return res.status(200).json({
        success: true,
        data: { goals: [], totalTarget: 0, totalSaved: 0, completed: 0, monthlyNeeded: 0 },
      });
    }

    const totalTarget  = goals.reduce((s, g) => s + g.targetAmount,  0);
    const totalSaved   = goals.reduce((s, g) => s + g.currentAmount, 0);
    const completed    = goals.filter((g) => g.status === 'completed').length;
    const monthlyNeeded = goals
      .filter((g) => g.status === 'active')
      .reduce((s, g) => s + (g.monthlyContribution || 0), 0);

    res.json({
      success: true,
      data: {
        goals, totalTarget, totalSaved,
        completed, monthlyNeeded,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── Create Goal ───────────────────────────────────────────────────────────────
export const createGoal = async (req, res, next) => {
  try {
    const {
      title, category, targetAmount,
      currentAmount, monthlyContribution,
      deadline, icon, notes,
    } = req.body;

    if (!title || !targetAmount) {
      return res.status(400).json({
        success: false,
        message: 'Title and target amount are required',
      });
    }

    const goal = await Goal.create({
      title, category,
      targetAmount,
      currentAmount:       currentAmount       || 0,
      monthlyContribution: monthlyContribution || 0,
      deadline:            deadline            || null,
      icon:                icon                || '🎯',
      notes,
      userId: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Goal created',
      data:    { goal },
    });
  } catch (error) {
    next(error);
  }
};

// ── Update Goal ───────────────────────────────────────────────────────────────
export const updateGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }
    if (goal.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Auto complete if target reached
    if (
      req.body.currentAmount &&
      req.body.currentAmount >= goal.targetAmount
    ) {
      req.body.status = 'completed';
    }

    const updated = await Goal.findByIdAndUpdate(
      req.params.id, req.body, { new: true }
    );

    res.json({ success: true, message: 'Goal updated', data: { goal: updated } });
  } catch (error) {
    next(error);
  }
};

// ── Add Contribution ──────────────────────────────────────────────────────────
export const addContribution = async (req, res, next) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required',
      });
    }

    const goal = await Goal.findById(req.params.id);
    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }
    if (goal.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    goal.currentAmount += parseFloat(amount);
    if (goal.currentAmount >= goal.targetAmount) {
      goal.status = 'completed';
    }
    await goal.save();

    res.json({
      success: true,
      message: goal.status === 'completed'
        ? '🎉 Goal completed!'
        : 'Contribution added',
      data: { goal },
    });
  } catch (error) {
    next(error);
  }
};

// ── Delete Goal ───────────────────────────────────────────────────────────────
export const deleteGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }
    if (goal.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await goal.deleteOne();
    res.json({ success: true, message: 'Goal deleted' });
  } catch (error) {
    next(error);
  }
};