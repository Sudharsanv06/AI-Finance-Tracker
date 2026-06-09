import Bill from '../models/Bill.js';

// ── Get All Bills ─────────────────────────────────────────────────────────────
export const getBills = async (req, res, next) => {
  try {
    const bills = await Bill.find({ userId: req.user._id })
      .sort({ dueDate: 1 });

    const now          = new Date();
    const totalMonthly = bills
      .filter((b) => b.frequency === 'monthly')
      .reduce((s, b) => s + b.amount, 0);

    const unpaidThisMonth = bills.filter((b) => b.isDueThisMonth).length;
    const upcomingIn7Days = bills.filter(
      (b) => b.daysUntilDue >= 0 && b.daysUntilDue <= 7 && b.isDueThisMonth
    ).length;

    res.json({
      success: true,
      data: {
        bills,
        totalMonthly,
        unpaidThisMonth,
        upcomingIn7Days,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── Create Bill ───────────────────────────────────────────────────────────────
export const createBill = async (req, res, next) => {
  try {
    const {
      title, amount, category, dueDate,
      isRecurring, frequency, autoPay, notes,
    } = req.body;

    if (!title || !amount || !dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Title, amount and due date are required',
      });
    }

    const bill = await Bill.create({
      title, amount, category, dueDate,
      isRecurring: isRecurring !== false,
      frequency:   frequency || 'monthly',
      autoPay:     autoPay   || false,
      notes,
      userId: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Bill added',
      data:    { bill },
    });
  } catch (error) {
    next(error);
  }
};

// ── Mark Bill as Paid ─────────────────────────────────────────────────────────
export const markBillPaid = async (req, res, next) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }
    if (bill.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const now = new Date();
    bill.isPaid         = true;
    bill.paidDate       = now;
    bill.lastPaidMonth  = now.getMonth() + 1;
    bill.lastPaidYear   = now.getFullYear();
    await bill.save();

    res.json({ success: true, message: 'Bill marked as paid', data: { bill } });
  } catch (error) {
    next(error);
  }
};

// ── Mark Bill as Unpaid ───────────────────────────────────────────────────────
export const markBillUnpaid = async (req, res, next) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }
    if (bill.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    bill.isPaid        = false;
    bill.paidDate      = null;
    bill.lastPaidMonth = null;
    bill.lastPaidYear  = null;
    await bill.save();

    res.json({ success: true, message: 'Bill marked as unpaid', data: { bill } });
  } catch (error) {
    next(error);
  }
};

// ── Update Bill ───────────────────────────────────────────────────────────────
export const updateBill = async (req, res, next) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }
    if (bill.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const updated = await Bill.findByIdAndUpdate(
      req.params.id, req.body, { new: true }
    );
    res.json({ success: true, message: 'Bill updated', data: { bill: updated } });
  } catch (error) {
    next(error);
  }
};

// ── Delete Bill ───────────────────────────────────────────────────────────────
export const deleteBill = async (req, res, next) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }
    if (bill.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await bill.deleteOne();
    res.json({ success: true, message: 'Bill deleted' });
  } catch (error) {
    next(error);
  }
};