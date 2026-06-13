import Investment from '../models/Investment.js';

// ── Get All Investments ───────────────────────────────────────────────────────
// GET /api/investments
export const getInvestments = async (req, res, next) => {
  try {
    const { type, status } = req.query;
    let query = { userId: req.user._id };

    if (type)   query.type   = type;
    if (status) query.status = status;

    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;

    const total       = await Investment.countDocuments(query);
    const investments = await Investment.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    if (!investments || investments.length === 0) {
      return res.status(200).json([]);
    }

    res.json({
      success: true,
      count:   investments.length,
      data:    {
        investments,
        pagination: {
          total,
          pages:   Math.ceil(total / limit),
          page,
          limit,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── Get Portfolio Summary ─────────────────────────────────────────────────────
// GET /api/investments/summary
export const getPortfolioSummary = async (req, res, next) => {
  try {
    const all = await Investment.find({ userId: req.user._id });

    const totalInvested     = all.reduce((s, i) => s + (i.investedAmount || 0), 0);
    const totalCurrentValue = all.reduce((s, i) => s + (i.currentValue   || 0), 0);
    const totalReturns      = totalCurrentValue - totalInvested;
    const returnsPercent    = totalInvested
      ? ((totalReturns / totalInvested) * 100).toFixed(2)
      : 0;

    // By type breakdown
    const byType = {};
    all.forEach((i) => {
      if (!byType[i.type]) {
        byType[i.type] = { invested: 0, currentValue: 0, count: 0 };
      }
      byType[i.type].invested      += i.investedAmount  || 0;
      byType[i.type].currentValue  += i.currentValue    || 0;
      byType[i.type].count         += 1;
    });

    // Status counts
    const active    = all.filter((i) => i.status === 'active').length;
    const matured   = all.filter((i) => i.status === 'matured').length;
    const withdrawn = all.filter((i) => i.status === 'withdrawn').length;

    // Monthly contribution total
    const monthlyContribution = all
      .filter((i) => i.status === 'active')
      .reduce((s, i) => s + (i.monthlyContribution || 0), 0);

    res.json({
      success: true,
      data: {
        totalInvested,
        totalCurrentValue,
        totalReturns,
        returnsPercent,
        byType,
        counts: { total: all.length, active, matured, withdrawn },
        monthlyContribution,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── Create Investment ─────────────────────────────────────────────────────────
// POST /api/investments
export const createInvestment = async (req, res, next) => {
  try {
    const {
      name, type, platform, investedAmount,
      currentValue, startDate, maturityDate,
      interestRate, monthlyContribution, status, notes,
    } = req.body;

    if (!name || !type || !investedAmount) {
      return res.status(400).json({
        success: false,
        message: 'Name, type and invested amount are required',
      });
    }

    const investment = await Investment.create({
      name, type, platform,
      investedAmount,
      currentValue:        currentValue        || investedAmount,
      startDate:           startDate           || Date.now(),
      maturityDate:        maturityDate        || null,
      interestRate:        interestRate        || 0,
      monthlyContribution: monthlyContribution || 0,
      status:              status              || 'active',
      notes,
      userId: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Investment added successfully',
      data:    { investment },
    });
  } catch (error) {
    next(error);
  }
};

// ── Update Investment ─────────────────────────────────────────────────────────
// PUT /api/investments/:id
export const updateInvestment = async (req, res, next) => {
  try {
    const investment = await Investment.findById(req.params.id);

    if (!investment) {
      return res.status(404).json({
        success: false, message: 'Investment not found',
      });
    }
    if (investment.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false, message: 'Not authorized',
      });
    }

    const updated = await Investment.findByIdAndUpdate(
      req.params.id, req.body, { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Investment updated',
      data:    { investment: updated },
    });
  } catch (error) {
    next(error);
  }
};

// ── Delete Investment ─────────────────────────────────────────────────────────
// DELETE /api/investments/:id
export const deleteInvestment = async (req, res, next) => {
  try {
    const investment = await Investment.findById(req.params.id);

    if (!investment) {
      return res.status(404).json({
        success: false, message: 'Investment not found',
      });
    }
    if (investment.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false, message: 'Not authorized',
      });
    }

    await investment.deleteOne();
    res.json({ success: true, message: 'Investment deleted' });
  } catch (error) {
    next(error);
  }
};