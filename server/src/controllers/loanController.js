import Loan from '../models/Loan.js';

// ── EMI Calculator Helper ─────────────────────────────────────────────────────
const calculateEMI = (principal, ratePercent, tenureMonths) => {
  if (!ratePercent) return Math.round(principal / tenureMonths);
  const r   = ratePercent / 12 / 100;
  const emi = (principal * r * Math.pow(1 + r, tenureMonths)) /
              (Math.pow(1 + r, tenureMonths) - 1);
  return Math.round(emi);
};

// ── Get All Loans ─────────────────────────────────────────────────────────────
// GET /api/loans
export const getLoans = async (req, res, next) => {
  try {
    const { type, status } = req.query;
    let query = { userId: req.user._id };

    if (type)   query.type   = type;
    if (status) query.status = status;

    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;

    const total = await Loan.countDocuments(query);
    const loans = await Loan.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      count:   loans.length,
      data:    {
        loans,
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

// ── Get Loan Summary ──────────────────────────────────────────────────────────
// GET /api/loans/summary
export const getLoanSummary = async (req, res, next) => {
  try {
    const all = await Loan.find({ userId: req.user._id });

    const taken = all.filter((l) => l.type === 'taken');
    const given = all.filter((l) => l.type === 'given');

    const totalTaken     = taken.reduce((s, l) => s + l.principal,   0);
    const totalGiven     = given.reduce((s, l) => s + l.principal,   0);
    const totalPaidBack  = taken.reduce((s, l) => s + l.totalPaid,   0);
    const totalRecovered = given.reduce((s, l) => s + l.totalPaid,   0);

    const totalRemainingTaken = taken.reduce(
      (s, l) => s + l.remainingAmount, 0
    );
    const totalRemainingGiven = given.reduce(
      (s, l) => s + l.remainingAmount, 0
    );

    // Monthly EMI obligation
    const monthlyEMI = taken
      .filter((l) => l.status === 'active')
      .reduce((s, l) => s + (l.emiAmount || 0), 0);

    res.json({
      success: true,
      data: {
        totalTaken,
        totalGiven,
        totalPaidBack,
        totalRecovered,
        totalRemainingTaken,
        totalRemainingGiven,
        monthlyEMI,
        counts: {
          total:     all.length,
          taken:     taken.length,
          given:     given.length,
          active:    all.filter((l) => l.status === 'active').length,
          completed: all.filter((l) => l.status === 'completed').length,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── Create Loan ───────────────────────────────────────────────────────────────
// POST /api/loans
export const createLoan = async (req, res, next) => {
  try {
    const {
      title, type, loanFrom, loanTo, category,
      principal, interestRate, tenureMonths,
      startDate, notes,
    } = req.body;

    if (!title || !type || !principal) {
      return res.status(400).json({
        success: false,
        message: 'Title, type and principal are required',
      });
    }

    // Auto-calculate EMI
    const emi = calculateEMI(
      principal,
      interestRate || 0,
      tenureMonths || 12
    );

    // Calculate end date
    const start   = startDate ? new Date(startDate) : new Date();
    const endDate = new Date(start);
    endDate.setMonth(endDate.getMonth() + (tenureMonths || 12));

    const loan = await Loan.create({
      title, type, loanFrom, loanTo, category,
      principal,
      interestRate:  interestRate  || 0,
      tenureMonths:  tenureMonths  || 12,
      emiAmount:     emi,
      startDate:     start,
      endDate,
      notes,
      userId: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Loan added successfully',
      data:    { loan },
    });
  } catch (error) {
    next(error);
  }
};

// ── Update Loan ───────────────────────────────────────────────────────────────
// PUT /api/loans/:id
export const updateLoan = async (req, res, next) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) {
      return res.status(404).json({
        success: false, message: 'Loan not found',
      });
    }
    if (loan.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false, message: 'Not authorized',
      });
    }

    const updated = await Loan.findByIdAndUpdate(
      req.params.id, req.body, { new: true }
    );

    res.json({
      success: true,
      message: 'Loan updated',
      data:    { loan: updated },
    });
  } catch (error) {
    next(error);
  }
};

// ── Add Payment ───────────────────────────────────────────────────────────────
// POST /api/loans/:id/payment
export const addPayment = async (req, res, next) => {
  try {
    const { amount, date, note } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false, message: 'Valid payment amount is required',
      });
    }

    const loan = await Loan.findById(req.params.id);
    if (!loan) {
      return res.status(404).json({
        success: false, message: 'Loan not found',
      });
    }
    if (loan.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false, message: 'Not authorized',
      });
    }

    // Add payment
    loan.payments.push({ amount, date: date || Date.now(), note });
    loan.totalPaid += amount;

    // Check if fully paid
    const totalPayable = loan.principal +
      (loan.principal * (loan.interestRate / 100) *
        (loan.tenureMonths / 12));

    if (loan.totalPaid >= totalPayable) {
      loan.status = 'completed';
    }

    await loan.save();

    res.json({
      success: true,
      message: 'Payment recorded',
      data:    { loan },
    });
  } catch (error) {
    next(error);
  }
};

// ── Delete Loan ───────────────────────────────────────────────────────────────
// DELETE /api/loans/:id
export const deleteLoan = async (req, res, next) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) {
      return res.status(404).json({
        success: false, message: 'Loan not found',
      });
    }
    if (loan.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false, message: 'Not authorized',
      });
    }
    await loan.deleteOne();
    res.json({ success: true, message: 'Loan deleted' });
  } catch (error) {
    next(error);
  }
};